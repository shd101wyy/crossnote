import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';
import { mkdirSync, track } from '../../src/lib/temp';
import { buildWiki } from '../../src/wiki';
import { parseBuildWikiArgs } from '../../src/cli';
import { addFileProtocol } from '../../src/utility';

jest.mock('less', () => ({
  render: (
    _input: string,
    _options: unknown,
    callback: (error: unknown, output: { css: string } | undefined) => void,
  ) => {
    callback(null, { css: '' });
  },
}));

track();

/**
 * Minimal fake crossnote build directory with the files the preview
 * template and the wiki shell read. Keeps the tests independent of the
 * compiled out/ artifacts (jest runs before `pnpm build` in CI).
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
    [path.join(root, 'styles/prism_theme/github.css'), '/* prism:github */'],
    [path.join(root, 'server-app/server-app.js'), '// server app'],
    [path.join(root, 'server-app/server-app.css'), '/* server app css */'],
  ];
  for (const [file, content] of files) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  }
}

function writeWorkspace(root: string): void {
  fs.mkdirSync(path.join(root, 'notes'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'index.md'),
    [
      '---',
      'title: Wiki Home',
      '---',
      '',
      '# Home',
      '',
      '![](image.png)',
      '',
      '[other note](./notes/other.md)',
      '',
    ].join('\n'),
  );
  fs.writeFileSync(path.join(root, 'image.png'), 'not really a png');
  fs.writeFileSync(
    path.join(root, 'notes', 'other.md'),
    '# Other\n\n[index](../index.md)\n',
  );
}

