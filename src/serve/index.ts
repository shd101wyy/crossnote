import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import { pathToFileURL } from 'url';
import type * as vscode from 'vscode';
import { SHA256 } from 'crypto-js';
import { MarkdownEngineOutput, Notebook, utility } from '../index';
import { NotebookConfig, WebviewConfig } from '../notebook';
import { constructGraphView } from '../notebook/graph-view';
import {
  createNotebooksForDirectories,
  loadServerConfig,
  updateServerConfigKey,
} from './config';
import { buildWiki } from '../wiki';
import { previewHostShimScript } from './preview-host-shim';
import {
  encodePathSegments,
  isMarkdownFile,
  isPathWithinRoot,
  listMarkdownFiles,
} from './markdown-files';
import { SSEHub } from './sse';
import {
  BASE_SECURITY_HEADERS,
  resolveMountedFile,
  serveFileFromPath,
} from './static';
import { MarkdownWatcher } from './watcher';

/**
 * Requests reaching the routes with a bad Host/Origin (or a bad body) are
 * answered with this status instead of the generic 500.
 */
class RequestError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

const MAX_COMMAND_BODY_BYTES = 64 * 1024 * 1024;

/**
 * Output path for a server-requested wiki export: `crossnote-wiki.html` in
 * the first served root, with a timestamp suffix when that file already
 * exists so a re-export can never clobber a previous one.
 */
async function nonConflictingWikiPath(rootDirectory: string): Promise<string> {
  const base = path.join(rootDirectory, 'crossnote-wiki.html');
  if (!fs.existsSync(base)) {
    return base;
  }
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\..+$/, '')
    .replace('T', '-');
  return path.join(rootDirectory, `crossnote-wiki-${stamp}.html`);
}

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
 * available. Inside the server app every preview lives in an iframe, so this
 * shim (injected right before preview.js) bridges the webview protocol to
 * the parent server app, which relays to the HTTP server. Serve frames are
 * same-origin with their parent, so the origin is pinned.
 */
const PREVIEW_HOST_SHIM = previewHostShimScript('window.location.origin');

/**
 * Injected into the standalone graph view page (`/graph-view`). That page is
 * a top-level browser tab, not an iframe of the app, so the shim answers the
 * webview protocol by itself: `graphViewReady` fetches the graph data from
 * this server, `openFile` relays the node click to the app tab that opened
 * the graph (verified there against its window reference), and settings are
 * kept in the page's localStorage.
 */
