import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import { pathToFileURL } from 'url';
import type * as vscode from 'vscode';
import { MarkdownEngineOutput, Notebook, utility } from '../index';
import { NotebookConfig, WebviewConfig } from '../notebook';
import {
  ServerConfigContext,
  createConfigContext,
  loadServerConfig,
  updateServerConfigKey,
} from './config';
import {
  encodePathSegments,
  isMarkdownFile,
  isPathWithinRoot,
  listMarkdownFiles,
} from './markdown-files';
import { SSEHub } from './sse';
import { resolveMountedFile, serveFileFromPath } from './static';
import { MarkdownWatcher } from './watcher';

export interface ServeOptions {
  /**
   * Absolute paths of the directories to serve — like a VS Code multi-root
   * workspace, each directory keeps its own `.crossnote` config and its own
   * Notebook, while the global config layer is shared.
   */
  directories: string[];
  /** Explicit port; `0` picks a free one. Default `3000`. */
  port?: number;
  /** Default `127.0.0.1`. */
  host?: string;
  /** Load config from VS Code user settings on top of the global config. */
  vscode?: boolean;
  /** Path to the VS Code user `settings.json` (auto-detected by default). */
  vscodeSettingsPath?: string;
  /** Override the crossnote build directory (tests). */
  crossnoteBuildDirectory?: string;
  /** Override the global config directory (tests). */
  globalConfigDirectory?: string;
}

export interface ServeServer {
  url: string;
  port: number;
  host: string;
  /** All served roots, in the order they were given. */
  rootDirectories: string[];
  /** First served root (single-directory convenience). */
  rootDirectory: string;
  close(): Promise<void>;
}

/**
 * The webview bundle posts messages through `acquireVsCodeApi()` when it is
 * available. Inside the server app every preview lives in an iframe, so we
 * inject this shim before `preview.js` loads and forward messages to the
 * parent (the server app), which relays them to the HTTP server.
 */
const PREVIEW_HOST_SHIM = `<script>
(function () {
  if (window.acquireVsCodeApi) { return; }
  var api = null;
  window.acquireVsCodeApi = function () {
    if (api) { return api; }
    api = {
      postMessage: function (message) {
        window.parent.postMessage(message, window.location.origin);
      },
      getState: function () {
        try {
          return JSON.parse(localStorage.getItem('crossnote-preview-state') || 'null');
        } catch (error) { return null; }
      },
      setState: function (state) {
        try {
          localStorage.setItem('crossnote-preview-state', JSON.stringify(state));
        } catch (error) { /* storage unavailable */ }
      },
    };
    return api;
  };
  document.addEventListener('keydown', function (event) {
    var key = event.key.toLowerCase();
    var action = null;
    if ((event.metaKey || event.ctrlKey) && !event.altKey && key === 'p') {
      action = 'open-file-picker';
    } else if ((event.metaKey || event.ctrlKey) && !event.altKey && key === '\\\\') {
      action = 'split-pane';
    } else if (event.altKey && key === 'w') {
      action = 'close-tab';
    }
    if (action) {
      event.preventDefault();
      window.parent.postMessage(
        { command: '__serverAppShortcut', args: [action] },
        window.location.origin
      );
    }
  }, true);
})();
</script>`;

