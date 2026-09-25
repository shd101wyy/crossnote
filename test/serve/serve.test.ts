import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import { mkdirSync, track } from '../../src/lib/temp';
import { startServeServer, ServeServer } from '../../src/serve';

// less does not run under jest; the compiled CSS is controlled per-test by
// assigning `mockLessOutput` (none of the other tests set it, so it stays
// the empty string for them).
let mockLessOutput = '';
jest.mock('less', () => ({
  render: (
    _input: string,
    _options: unknown,
    callback: (error: unknown, output: { css: string } | undefined) => void,
  ) => {
    callback(null, { css: mockLessOutput });
  },
}));

track();

/**
 * Minimal fake crossnote build directory: the preview template only maps
 * asset paths to URLs, and /assets serving needs a few real files. This
 * keeps the tests independent of the compiled out/ artifacts (jest runs
 * before `pnpm build` in CI).
 */
function writeFakeBuildDirectory(root: string): void {
  const files: Array<[string, string]> = [
    [path.join(root, 'webview/preview.js'), '// preview webview'],
    [path.join(root, 'webview/preview.css'), '/* preview css */'],
    [path.join(root, 'styles/preview.css'), '/* preview base */'],
    [path.join(root, 'styles/style-template.css'), '/* style-template */'],
    [
      path.join(root, 'styles/preview_theme/github-light.css'),
      '/* preview:github-light */',
    ],
    [
      path.join(root, 'styles/preview_theme/github-dark.css'),
      '/* preview:github-dark */',
    ],
    [path.join(root, 'styles/prism_theme/github.css'), '/* prism:github */'],
    // Standalone-wiki exports (exportStandaloneWiki command) inline the
    // serve app bundle as the wiki shell.
    [path.join(root, 'server-app/server-app.js'), '// server app'],
    [path.join(root, 'server-app/server-app.css'), '/* server app css */'],
    // The standalone graph view page.
    [path.join(root, 'webview/graph-view.js'), '// graph view webview'],
    [path.join(root, 'webview/graph-view.css'), '/* graph view css */'],
  ];
  for (const [file, content] of files) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  }
}

function writeWorkspace(root: string): void {
  fs.mkdirSync(path.join(root, 'notes'), { recursive: true });
  fs.mkdirSync(path.join(root, 'node_modules', 'some-pkg'), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(root, 'welcome.md'),
    [
      '# Welcome',
      '',
      '- [ ] a task',
      '- [x] done task',
      '',
      '[other note](./notes/other.md)',
      '',
    ].join('\n'),
  );
  fs.writeFileSync(path.join(root, 'notes', 'other.md'), '# Other\n');
  fs.writeFileSync(
    path.join(root, 'node_modules', 'some-pkg', 'ignored.md'),
    '# should not be listed\n',
  );
  fs.writeFileSync(path.join(root, 'image.png'), 'not really a png');
}

interface SSEMessage {
  type: string;
  file?: string;
  payload?: Record<string, unknown>;
  level?: string;
  message?: string;
  iframeMessage?: Record<string, unknown>;
}

/**
 * Subscribe to /api/events and collect messages until `predicate` matches
 * or the timeout elapses (returns everything collected so far).
 */