const GRAPH_HOST_SHIM = `<script>
(function () {
  if (window.acquireVsCodeApi) { return; }
  var api = null;
  var FILE = new URLSearchParams(window.location.search).get('file') || '';
  window.acquireVsCodeApi = function () {
    if (api) { return api; }
    api = {
      postMessage: function (message) {
        if (!message || typeof message.command !== 'string') { return; }
        if (message.command === 'graphViewReady') {
          fetch('/api/graph?file=' + encodeURIComponent(FILE))
            .then(function (response) {
              if (!response.ok) { throw new Error('graph request failed'); }
              return response.json();
            })
            .then(function (payload) {
              window.postMessage({
                command: 'graphData',
                data: payload.data,
                activeFilePath: payload.activeFilePath,
              }, '*');
            })
            .catch(function () {
              window.postMessage({
                command: 'graphData',
                data: { hash: '', nodes: [], links: [] },
                activeFilePath: '',
              }, '*');
            });
          return;
        }
        if (message.command === 'openFile') {
          var rel = message.args && message.args[0];
          if (typeof rel === 'string' && window.opener && !window.opener.closed) {
            window.opener.postMessage(
              { command: '__serverAppOpenFile', args: [FILE, rel] },
              window.location.origin
            );
          }
          return;
        }
        if (message.command === 'saveSetting') {
          var setting = message.args && message.args[0];
          if (setting && typeof setting.key === 'string') {
            try {
              localStorage.setItem(
                'crossnote.graphView.' + setting.key,
                JSON.stringify(setting.value === undefined ? null : setting.value)
              );
            } catch (error) { /* storage unavailable */ }
          }
          return;
        }
      },
      getState: function () {
        try {
          return JSON.parse(localStorage.getItem('crossnote.graphView.state') || 'null');
        } catch (error) { return null; }
      },
      setState: function (state) {
        try {
          localStorage.setItem('crossnote.graphView.state', JSON.stringify(state));
        } catch (error) { /* storage unavailable */ }
      },
    };
    return api;
  };
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
  // One config context + Notebook per root, sharing the global config layer.
  const { rootDirectories, configContexts, notebooks } =
    await createNotebooksForDirectories(options.directories, {
      vscode: options.vscode,
      vscodeSettingsPath: options.vscodeSettingsPath,
      globalConfigDirectory: options.globalConfigDirectory,
    });
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
    let length = 0;
    for await (const chunk of request) {
      length += (chunk as Buffer).length;
      // `updateMarkdown` posts whole files, so the cap is generous — it only
      // exists so a runaway request cannot exhaust memory.
      if (length > MAX_COMMAND_BODY_BYTES) {
        throw new RequestError(413, 'request body too large');
      }
      chunks.push(chunk as Buffer);
    }
    const raw = Buffer.concat(chunks).toString('utf-8');
    if (!raw) {
      return {};
    }
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      throw new RequestError(400, 'request body is not valid JSON');
    }
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
      case 'showBacklinks': {
        // args: [{ uri, forceRefreshingNotes, backlinksSha }] — compute the
        // note's backlinks from the note index and deliver the resulting
        // webview message into the preview, like the extension's
        // postMessageToPreview.
        const info = args[0] as
          | {
              uri?: string;
              forceRefreshingNotes?: boolean;
              backlinksSha?: string;
            }
          | undefined;
        const file = assertFileWithinRoots(String(info?.uri ?? ''));
        if (!file || !isMarkdownFile(file)) {
          return;
        }
        const fileNotebook = notebookForFile(file);
        if (!fileNotebook) {
          return;
        }
        try {
          if (info?.forceRefreshingNotes) {
            await fileNotebook.refreshNotesIncremental({
              dir: '.',
              includeSubdirectories: true,
            });
          } else {
            await fileNotebook.refreshNotesIfNotLoaded({
              dir: '.',
              includeSubdirectories: true,
            });
          }
          const backlinks = await fileNotebook.getNoteBacklinks(file);
          const sha = SHA256(JSON.stringify(backlinks)).toString();
          const hasUpdate = sha !== info?.backlinksSha;
          sse.broadcast({
            type: 'iframeMessage',
            file,
            iframeMessage: {
              command: 'backlinks',
              sourceUri: file,
              backlinks: hasUpdate ? backlinks : null,
              hasUpdate,
            },
          });
        } catch (error) {
          console.error(
            `crossnote serve: failed to compute backlinks for ${file}:`,
            error,
          );
        }
        return;
      }
      case 'exportStandaloneWiki': {
        // Build the read-only single-file wiki for all served roots and
        // write it into the first root, never overwriting an existing file.
        try {
          const result = await buildWiki({
            directories: rootDirectories,
            vscode: options.vscode,
            vscodeSettingsPath: options.vscodeSettingsPath,
            globalConfigDirectory: options.globalConfigDirectory,
            crossnoteBuildDirectory: buildDirectory,
          });
          const outputFile = await nonConflictingWikiPath(rootDirectory);
          await fs.promises.writeFile(outputFile, result.html, 'utf-8');
          const failureNote =
            result.failures.length > 0
              ? ` (${result.failures.length} notes failed to render)`
              : '';
          sse.broadcast({
            type: 'notification',
            level: 'info',
            message: `Standalone wiki saved to ${outputFile} — ${result.files.length} notes${failureNote}.`,
          });
        } catch (error) {
          console.error('crossnote serve: failed to build wiki:', error);
          sse.broadcast({
            type: 'notification',
            level: 'error',
            message: `Building the standalone wiki failed: ${String(error)}`,
          });
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
      // Trust boundary: `/api/command` writes files and runs code chunks, so
      // requests from anything but this server's own origin must not reach
      // the routes. `Host` must name this server (blocks DNS rebinding, which
      // would otherwise make every response readable cross-origin), and
      // `Origin` — which browsers send on every cross-origin POST — must too
      // when present (blocks drive-by requests from websites the user visits;
      // non-browser clients like curl send no Origin and are let through).
      if (!isAllowedRequestHost(request.headers.host, host, port)) {
        response.writeHead(403, { 'content-type': 'text/plain' });
        response.end('forbidden');
        return;
      }
      if (!isAllowedOrigin(request.headers.origin, host, port)) {
        response.writeHead(403, { 'content-type': 'text/plain' });
        response.end('forbidden');
        return;
      }
      const requestUrl = new URL(
        request.url ?? '/',
        `http://${request.headers.host ?? '127.0.0.1'}`,
      );
      const urlPath = requestUrl.pathname;

      if (
        request.method === 'GET' &&
        (urlPath === '/' || urlPath === '/index.html')
      ) {
        response.writeHead(200, {
          'content-type': 'text/html; charset=utf-8',
          ...BASE_SECURITY_HEADERS,
        });
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
            ...BASE_SECURITY_HEADERS,
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

      if (request.method === 'GET' && urlPath === '/graph-view') {
        // The standalone graph view — a top-level browser tab running the
        // unmodified graph-view webview bundle, fed by /api/graph through
        // the injected shim.
        const file = assertFileWithinRoots(
          requestUrl.searchParams.get('file') ?? '/',
        );
        if (!file || !isMarkdownFile(file)) {
          response.writeHead(400, { 'content-type': 'text/plain' });
          response.end('invalid file');
          return;
        }
        const graphNotebook = notebookForFile(file);
        if (!graphNotebook) {
          response.writeHead(404, { 'content-type': 'text/plain' });
          response.end('not found');
          return;
        }
        try {
          const engine = graphNotebook.getNoteMarkdownEngine(file);
          let html = engine.generateHTMLTemplateForGraphView({
            vscodePreviewPanel: dummyPanel,
          });
          html = html.replace(/<script\b/, `${GRAPH_HOST_SHIM}<script`);
          response.writeHead(200, {
            'content-type': 'text/html; charset=utf-8',
            ...BASE_SECURITY_HEADERS,
          });
          response.end(html);
        } catch (error) {
          console.error('crossnote serve: failed to build graph view:', error);
          response.writeHead(500, { 'content-type': 'text/plain' });
          response.end('internal error');
        }
        return;
      }

      if (request.method === 'GET' && urlPath === '/api/graph') {
        const file = assertFileWithinRoots(
          requestUrl.searchParams.get('file') ?? '/',
        );
        const graphNotebook = file ? notebookForFile(file) : null;
        if (!file || !graphNotebook) {
          sendJSON(response, 400, { error: 'invalid file' });
          return;
        }
        try {
          // First call walks the vault; later ones hit the note cache.
          await graphNotebook.refreshNotesIfNotLoaded({
            dir: '.',
            includeSubdirectories: true,
          });
          const data = constructGraphView(graphNotebook);
          const rootIndex = rootIndexOf(file);
          const relativePath =
            rootIndex === -1
              ? ''
              : path
                  .relative(rootDirectories[rootIndex], file)
                  .split(path.sep)
                  .join('/');
          sendJSON(response, 200, { data, activeFilePath: relativePath });
        } catch (error) {
          console.error('crossnote serve: failed to build graph data:', error);
          sendJSON(response, 500, { error: 'failed to build graph data' });
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
      if (error instanceof RequestError) {
        if (!response.headersSent) {
          sendJSON(response, error.statusCode, { error: error.message });
        } else {
          response.end();
        }
        return;
      }
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

/**
 * Parse a `Host` header (or `URL.host`) into its hostname and port. Returns
 * null for malformed values. IPv6 forms keep their brackets stripped.
 */
function parseHostHeader(
  hostHeader: string,
): { hostname: string; port: number | null } | null {
  const value = hostHeader.trim().toLowerCase();
  if (!value) {
    return null;
  }
  if (value.startsWith('[')) {
    const end = value.indexOf(']');
    if (end === -1) {
      return null;
    }
    const hostname = value.slice(1, end);
    const rest = value.slice(end + 1);
    if (rest === '') {
      return { hostname, port: null };
    }
    if (!rest.startsWith(':') || !/^\d+$/.test(rest.slice(1))) {
      return null;
    }
    return { hostname, port: parseInt(rest.slice(1), 10) };
  }
  const colon = value.lastIndexOf(':');
  if (colon === -1) {
    return { hostname: value, port: null };
  }
  const portString = value.slice(colon + 1);
  if (!/^\d+$/.test(portString)) {
    return null;
  }
  return { hostname: value.slice(0, colon), port: parseInt(portString, 10) };
}

function isIPLiteral(hostname: string): boolean {
  return /^\d+\.\d+\.\d+\.\d+$/.test(hostname) || hostname.includes(':');
}

/**
 * Whether `hostHeader` names this very server: the bind host, a loopback
 * name, or — when bound to a wildcard address — any IP literal, always on
 * the bound port. Anything else is a DNS-rebinding attempt or a probe.
 */
function isAllowedRequestHost(
  hostHeader: string | undefined,
  bindHost: string,
  port: number,
): boolean {
  if (!hostHeader) {
    return false;
  }
  const parsed = parseHostHeader(hostHeader);
  // An absent port means the HTTP default (the server is always plain HTTP).
  if (!parsed || (parsed.port ?? 80) !== port) {
    return false;
  }
  if (
    (bindHost === '0.0.0.0' || bindHost === '::') &&
    isIPLiteral(parsed.hostname)
  ) {
    return true;
  }
  const bindHostname = bindHost.replace(/^\[|\]$/g, '').toLowerCase();
  const hostname = parsed.hostname.toLowerCase();
  return (
    hostname === bindHostname ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1'
  );
}

/**
 * Whether the request's `Origin` (sent by browsers on cross-origin POSTs)
 * names this server. Requests without an `Origin` header — curl, tests,
 * other non-browser clients — are allowed through.
 */
function isAllowedOrigin(
  originHeader: string | undefined,
  bindHost: string,
  port: number,
): boolean {
  if (originHeader === undefined) {
    return true;
  }
  let origin: URL;
  try {
    origin = new URL(originHeader);
  } catch {
    return false;
  }
  if (origin.protocol !== 'http:') {
    return false;
  }
  // `URL.host` has exactly the `Host`-header shape the check above expects.
  return isAllowedRequestHost(origin.host, bindHost, port);
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
