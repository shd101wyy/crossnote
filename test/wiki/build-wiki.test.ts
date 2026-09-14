import * as fs from 'fs';
import * as path from 'path';
import { mkdirSync, track } from '../../src/lib/temp';
import { buildWiki } from '../../src/wiki';
import { parseBuildWikiArgs } from '../../src/cli';

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
 * Minimal fake crossnote build directory with the files the HTML export
 * template reads, plus fake wiki-app bundles for the shell. Keeps the tests
 * independent of the compiled out/ artifacts (jest runs before `pnpm build`
 * in CI).
 */
function writeFakeBuildDirectory(root: string): void {
  const files: Array<[string, string]> = [
    [path.join(root, 'styles/preview.css'), '/* preview base */'],
    [path.join(root, 'styles/style-template.css'), '/* style-template */'],
    [
      path.join(root, 'styles/preview_theme/github-light.css'),
      '/* preview:github-light */',
    ],
    [path.join(root, 'styles/prism_theme/github.css'), '/* prism:github */'],
    [path.join(root, 'wiki-app/wiki-app.js'), '// wiki app'],
    [path.join(root, 'wiki-app/wiki-app.css'), '/* wiki app css */'],
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

    // Local images are embedded as data URIs so the file is shareable.
    expect(result.html).toContain('data:image/png;charset=utf-8;base64,');

    // Each embedded document is a complete export document and carries the
    // read-only relay script.
    expect(result.html).toContain('wiki-navigate');
    expect(result.html).toContain('<!DOCTYPE html>');
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
