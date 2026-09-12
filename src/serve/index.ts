import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import { pathToFileURL } from 'url';
import type * as vscode from 'vscode';
import { MarkdownEngineOutput, Notebook, utility } from '../index';
import { NotebookConfig, WebviewConfig } from '../notebook';
import { loadServerConfig } from './config';
import {
  encodePathSegments,
  isMarkdownFile,
  isPathWithinRoot,
  listMarkdownFiles,
} from './markdown-files';
import { SSEHub } from './sse';
import { serveFileFromRoot } from './static';
import { MarkdownWatcher } from './watcher';

export interface ServeOptions {
  /** Absolute path of the directory to serve. */
  directory: string;
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
  rootDirectory: string;
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
 * The server keeps one {@link Notebook} for the served directory and renders
 * markdown through the regular `MarkdownEngine`, exactly like the VS Code
 * extension does. Previews are served at `/preview?file=…` as full webview
 * pages (same React preview, unmodified) and updated live over SSE.
 */
export async function startServeServer(
  options: ServeOptions,
): Promise<ServeServer> {
  const rootDirectory = path.resolve(options.directory);
  const rootStat = await fs.promises.stat(rootDirectory);
  if (!rootStat.isDirectory()) {
    throw new Error(`Not a directory: ${rootDirectory}`);
  }

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
    if (isPathWithinRoot(rootDirectory, filePath)) {
      const relativePath = path
        .relative(rootDirectory, filePath)
        .split(path.sep)
        .join('/');
      return `/files/${encodePathSegments(relativePath)}`;
    }
    return pathToFileURL(filePath).href;
  });

  const serverConfig = await loadServerConfig({
    rootDirectory,
    globalConfigDirectory: options.globalConfigDirectory,
  });
  const notebook = await Notebook.init({
    notebookPath: rootDirectory,
    config: serverConfig as Partial<NotebookConfig>,
  });

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

  function assertFileWithinRoot(absolutePath: string): string | null {
    const resolved = path.resolve(absolutePath);
    if (!isPathWithinRoot(rootDirectory, resolved)) {
      return null;
    }
    return resolved;
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
        const sourceUri = assertFileWithinRoot(String(args[0] ?? ''));
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
        const file = assertFileWithinRoot(String(body['file'] ?? ''));
        if (file) {
          await renderFile(file);
        }
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
            rootDirectory,
            vscode: !!options.vscode,
            url: `http://${request.headers.host ?? `127.0.0.1:${port}`}`,
          }),
        );
        return;
      }

      if (request.method === 'GET' && urlPath === '/preview') {
        const file = assertFileWithinRoot(
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
          response.writeHead(500, { 'content-type': 'text/plain' });
          response.end('failed to render preview');
        }
        return;
      }

      if (request.method === 'GET' && urlPath.startsWith('/assets/')) {
        serveFileFromRoot(response, buildDirectory, '/assets', urlPath);
        return;
      }

      if (request.method === 'GET' && urlPath.startsWith('/files/')) {
        serveFileFromRoot(response, rootDirectory, '/files', urlPath);
        return;
      }

      if (request.method === 'GET' && urlPath === '/api/events') {
        sse.addClient(response);
        return;
      }

      if (request.method === 'GET' && urlPath === '/api/files') {
        const files = await listMarkdownFiles(rootDirectory);
        sendJSON(response, 200, { files });
        return;
      }

      if (request.method === 'GET' && urlPath === '/api/config') {
        sendJSON(response, 200, { config: notebook.config });
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

  const watcher = new MarkdownWatcher(rootDirectory, (change) => {
    if (change.type === 'deleted') {
      lastRenderByFile.delete(change.absolutePath);
      sse.broadcast({
        type: 'fileDeleted',
        file: change.absolutePath,
      });
    } else {
      void renderFile(change.absolutePath);
    }
  });
  await watcher.start();

  return {
    url: `http://${host}:${port}`,
    port,
    host,
    rootDirectory,
    close: async () => {
      watcher.close();
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