function appShellHTML(serverInfo: {
  rootDirectories: string[];
  vscode: boolean;
  url: string;
}): string {
  const serialized = JSON.stringify(serverInfo).replace(/</g, '\\u003c');
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>crossnote</title>
    <link rel="stylesheet" href="/assets/server-app/server-app.css">
  </head>
  <body>
    <script>window.__CROSSNOTE_SERVER__ = ${serialized};</script>
    <div id="root"></div>
    <script src="/assets/server-app/server-app.js"></script>
  </body>
</html>`;
}

interface LastRender {
  markdown: string;
  html: string;
  tocHTML: string;
  jsAndCssFiles: string[];
  yamlConfig: Record<string, unknown>;
}

/**
 * Start the crossnote standalone preview server.
 *
 * The server keeps one {@link Notebook} per served directory (like a VS Code
 * multi-root workspace: each folder owns its `.crossnote` config, the global
 * config layer is shared) and renders markdown through the regular
 * `MarkdownEngine`, exactly like the VS Code extension does. Previews are
 * served at `/preview?file=…` as full webview pages (same React preview,
 * unmodified) and updated live over SSE.
 */
export async function startServeServer(
  options: ServeOptions,
): Promise<ServeServer> {
  const rootDirectories: string[] = [];
  for (const directory of options.directories) {
    const resolved = path.resolve(directory);
    const stat = await fs.promises.stat(resolved).catch(() => null);
    if (!stat?.isDirectory()) {
      throw new Error(`Not a directory: ${resolved}`);
    }
    if (!rootDirectories.includes(resolved)) {
      rootDirectories.push(resolved);
    }
  }
  const rootDirectory = rootDirectories[0];

  const buildDirectory = path.resolve(
    options.crossnoteBuildDirectory ?? utility.getCrossnoteBuildDirectory(),
  );
  utility.setCrossnoteBuildDirectory(buildDirectory);

  // A truthy panel makes `utility.addFileProtocol` consult our external
  // mapper below; the engine never dereferences the panel.
  const dummyPanel = {} as unknown as vscode.WebviewPanel;
  utility.useExternalAddFileProtocolFunction((filePath: string) => {
    if (isPathWithinRoot(buildDirectory, filePath)) {
      const relativePath = path
        .relative(buildDirectory, filePath)
        .split(path.sep)
        .join('/');
      return `/assets/${encodePathSegments(relativePath)}`;
    }
    for (let index = 0; index < rootDirectories.length; index++) {
      if (isPathWithinRoot(rootDirectories[index], filePath)) {
        const relativePath = path
          .relative(rootDirectories[index], filePath)
          .split(path.sep)
          .join('/');
        // With several roots the same relative path may exist in more than
        // one of them; `?root=` pins the mount for /files resolution.
        const rootHint = rootDirectories.length > 1 ? `?root=${index}` : '';
        return `/files/${encodePathSegments(relativePath)}${rootHint}`;
      }
    }
    return pathToFileURL(filePath).href;
  });

  // One config context + Notebook per root, sharing the global config layer.
  const configContexts: ServerConfigContext[] = await Promise.all(
    rootDirectories.map((root) =>
      createConfigContext({
        rootDirectory: root,
        vscode: options.vscode,
        vscodeSettingsPath: options.vscodeSettingsPath,
        globalConfigDirectory: options.globalConfigDirectory,
      }),
    ),
  );
  const notebooks: Notebook[] = await Promise.all(
    configContexts.map(async (context) =>
      Notebook.init({
        notebookPath: context.rootDirectory,
        config: (await loadServerConfig(context)) as Partial<NotebookConfig>,
      }),
    ),
  );

  function rootIndexOf(absolutePath: string): number {
    const resolved = path.resolve(absolutePath);
    return rootDirectories.findIndex((root) =>
      isPathWithinRoot(root, resolved),
    );
  }

  function notebookForFile(absolutePath: string): Notebook | null {
    const index = rootIndexOf(absolutePath);
    return index === -1 ? null : notebooks[index];
  }

  const sse = new SSEHub();
  const renderTokens = new Map<string, number>();
  const lastRenderByFile = new Map<string, LastRender>();

  async function renderFile(
    absolutePath: string,
    renderOptions: { triggeredBySave?: boolean } = {},
  ): Promise<void> {
    const token = (renderTokens.get(absolutePath) ?? 0) + 1;
    renderTokens.set(absolutePath, token);
    try {
      const notebook = notebookForFile(absolutePath);
      if (!notebook) {
        return;
      }
      const text = await fs.promises.readFile(absolutePath, 'utf-8');
      const engine = notebook.getNoteMarkdownEngine(absolutePath);
      const output: MarkdownEngineOutput = await engine.parseMD(text, {
        isForPreview: true,
        useRelativeFilePath: false,
        hideFrontMatter: false,
        triggeredBySave: renderOptions.triggeredBySave,
        vscodePreviewPanel: dummyPanel,
      });
      // Drop superseded renders (a newer edit already re-rendered this file).
      if (renderTokens.get(absolutePath) !== token) {
        return;
      }
      lastRenderByFile.set(absolutePath, {
        markdown: text,
        html: output.html,
        tocHTML: output.tocHTML,
        jsAndCssFiles: output.JSAndCssFiles,
        yamlConfig: output.yamlConfig,
      });
      sse.broadcast({
        type: 'updateHtml',
        file: absolutePath,
        payload: {
          markdown: text,
          html: output.html,
          tocHTML: output.tocHTML,
          totalLineCount: text.split('\n').length,
          sourceUri: absolutePath,
          sourceScheme: 'file',
          id: (output.yamlConfig['id'] as string) || '',
          class: (output.yamlConfig['class'] as string) || '',
          jsAndCssFiles: output.JSAndCssFiles,
        },
      });
    } catch (error) {
      console.error(
        `crossnote serve: failed to render ${absolutePath}:`,
        error,
      );
    }
  }

  async function renderPreviewPage(absolutePath: string): Promise<string> {
    const notebook = notebookForFile(absolutePath);
    if (!notebook) {
      throw new Error('file is outside the served directories');
    }
    const text = await fs.promises.readFile(absolutePath, 'utf-8');
    const engine = notebook.getNoteMarkdownEngine(absolutePath);
    return engine.generateHTMLTemplateForPreview({
      inputString: text,
      vscodePreviewPanel: dummyPanel,
      config: {
        sourceUri: absolutePath,
        isVSCode: false,
        isServerApp: true,
      } as WebviewConfig,
      // Injected right before preview.js by the template; bridges the
      // webview protocol to the parent server app.
      scripts: PREVIEW_HOST_SHIM,
      // No <base>: same-document `#anchor` links must keep resolving to the
      // /preview document itself.
      head: '',
    });
  }

  function assertFileWithinRoots(absolutePath: string): string | null {
    const resolved = path.resolve(absolutePath);
    return rootIndexOf(resolved) === -1 ? null : resolved;
  }

  async function readJSONBody(
    request: http.IncomingMessage,
  ): Promise<Record<string, unknown>> {
    const chunks: Buffer[] = [];
    for await (const chunk of request) {
      chunks.push(chunk as Buffer);
    }
    const raw = Buffer.concat(chunks).toString('utf-8');
    if (!raw) {
      return {};
    }
    return JSON.parse(raw) as Record<string, unknown>;
  }

  function sendJSON(
    response: http.ServerResponse,
    statusCode: number,
    body: unknown,
  ): void {
    const payload = JSON.stringify(body);
    response.writeHead(statusCode, {
      'content-type': 'application/json; charset=utf-8',
    });
    response.end(payload);
  }

  /**
   * The webview→host command bridge. The webview protocol is
   * `{command, args}` (see `src/webview/containers/preview.ts`); the server
   * app relays iframe messages here. Only explicitly handled commands are
   * accepted — everything else is dropped, mirroring the extension's
   * allowlist approach.
   */
  async function handleCommand(body: Record<string, unknown>): Promise<void> {
    const command = String(body['command'] ?? '');
    const args = Array.isArray(body['args']) ? body['args'] : [];
    switch (command) {
      case 'updateMarkdown': {
        // args: [sourceUri, text]
        const sourceUri = assertFileWithinRoots(String(args[0] ?? ''));
        const text = typeof args[1] === 'string' ? args[1] : null;
        if (!sourceUri || !isMarkdownFile(sourceUri) || text === null) {
          return;
        }
        const current = await fs.promises
          .readFile(sourceUri, 'utf-8')
          .catch(() => null);
        if (current === text) {
          // Nothing changed; still refresh in case the renderer missed an
          // earlier update.
          await renderFile(sourceUri);
          return;
        }
        await fs.promises.writeFile(sourceUri, text, 'utf-8');
        // Render immediately for a snappy in-preview editor save; the file
        // watcher will fire again for the same content and re-render
        // idempotently.
        await renderFile(sourceUri, { triggeredBySave: true });
        sse.broadcast({ type: 'noteSaved', file: sourceUri });
        return;
      }
      case 'refreshPreview': {
        const file = assertFileWithinRoots(String(body['file'] ?? ''));
        if (file) {
          await renderFile(file);
        }
        return;
      }
      case 'runCodeChunk': {
        // args: [sourceUri, codeChunkId]
        const file = assertFileWithinRoots(String(body['file'] ?? ''));
        const codeChunkId = typeof args[1] === 'string' ? args[1] : null;
        if (file && codeChunkId) {
          const fileNotebook = notebookForFile(file);
          if (!fileNotebook) {
            return;
          }
          const engine = fileNotebook.getNoteMarkdownEngine(file);
          await engine.runCodeChunk(codeChunkId);
          await renderFile(file, { triggeredBySave: true });
        }
        return;
      }
      case 'runAllCodeChunks': {
        const file = assertFileWithinRoots(String(body['file'] ?? ''));
        if (file) {
          const fileNotebook = notebookForFile(file);
          if (!fileNotebook) {
            return;
          }
          const engine = fileNotebook.getNoteMarkdownEngine(file);
          await engine.runCodeChunks();
          await renderFile(file, { triggeredBySave: true });
        }
        return;
      }
      case 'cacheCodeChunkResult': {
        // args: [sourceUri, codeChunkId, result]
        const file = assertFileWithinRoots(String(body['file'] ?? ''));
        const codeChunkId = typeof args[1] === 'string' ? args[1] : null;
        const result = typeof args[2] === 'string' ? args[2] : null;
        if (file && codeChunkId && result !== null) {
          const fileNotebook = notebookForFile(file);
          fileNotebook
            ?.getNoteMarkdownEngine(file)
            .cacheCodeChunkResult(codeChunkId, result);
        }
        return;
      }
      case 'setPreviewTheme':
      case 'setCodeBlockTheme':
      case 'setRevealjsTheme': {
        // args: [sourceUri, theme] — persist to the vscode settings or the
        // global crossnote config, then apply and notify every client.
        const configKey: string =
          command === 'setPreviewTheme'
            ? 'previewTheme'
            : command === 'setCodeBlockTheme'
              ? 'codeBlockTheme'
              : 'revealjsTheme';
        const theme = typeof args[1] === 'string' ? args[1] : null;
        if (!theme) {
          return;
        }
        try {
          await updateServerConfigKey(configContexts[0], configKey, theme);
          // The write went to a shared layer (vscode settings or the global
          // config), so re-merge and apply for every root. A workspace
          // `.crossnote` override keeps winning where present.
          await Promise.all(
            configContexts.map(async (context, index) => {
              const mergedConfig = (await loadServerConfig(
                context,
              )) as Partial<NotebookConfig>;
              notebooks[index].updateConfig(mergedConfig);
              notebooks[index].clearAllNoteMarkdownEngineCaches();
            }),
          );
          // Styles live in each preview page's <head>, so clients reload
          // their iframes on configChanged — same as the extension's
          // refreshAllPreviews.
          sse.broadcast({
            type: 'configChanged',
            configs: notebooks.map((notebook) => notebook.config),
          });
        } catch (error) {
          console.error(
            `crossnote serve: failed to persist ${configKey}:`,
            error,
          );
        }
        return;
      }
      case 'clickTaskListCheckbox': {
        // args: [sourceUri, dataLine] — toggle `[ ]` ↔ `[x]` in the file.
        const sourceUri = assertFileWithinRoots(String(args[0] ?? ''));
        const dataLine = typeof args[1] === 'number' ? args[1] : null;
        if (!sourceUri || !isMarkdownFile(sourceUri) || dataLine === null) {
          return;
        }
        const text = await fs.promises
          .readFile(sourceUri, 'utf-8')
          .catch(() => null);
        if (text === null) {
          return;
        }
        const lines = text.split('\n');
        const line = lines[dataLine];
        if (line === undefined) {
          return;
        }
        if (line.includes('[ ]')) {
          lines[dataLine] = line.replace('[ ]', '[x]');
        } else if (line.match(/\[[xX]\]/)) {
          lines[dataLine] = line.replace(/\[[xX]\]/, '[ ]');
        } else {
          return;
        }
        await fs.promises.writeFile(sourceUri, lines.join('\n'), 'utf-8');
        await renderFile(sourceUri, { triggeredBySave: true });
        return;
      }
      default:
        return;
    }
  }

  const requestListener = async (
    request: http.IncomingMessage,
    response: http.ServerResponse,
  ): Promise<void> => {
    try {
      const requestUrl = new URL(
        request.url ?? '/',
        `http://${request.headers.host ?? '127.0.0.1'}`,
      );
      const urlPath = requestUrl.pathname;

      if (
        request.method === 'GET' &&
        (urlPath === '/' || urlPath === '/index.html')
      ) {
        response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        response.end(
          appShellHTML({
            rootDirectories,
            vscode: !!options.vscode,
            url: `http://${request.headers.host ?? `127.0.0.1:${port}`}`,
          }),
        );
        return;
      }

      if (request.method === 'GET' && urlPath === '/preview') {
        const file = assertFileWithinRoots(
          requestUrl.searchParams.get('file') ?? '/',
        );
        if (!file || !isMarkdownFile(file)) {
          response.writeHead(400, { 'content-type': 'text/plain' });
          response.end('invalid file');
          return;
        }
        try {
          const html = await renderPreviewPage(file);
          response.writeHead(200, {
            'content-type': 'text/html; charset=utf-8',
          });
          response.end(html);
        } catch (error) {
          console.error(
            'crossnote serve: failed to build preview page:',
            error,
          );
          response.writeHead(404, {
            'content-type': 'text/html; charset=utf-8',
          });
          response.end(
            `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>crossnote</title></head>` +
              `<body style="font-family: sans-serif; color: #888; padding: 48px; text-align: center;">` +
              `<h1 style="font-weight: 300;">crossnote</h1>` +
              `<p>Failed to render <code>${file.replace(/</g, '&lt;')}</code></p>` +
              `<p style="font-size: 12px; color: #aaa;">${String(error).replace(/</g, '&lt;')}</p>` +
              `</body></html>`,
          );
        }
        return;
      }

      if (request.method === 'GET' && urlPath.startsWith('/assets/')) {
        const asset = resolveMountedFile(
          [buildDirectory],
          '/assets',
          urlPath,
          null,
        );
        if (asset) {
          serveFileFromPath(response, asset);
        } else {
          response.writeHead(404, { 'content-type': 'text/plain' });
          response.end('not found');
        }
        return;
      }

      if (request.method === 'GET' && urlPath.startsWith('/files/')) {
        // `?root=` pins the mount when several roots are served (the URL
        // mapper appends it in multi-root mode); without it every root is
        // tried in order.
        const rootParam = requestUrl.searchParams.get('root');
        const preferredRoot =
          rootParam === null ? null : parseInt(rootParam, 10);
        const file = resolveMountedFile(
          rootDirectories,
          '/files',
          urlPath,
          Number.isInteger(preferredRoot) ? preferredRoot : null,
        );
        if (file) {
          serveFileFromPath(response, file);
        } else {
          response.writeHead(404, { 'content-type': 'text/plain' });
          response.end('not found');
        }
        return;
      }

      if (request.method === 'GET' && urlPath === '/api/events') {
        sse.addClient(response);
        return;
      }

      if (request.method === 'GET' && urlPath === '/api/files') {
        const perRoot = await Promise.all(
          rootDirectories.map(async (root) => {
            const files = await listMarkdownFiles(root);
            return files.map((file) => ({ ...file, rootPath: root }));
          }),
        );
        const files = perRoot
          .flat()
          .sort(
            (a, b) =>
              a.relativePath.localeCompare(b.relativePath) ||
              a.rootPath.localeCompare(b.rootPath),
          );
        sendJSON(response, 200, { files });
        return;
      }

      if (request.method === 'GET' && urlPath === '/api/config') {
        sendJSON(response, 200, {
          config: notebooks[0].config,
          configs: notebooks.map((notebook) => notebook.config),
        });
        return;
      }

      if (request.method === 'POST' && urlPath === '/api/command') {
        const body = await readJSONBody(request);
        await handleCommand(body);
        sendJSON(response, 200, { ok: true });
        return;
      }

      if (urlPath === '/favicon.ico') {
        response.writeHead(204);
        response.end();
        return;
      }

      response.writeHead(404, { 'content-type': 'text/plain' });
      response.end('not found');
    } catch (error) {
      console.error('crossnote serve: request failed:', error);
      if (!response.headersSent) {
        response.writeHead(500, { 'content-type': 'text/plain' });
      }
      response.end('internal error');
    }
  };

  const server = http.createServer((request, response) => {
    void requestListener(request, response);
  });

  const host = options.host ?? '127.0.0.1';
  const requestedPort = options.port ?? 3000;
  const port = await listenWithFallback(server, host, requestedPort);

  const onWatchChange = (change: {
    absolutePath: string;
    type: 'changed' | 'deleted';
  }) => {
    if (change.type === 'deleted') {
      lastRenderByFile.delete(change.absolutePath);
      sse.broadcast({
        type: 'fileDeleted',
        file: change.absolutePath,
      });
    } else {
      void renderFile(change.absolutePath);
    }
  };
  const watchers = rootDirectories.map(
    (root) => new MarkdownWatcher(root, onWatchChange),
  );
  await Promise.all(watchers.map((watcher) => watcher.start()));

  return {
    url: `http://${host}:${port}`,
    port,
    host,
    rootDirectories,
    rootDirectory,
    close: async () => {
      watchers.forEach((watcher) => watcher.close());
      sse.dispose();
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    },
  };
}

function listenWithFallback(
  server: http.Server,
  host: string,
  port: number,
): Promise<number> {
  return new Promise((resolve, reject) => {
    const tryPort = (candidate: number, remainingAttempts: number) => {
      const onError = (error: NodeJS.ErrnoException) => {
        if (
          error.code === 'EADDRINUSE' &&
          remainingAttempts > 0 &&
          candidate !== 0
        ) {
          tryPort(candidate + 1, remainingAttempts - 1);
        } else {
          reject(error);
        }
      };
      server.once('error', onError);
      server.listen(candidate, host, () => {
        server.off('error', onError);
        const address = server.address();
        if (!address || typeof address === 'string') {
          reject(new Error('failed to bind server'));
          return;
        }
        resolve(address.port);
      });
    };
    // When the caller explicitly chose a port, don't wander off elsewhere.
    tryPort(port, port === 3000 ? 20 : 0);
  });
}