describe('crossnote build-wiki', () => {
  let workspace: string;
  let buildDirectory: string;
  let globalConfigDirectory: string;

  beforeAll(async () => {
    track();
    workspace = mkdirSync('crossnote-build-wiki-workspace');
    writeWorkspace(workspace);
    buildDirectory = mkdirSync('crossnote-build-wiki-build');
    writeFakeBuildDirectory(buildDirectory);
    globalConfigDirectory = path.join(
      mkdirSync('crossnote-build-wiki-global'),
      'crossnote',
    );
  });

  test('builds a standalone wiki embedding every note', async () => {
    const result = await buildWiki({
      directories: [workspace],
      crossnoteBuildDirectory: buildDirectory,
      globalConfigDirectory,
    });

    expect(result.rootDirectories).toEqual([workspace]);
    expect(result.failures).toEqual([]);
    expect(result.files.map((file) => file.title)).toEqual([
      'Wiki Home',
      'other',
    ]);

    // The shell carries every note document, `<`-escaped so none of the
    // embedded HTML can break out of the script element.
    expect(result.html).toContain('window.__CROSSNOTE_WIKI__');
    expect(result.html).toContain('Wiki Home');
    const payloadMatch = result.html.match(
      /window\.__CROSSNOTE_WIKI__ = (.*?);<\/script>/s,
    );
    expect(payloadMatch).toBeTruthy();
    // The embedded payload must contain no raw `<` at all — neither from
    // note documents nor from titles — or it could close the script element.
    expect(payloadMatch?.[1]).not.toContain('<');

    // The shell is the serve app bundle (the wiki is a read-only serve UI).
    expect(result.html).toContain('// server app');

    // Local images are embedded as data URIs so the file is shareable —
    // both in the first-paint data-html and in the updateHtml payload.
    expect(result.html).toContain('data:image/png;base64,');
    // JSON.parse resolves the \u003c escapes itself.
    const payload = JSON.parse(payloadMatch?.[1] ?? 'null');
    expect(payload.files.length).toBe(2);
    for (const file of payload.files) {
      expect(file.html).toContain('data-html=');
      // Read-only wiki config, carried by the preview page's config meta.
      expect(file.html).toContain('isWiki&quot;:true');
      expect(file.html).toContain('wiki-readonly');
      // The shim must post with '*' — wiki frames have an opaque origin.
      expect(file.html).toContain("window.parent.postMessage(message, '*')");
      // The updateHtml payload the shell replays on load.
      expect(file.update.sourceUri).toBe(file.path);
      expect(typeof file.update.tocHTML).toBe('string');
    }

    // Shared build assets are referenced by tokens and stored once.
    expect(result.html).toContain('crossnote-wiki-asset:');
    expect(Object.keys(payload.assets).length).toBeGreaterThan(0);
    expect(JSON.stringify(payload.assets)).toContain('preview webview');

    // The home note carries the image and the note link; the image is
    // embedded in both the page's data-html and the update payload, and
    // the link keeps a root-relative href the shell can resolve.
    const home = payload.files.find(
      (file: { title: string }) => file.title === 'Wiki Home',
    );
    expect(home.html).toContain('data:image/png;base64,');
    expect(home.update.html).toContain('data:image/png;base64,');
    expect(home.update.html).toContain('href="/notes/other.md"');
  });

  test('throws when a directory has no markdown notes', async () => {
    const empty = mkdirSync('crossnote-build-wiki-empty');
    await expect(
      buildWiki({
        directories: [empty],
        crossnoteBuildDirectory: buildDirectory,
        globalConfigDirectory,
      }),
    ).rejects.toThrow('no markdown notes found');
  });

  test('restores the host asset-URL mapper after building', async () => {
    // The mapper is global state shared with hosts that render previews
    // (the serve server); a finished wiki build must not leak its tokens.
    await buildWiki({
      directories: [workspace],
      crossnoteBuildDirectory: buildDirectory,
      globalConfigDirectory,
    });
    expect(
      addFileProtocol(path.join(buildDirectory, 'webview/preview.js')),
    ).toBe(pathToFileURL(path.join(buildDirectory, 'webview/preview.js')).href);
  });

  test('reports notes that fail to render and builds without them', async () => {
    const root = mkdirSync('crossnote-build-wiki-partial');
    fs.writeFileSync(path.join(root, 'good.md'), '# Good\n');
    const broken = path.join(root, 'broken.md');
    fs.writeFileSync(broken, '# Broken\n');
    // Vanish between listing and rendering — htmlExportDocument's own read
    // then fails, exercising the skip-with-failure path deterministically.
    const originalReadFile = fs.promises.readFile;
    const spyOnReadFile = jest
      .spyOn(fs.promises, 'readFile')
      .mockImplementation((async (
        filePath: fs.PathOrFileDescriptor,
        ...rest: unknown[]
      ) => {
        if (filePath === broken) {
          throw new Error('boom');
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- pass-through to the original overload set
        return (originalReadFile as any)(filePath, ...rest);
      }) as unknown as typeof fs.promises.readFile);
    try {
      const result = await buildWiki({
        directories: [root],
        crossnoteBuildDirectory: buildDirectory,
        globalConfigDirectory,
      });
      expect(result.files.map((file) => file.title)).toEqual(['good']);
      expect(result.failures).toEqual([
        { path: broken, error: expect.stringContaining('boom') },
      ]);
    } finally {
      spyOnReadFile.mockRestore();
    }
  });
});

describe('crossnote build-wiki CLI argument parsing', () => {
  test('parses -o/--output and shared options', () => {
    expect(parseBuildWikiArgs(['-o', 'out.html'])).toEqual({
      directories: [],
      output: 'out.html',
    });
    const parsed = parseBuildWikiArgs([
      'notes',
      '--output',
      'wiki.html',
      '--vscode',
    ]);
    expect(parsed?.directories).toEqual([path.resolve(process.cwd(), 'notes')]);
    expect(parsed?.output).toBe('wiki.html');
    expect(parsed?.vscode).toBe(true);
  });

  test('rejects missing values and unknown options', () => {
    expect(parseBuildWikiArgs(['--output'])).toBeNull();
    expect(parseBuildWikiArgs(['--port', '8080'])).toBeNull();
    expect(parseBuildWikiArgs(['--help'])).toBeNull();
  });
});