async function waitForSSE(
  server: ServeServer,
  predicate: (message: SSEMessage) => boolean,
  timeoutMs: number = 5000,
): Promise<SSEMessage[]> {
  const controller = new AbortController();
  const collected: SSEMessage[] = [];
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${server.url}/api/events`, {
      signal: controller.signal,
    });
    expect(response.body).toBeTruthy();
    const reader = (response.body as ReadableStream<Uint8Array>).getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      let index: number;
      while ((index = buffer.indexOf('\n\n')) !== -1) {
        const chunk = buffer.slice(0, index);
        buffer = buffer.slice(index + 2);
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ')) {
            const message = JSON.parse(line.slice(6)) as SSEMessage;
            collected.push(message);
            if (predicate(message)) {
              controller.abort();
              return collected;
            }
          }
        }
      }
    }
  } catch {
    // Timeout / abort — fall through to whatever was collected.
  } finally {
    clearTimeout(timer);
    controller.abort();
  }
  return collected;
}

async function postCommand(
  server: ServeServer,
  body: Record<string, unknown>,
): Promise<unknown> {
  const response = await fetch(`${server.url}/api/command`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return response.json();
}

/**
 * Raw HTTP request with arbitrary headers — `fetch` refuses to send the
 * `Host`/`Origin` headers the request gate needs to be tested against.
 */
function rawRequest(
  port: number,
  requestPath: string,
  headers: Record<string, string>,
  method: 'GET' | 'POST' = 'GET',
  body: string = '',
): Promise<http.IncomingMessage> {
  return new Promise((resolve, reject) => {
    const request = http.request(
      { host: '127.0.0.1', port, path: requestPath, headers, method },
      (response) => {
        response.resume();
        response.on('end', () => resolve(response));
        response.on('error', reject);
      },
    );
    request.on('error', reject);
    request.end(method === 'POST' ? body : undefined);
  });
}

describe('crossnote serve', () => {
  let workspace: string;
  let buildDirectory: string;
  let globalConfigDirectory: string;
  let server: ServeServer;

  beforeAll(async () => {
    track();
    workspace = mkdirSync('crossnote-serve-workspace');
    writeWorkspace(workspace);
    buildDirectory = mkdirSync('crossnote-serve-build');
    writeFakeBuildDirectory(buildDirectory);
    globalConfigDirectory = path.join(
      mkdirSync('crossnote-serve-global'),
      'crossnote',
    );
    server = await startServeServer({
      directories: [workspace],
      port: 0,
      crossnoteBuildDirectory: buildDirectory,
      globalConfigDirectory,
    });
  });

  afterAll(async () => {
    await server.close();
  });

  test('serves the app shell with server info', async () => {
    const response = await fetch(`${server.url}/`);
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain('window.__CROSSNOTE_SERVER__');
    expect(html).toContain(server.rootDirectory);
    expect(html).toContain('/assets/server-app/server-app.js');
  });

  test('serves preview pages with the unmodified webview template', async () => {
    const file = path.join(workspace, 'welcome.md');
    const response = await fetch(
      `${server.url}/preview?file=${encodeURIComponent(file)}`,
    );
    expect(response.status).toBe(200);
    const html = await response.text();
    // config meta + server-app flags (the attribute is HTML-escaped)
    expect(html).toContain('id="crossnote-data"');
    expect(html).toContain('isServerApp&quot;:true');
    expect(html).toContain('sourceUri&quot;:');
    // assets are mapped to the HTTP mounts
    expect(html).toContain('src="/assets/webview/preview.js"');
    expect(html).toContain(
      'href="/assets/styles/preview_theme/github-light.css"',
    );
    // the iframe shim runs before the webview bundle
    expect(html.indexOf('acquireVsCodeApi')).toBeLessThan(
      html.indexOf('/assets/webview/preview.js'),
    );
    // the shim forwards shell shortcuts (zen mode is the preview's own
    // state now — Esc is not hijacked, no `__serverAppZenMode` wiring)
    expect(html).toContain('__serverAppShortcut');
    expect(html).not.toContain('__serverAppZenMode');
    expect(html).not.toContain('exit-zen-mode');
    // workspace-relative links resolve through /files
    expect(html).toContain('/files/notes/other.md');
    // no <base> — same-document anchors must keep working
    expect(html).not.toContain('<base');
  });

  test('rejects previews outside the served root', async () => {
    const response = await fetch(
      `${server.url}/preview?file=${encodeURIComponent('/etc/passwd')}`,
    );
    expect(response.status).toBe(400);
  });

  test('serves the standalone graph view page with its shim', async () => {
    const file = path.join(workspace, 'welcome.md');
    const response = await fetch(
      `${server.url}/graph-view?file=${encodeURIComponent(file)}`,
    );
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain('/assets/webview/graph-view.js');
    // The shim answers graphViewReady by fetching the data itself, and
    // relays node clicks to the app tab that opened the page.
    expect(html).toContain('graphViewReady');
    expect(html).toContain('__serverAppOpenFile');
    expect(html).toContain('/api/graph');
    expect(html.indexOf('acquireVsCodeApi')).toBeLessThan(
      html.indexOf('/assets/webview/graph-view.js'),
    );
  });

  test('serves graph data for a file', async () => {
    const file = path.join(workspace, 'welcome.md');
    const response = await fetch(
      `${server.url}/api/graph?file=${encodeURIComponent(file)}`,
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      data: { nodes: Array<{ id: string }>; links: unknown[] };
      activeFilePath: string;
    };
    expect(body.activeFilePath.replace(/\\/g, '/')).toBe('welcome.md');
    // welcome.md links to notes/other.md — both are graph nodes.
    expect(body.data.nodes.map((node) => node.id)).toEqual(
      expect.arrayContaining(['welcome.md', path.join('notes', 'other.md')]),
    );
  });

  test('showBacklinks delivers the backlinks into the preview', async () => {
    const file = path.join(workspace, 'notes', 'other.md');
    // other.md links back to ../welcome.md → welcome.md has a backlink.
    const sseDone = waitForSSE(server, (m) => m.type === 'iframeMessage');
    await postCommand(server, {
      file,
      command: 'showBacklinks',
      args: [
        {
          uri: file,
          forceRefreshingNotes: false,
          backlinksSha: 'stale-sha',
        },
      ],
    });
    const events = await sseDone;
    const delivered = events.find((m) => m.type === 'iframeMessage');
    expect(delivered?.file).toBe(file);
    const message = delivered?.iframeMessage as
      | { command: string; backlinks: Array<{ note: { filePath: string } }> }
      | undefined;
    expect(message?.command).toBe('backlinks');
    expect(message?.backlinks[0]?.note?.filePath).toContain('welcome.md');
  });

  test('returns a friendly page for missing files', async () => {
    const missing = path.join(workspace, 'nope.md');
    const response = await fetch(
      `${server.url}/preview?file=${encodeURIComponent(missing)}`,
    );
    expect(response.status).toBe(404);
    expect(await response.text()).toContain('Failed to render');
  });

  test('serves build assets and workspace files, blocking traversal', async () => {
    const asset = await fetch(`${server.url}/assets/webview/preview.js`);
    expect(asset.status).toBe(200);
    expect(asset.headers.get('content-type')).toContain('text/javascript');

    const file = await fetch(
      `${server.url}/files/${encodeURIComponent('notes/other.md')}`,
    );
    expect(file.status).toBe(200);

    const traversal = await fetch(
      `${server.url}/files/${encodeURIComponent('../../../etc/passwd')}`,
    );
    // The resolver refuses paths escaping every served root before any
    // filesystem access, so the request just 404s.
    expect(traversal.status).toBe(404);

    // Malformed percent-encoding must 404, not crash into a 500.
    const malformed = await fetch(`${server.url}/files/%`);
    expect(malformed.status).toBe(404);
  });

  test('lists markdown files but skips node_modules', async () => {
    const response = await fetch(`${server.url}/api/files`);
    const body = (await response.json()) as {
      files: { relativePath: string }[];
    };
    const paths = body.files.map((file) => file.relativePath);
    expect(paths).toContain('welcome.md');
    expect(paths).toContain('notes/other.md');
    expect(paths.some((p) => p.includes('node_modules'))).toBe(false);
  });

  test('updateMarkdown writes the file and pushes updateHtml over SSE', async () => {
    const file = path.join(workspace, 'welcome.md');
    const newText = '# Edited\n\n- [ ] a task\n';
    const sseDone = waitForSSE(server, (m) => m.type === 'updateHtml');

    await postCommand(server, {
      file,
      command: 'updateMarkdown',
      args: [file, newText],
    });

    expect(fs.readFileSync(file, 'utf-8')).toBe(newText);
    const events = await sseDone;
    const update = events.find(
      (m) => m.type === 'updateHtml' && m.file === file,
    );
    expect(update).toBeDefined();
    expect(String(update?.payload?.['markdown'])).toBe(newText);
    expect(String(update?.payload?.['html'])).toContain('Edited');
  });

  test('clickTaskListCheckbox toggles the checkbox in the file', async () => {
    const file = path.join(workspace, 'welcome.md');
    fs.writeFileSync(file, '# Tasks\n\n- [ ] a task\n');

    await postCommand(server, {
      file,
      command: 'clickTaskListCheckbox',
      // data-source-line 2 is the `- [ ]` line (0-based)
      args: [file, 2],
    });
    expect(fs.readFileSync(file, 'utf-8')).toContain('- [x] a task');

    await postCommand(server, {
      file,
      command: 'clickTaskListCheckbox',
      args: [file, 2],
    });
    expect(fs.readFileSync(file, 'utf-8')).toContain('- [ ] a task');
  });

  test('watcher re-renders externally changed files', async () => {
    const file = path.join(workspace, 'notes', 'other.md');
    const sseDone = waitForSSE(
      server,
      (m) =>
        m.type === 'updateHtml' &&
        m.file === file &&
        String(m.payload?.['markdown']).includes('watched'),
      8000,
    );
    // Two writes in quick succession also exercise the debounce.
    fs.writeFileSync(file, '# Other\n\nwatched once\n');
    fs.writeFileSync(file, '# Other\n\nwatched twice\n');
    const events = await sseDone;
    const update = events.filter((m) => m.type === 'updateHtml');
    expect(update.length).toBeGreaterThan(0);
    // The final render reflects the last write (out-of-order guard).
    expect(String(update[update.length - 1]?.payload?.['markdown'])).toContain(
      'watched twice',
    );
  }, 12000);

  test('setPreviewTheme persists to the global config and notifies clients', async () => {
    const file = path.join(workspace, 'welcome.md');
    const sseDone = waitForSSE(server, (m) => m.type === 'configChanged');

    await postCommand(server, {
      file,
      command: 'setPreviewTheme',
      args: [file, 'github-dark.css'],
    });

    const events = await sseDone;
    expect(events.some((m) => m.type === 'configChanged')).toBe(true);

    const configScript = fs.readFileSync(
      path.join(globalConfigDirectory, 'config.js'),
      'utf-8',
    );
    expect(configScript).toContain('"previewTheme": "github-dark.css"');

    const response = await fetch(`${server.url}/api/config`);
    const body = (await response.json()) as {
      config: { previewTheme: string };
    };
    expect(body.config.previewTheme).toBe('github-dark.css');
  });

  test('togglePreviewZenMode flips the preview zen config and notifies clients', async () => {
    const file = path.join(workspace, 'welcome.md');
    const readConfig = async (): Promise<{
      config: { enablePreviewZenMode: boolean };
    }> => {
      const response = await fetch(`${server.url}/api/config`);
      return (await response.json()) as {
        config: { enablePreviewZenMode: boolean };
      };
    };
    const initial = (await readConfig()).config.enablePreviewZenMode;

    // Toggle twice: the state round-trips and ends where it started, so
    // later tests keep a clean slate.
    for (const expected of [!initial, initial]) {
      const sseDone = waitForSSE(server, (m) => m.type === 'configChanged');
      await postCommand(server, {
        file,
        command: 'togglePreviewZenMode',
        args: [file],
      });
      const events = await sseDone;
      expect(events.some((m) => m.type === 'configChanged')).toBe(true);
      expect((await readConfig()).config.enablePreviewZenMode).toBe(expected);
    }

    const configScript = fs.readFileSync(
      path.join(globalConfigDirectory, 'config.js'),
      'utf-8',
    );
    expect(configScript).toContain(
      `"enablePreviewZenMode": ${initial ? 'true' : 'false'}`,
    );

    // The reloaded preview page carries the flipped config, so the preview
    // itself re-renders in (or out of) zen mode.
    const response = await fetch(
      `${server.url}/preview?file=${encodeURIComponent(file)}`,
    );
    const html = await response.text();
    expect(html).toContain(
      `enablePreviewZenMode&quot;:${initial ? 'true' : 'false'}`,
    );
  });

  test('htmlExport runs server-side, writes the file and notifies', async () => {
    const file = path.join(workspace, 'welcome.md');
    const dest = file.replace(/\.md$/, '.html');
    fs.rmSync(dest, { force: true });
    const sseDone = waitForSSE(server, (m) => m.type === 'notification');

    await postCommand(server, {
      file,
      command: 'htmlExport',
      args: [file, true],
    });

    const events = await sseDone;
    const notification = events.find((m) => m.type === 'notification');
    expect(notification?.level).toBe('info');
    expect(notification?.message).toContain('Exported welcome.md to');
    expect(fs.existsSync(dest)).toBe(true);
    fs.rmSync(dest, { force: true });
  });

  test('exportStandaloneWiki writes a read-only wiki and notifies clients', async () => {
    const sseDone = waitForSSE(server, (m) => m.type === 'notification');

    await postCommand(server, {
      file: path.join(workspace, 'welcome.md'),
      command: 'exportStandaloneWiki',
      args: [],
    });

    const events = await sseDone;
    const notification = events.find((m) => m.type === 'notification');
    expect(notification?.message).toContain('crossnote-wiki.html');

    const wiki = fs.readFileSync(
      path.join(workspace, 'crossnote-wiki.html'),
      'utf-8',
    );
    expect(wiki).toContain('window.__CROSSNOTE_WIKI__');
    expect(wiki).toContain('welcome');

    // The wiki build swaps the global asset-URL mapper while it renders;
    // afterwards the server's own preview pages must keep mapping to the
    // HTTP mounts (no wiki tokens leaked into serve pages).
    const after = await fetch(
      `${server.url}/preview?file=${encodeURIComponent(
        path.join(workspace, 'welcome.md'),
      )}`,
    );
    const afterHtml = await after.text();
    expect(afterHtml).toContain('src="/assets/webview/preview.js"');
  });

  test('drops commands for files outside the root', async () => {
    const outside = path.join(path.dirname(workspace), 'evil.md');
    await postCommand(server, {
      file: outside,
      command: 'updateMarkdown',
      args: [outside, 'nope\n'],
    });
    expect(fs.existsSync(outside)).toBe(false);
  });

  test('blocks requests with a foreign Host header (DNS rebinding)', async () => {
    const rebinding = await rawRequest(server.port, '/', {
      host: `evil.example:${server.port}`,
    });
    expect(rebinding.statusCode).toBe(403);

    const own = await rawRequest(server.port, '/', {
      host: `127.0.0.1:${server.port}`,
    });
    expect(own.statusCode).toBe(200);

    const localhost = await rawRequest(server.port, '/', {
      host: `localhost:${server.port}`,
    });
    expect(localhost.statusCode).toBe(200);
  });

  test('blocks cross-origin POSTs to /api/command (drive-by CSRF)', async () => {
    const file = path.join(workspace, 'welcome.md');
    const before = fs.readFileSync(file, 'utf-8');
    const response = await rawRequest(
      server.port,
      '/api/command',
      {
        'content-type': 'application/json',
        'origin': 'http://evil.example',
      },
      'POST',
      JSON.stringify({
        file,
        command: 'updateMarkdown',
        args: [file, 'pwned\n'],
      }),
    );
    expect(response.statusCode).toBe(403);
    expect(fs.readFileSync(file, 'utf-8')).toBe(before);
  });

  test('allows command POSTs with a same-origin or absent Origin header', async () => {
    const file = path.join(workspace, 'welcome.md');
    const command = JSON.stringify({
      file,
      command: 'refreshPreview',
      args: [],
    });
    const headerSets: Array<Record<string, string>> = [
      { 'content-type': 'application/json', 'origin': server.url },
      { 'content-type': 'application/json' },
    ];
    for (const headers of headerSets) {
      const response = await rawRequest(
        server.port,
        '/api/command',
        headers,
        'POST',
        command,
      );
      expect(response.statusCode).toBe(200);
    }
  });

  test('rejects malformed command bodies with 400', async () => {
    const response = await rawRequest(
      server.port,
      '/api/command',
      { 'content-type': 'application/json' },
      'POST',
      '{not json',
    );
    expect(response.statusCode).toBe(400);
  });

  test('serves workspace html as a sandboxed document', async () => {
    fs.writeFileSync(
      path.join(workspace, 'evil.html'),
      '<script>window.parent.location = "http://evil.example/"</script>',
    );
    const html = await fetch(`${server.url}/files/evil.html`);
    expect(html.status).toBe(200);
    expect(html.headers.get('content-security-policy')).toBe('sandbox');
    expect(html.headers.get('x-content-type-options')).toBe('nosniff');
    expect(html.headers.get('cross-origin-resource-policy')).toBe(
      'same-origin',
    );

    // Plain assets carry the baseline headers but are not sandboxed.
    const image = await fetch(`${server.url}/files/image.png`);
    expect(image.headers.get('x-content-type-options')).toBe('nosniff');
    expect(image.headers.get('content-security-policy')).toBeNull();
  });
});

describe('crossnote serve --vscode', () => {
  let workspace: string;
  let settingsPath: string;
  let server: ServeServer;

  beforeAll(async () => {
    track();
    workspace = mkdirSync('crossnote-serve-vscode-workspace');
    fs.writeFileSync(path.join(workspace, 'note.md'), '# Note\n');
    const settingsDirectory = mkdirSync('crossnote-serve-vscode-settings');
    settingsPath = path.join(settingsDirectory, 'settings.json');
    fs.writeFileSync(
      settingsPath,
      [
        '{',
        '  // my settings',
        '  "editor.fontSize": 14,',
        '  "markdown-preview-enhanced.previewTheme": "github-dark.css",',
        '  "markdown-preview-enhanced.printBackground": true,',
        '}',
      ].join('\n'),
    );
    server = await startServeServer({
      directories: [workspace],
      port: 0,
      vscode: true,
      vscodeSettingsPath: settingsPath,
      crossnoteBuildDirectory: path.dirname(settingsDirectory),
      globalConfigDirectory: path.join(
        mkdirSync('crossnote-serve-vscode-global'),
        'crossnote',
      ),
    });
  });

  afterAll(async () => {
    await server.close();
  });

  test('loads config from VS Code settings', async () => {
    const response = await fetch(`${server.url}/api/config`);
    const body = (await response.json()) as {
      config: { previewTheme: string; printBackground: boolean };
    };
    expect(body.config.previewTheme).toBe('github-dark.css');
    expect(body.config.printBackground).toBe(true);
  });

  test('theme changes edit settings.json surgically, preserving comments', async () => {
    const file = path.join(workspace, 'note.md');
    await postCommand(server, {
      file,
      command: 'setPreviewTheme',
      args: [file, 'one-dark.css'],
    });

    const settings = fs.readFileSync(settingsPath, 'utf-8');
    expect(settings).toContain('// my settings');
    expect(settings).toContain('"editor.fontSize": 14,');
    expect(settings).toContain(
      '"markdown-preview-enhanced.previewTheme": "one-dark.css"',
    );

    const response = await fetch(`${server.url}/api/config`);
    const body = (await response.json()) as {
      config: { previewTheme: string };
    };
    expect(body.config.previewTheme).toBe('one-dark.css');
  });
});

describe('crossnote serve with multiple directories', () => {
  let rootA: string;
  let rootB: string;
  let server: ServeServer;

  beforeAll(async () => {
    track();
    rootA = mkdirSync('crossnote-serve-multi-a');
    rootB = mkdirSync('crossnote-serve-multi-b');
    fs.writeFileSync(
      path.join(rootA, 'from-a.md'),
      '# From A\n\n![shared](./pic.png)\n',
    );
    fs.mkdirSync(path.join(rootA, 'sub'), { recursive: true });
    fs.writeFileSync(
      path.join(rootA, 'sub', 'nested.md'),
      '[sibling](./nested.md)',
    );
    fs.writeFileSync(path.join(rootA, 'pic.png'), 'A png');
    fs.writeFileSync(
      path.join(rootB, 'from-b.md'),
      '# From B\n\n![shared](./pic.png)\n',
    );
    // Same relative path in both roots — the ?root= hint disambiguates.
    fs.writeFileSync(path.join(rootB, 'pic.png'), 'B png');
    const buildDir = mkdirSync('crossnote-serve-multi-build');
    writeFakeBuildDirectory(buildDir);
    server = await startServeServer({
      directories: [rootA, rootB],
      port: 0,
      crossnoteBuildDirectory: buildDir,
      globalConfigDirectory: path.join(
        mkdirSync('crossnote-serve-multi-global'),
        'crossnote',
      ),
    });
  });

  afterAll(async () => {
    await server.close();
  });

  test('exposes every root and serves the app shell with all of them', async () => {
    expect(server.rootDirectories).toEqual([rootA, rootB]);
    const response = await fetch(`${server.url}/`);
    const html = await response.text();
    expect(html).toContain(rootA);
    expect(html).toContain(rootB);
  });

  test('lists files from all roots with their rootPath', async () => {
    const response = await fetch(`${server.url}/api/files`);
    const body = (await response.json()) as {
      files: {
        relativePath: string;
        absolutePath: string;
        rootPath: string;
      }[];
    };
    const fromA = body.files.find((f) => f.absolutePath.endsWith('from-a.md'));
    const fromB = body.files.find((f) => f.absolutePath.endsWith('from-b.md'));
    expect(fromA?.rootPath).toBe(rootA);
    expect(fromB?.rootPath).toBe(rootB);
  });

  test('maps workspace files to /files with a root hint', async () => {
    const file = path.join(rootB, 'from-b.md');
    const response = await fetch(
      `${server.url}/preview?file=${encodeURIComponent(file)}`,
    );
    expect(response.status).toBe(200);
    const html = await response.text();
    // Same relpath exists in both roots — root B's copy must win for this file.
    expect(html).toContain('/files/pic.png?root=1');
    // Fetching the hinted URL serves root B's image…
    const hinted = await fetch(`${server.url}/files/pic.png?root=1`);
    expect(await hinted.text()).toBe('B png');
    // …and the unhinted URL falls back to the first root that has it.
    const fallback = await fetch(`${server.url}/files/pic.png`);
    expect(await fallback.text()).toBe('A png');
  });

  test('renders previews from every root with the right notebook', async () => {
    const fileA = path.join(rootA, 'from-a.md');
    const fileB = path.join(rootB, 'from-b.md');
    const htmlA = await (
      await fetch(`${server.url}/preview?file=${encodeURIComponent(fileA)}`)
    ).text();
    const htmlB = await (
      await fetch(`${server.url}/preview?file=${encodeURIComponent(fileB)}`)
    ).text();
    expect(htmlA).toContain('From A');
    expect(htmlB).toContain('From B');
    expect(htmlA).toContain('from-a.md');
    expect(htmlB).toContain('from-b.md');
  });

  test('updateMarkdown writes into the file\u2019s own root', async () => {
    const fileB = path.join(rootB, 'from-b.md');
    await postCommand(server, {
      file: fileB,
      command: 'updateMarkdown',
      args: [fileB, '# From B\n\nedited\n'],
    });
    expect(fs.readFileSync(fileB, 'utf-8')).toContain('edited');
    // Root A untouched.
    expect(fs.readFileSync(path.join(rootA, 'from-a.md'), 'utf-8')).toContain(
      'From A',
    );
  });

  test('rejects files outside every root', async () => {
    const outside = path.join(path.dirname(rootA), 'evil.md');
    const response = await fetch(
      `${server.url}/preview?file=${encodeURIComponent(outside)}`,
    );
    expect(response.status).toBe(400);
  });

  test('rejects an invalid directory at startup', async () => {
    await expect(
      startServeServer({
        directories: [rootA, path.join(rootB, 'does-not-exist')],
        port: 0,
        crossnoteBuildDirectory: rootB,
      }),
    ).rejects.toThrow(/Not a directory/);
  });
});

describe('crossnote serve style.less url() mapping', () => {
  // #513 rewrites relative url() in style.less to absolute filesystem
  // paths at load time and maps them back to loadable URLs at render
  // time through the serve mapper. Root-relative references (`/files/…`,
  // `/assets/…`) are this server's own routes: they must reach the page
  // unchanged so the browser resolves them against the origin — the
  // generic file:// fallback is refused from an http page and would
  // silently break them.
  let workspace: string;
  let server: ServeServer;

  beforeAll(async () => {
    track();
    workspace = mkdirSync('crossnote-serve-css');
    fs.writeFileSync(path.join(workspace, 'note.md'), '# Note\n');
    fs.writeFileSync(path.join(workspace, 'image.png'), 'a png');
    fs.mkdirSync(path.join(workspace, '.crossnote', 'img'), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(workspace, '.crossnote', 'img', 'bg.png'),
      'a png',
    );
    // The fixture content is irrelevant — less is mocked — but the file
    // must exist for the config layer to load it.
    fs.writeFileSync(
      path.join(workspace, '.crossnote', 'style.less'),
      '/* compiled by the mock below */\n',
    );
    mockLessOutput = [
      'a { background-image: url("/files/image.png"); }',
      'b { background-image: url(img/bg.png); }',
      'c { src: url(data:font/woff2;base64,AAAA); }',
    ].join('\n');
    const buildDir = mkdirSync('crossnote-serve-css-build');
    writeFakeBuildDirectory(buildDir);
    server = await startServeServer({
      directories: [workspace],
      port: 0,
      crossnoteBuildDirectory: buildDir,
      globalConfigDirectory: path.join(
        mkdirSync('crossnote-serve-css-global'),
        'crossnote',
      ),
    });
  });

  afterAll(async () => {
    mockLessOutput = '';
    await server.close();
  });

  test('keeps root-relative urls origin-resolvable and maps resolved paths to /files/', async () => {
    const response = await fetch(
      `${server.url}/preview?file=${encodeURIComponent(
        path.join(workspace, 'note.md'),
      )}`,
    );
    expect(response.status).toBe(200);
    const html = await response.text();
    // Root-relative: passed through for the browser to resolve against
    // the origin — not rewritten to a file:// URL the page cannot load.
    expect(html).toContain('url("/files/image.png")');
    expect(html).not.toContain('file:///files/');
    // Relative: resolved against style.less's own directory at load
    // time, then mapped into the served /files/ mount at render time.
    expect(html).toContain('url("/files/.crossnote/img/bg.png")');
    // Data URLs are never touched (still unquoted, exactly as authored).
    expect(html).toContain('url(data:font/woff2;base64,AAAA)');
  });
});
