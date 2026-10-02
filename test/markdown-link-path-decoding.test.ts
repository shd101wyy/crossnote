import * as fs from 'fs';
import * as path from 'path';
import { mkdirSync, track } from '../src/lib/temp';
import { MarkdownEngine } from '../src/markdown-engine';
import { Notebook } from '../src/notebook';
import {
  addFileProtocol,
  getCrossnoteBuildDirectory,
  setCrossnoteBuildDirectory,
} from '../src/utility';

jest.mock('less', () => ({
  render: (
    _input: string,
    _options: unknown,
    callback: (error: unknown, output: { css: string } | undefined) => void,
  ) => {
    callback(null, { css: '' });
  },
}));

function writeFakeBuildDirectory(root: string) {
  for (const dir of [
    'styles/preview_theme',
    'styles/prism_theme',
    'dependencies/katex/fonts',
    'dependencies/mermaid',
    'dependencies/reveal/css/theme',
  ]) {
    fs.mkdirSync(path.join(root, dir), { recursive: true });
  }
  const files: Array<[string, string]> = [
    ['styles/preview_theme/github-light.css', '/* preview:github-light */'],
    ['styles/preview_theme/github-dark.css', '/* preview:github-dark */'],
    ['styles/prism_theme/github.css', '/* prism:github */'],
    ['styles/prism_theme/default.css', '/* prism:default */'],
    ['styles/style-template.css', '/* style-template */'],
    ['dependencies/katex/katex.min.css', '/* katex */'],
    ['dependencies/mermaid/mermaid.min.js', '/* mermaid */'],
    ['dependencies/reveal/css/reveal.css', '/* reveal */'],
    ['dependencies/reveal/css/theme/white.css', '/* reveal theme */'],
  ];
  files.forEach(([file, content]) =>
    fs.writeFileSync(path.join(root, file), content),
  );
}

/**
 * Non-ASCII (and space) characters in *relative* markdown link destinations
 * used to be percent-encoded twice in every non-relative render — HTML/PDF
 * export, `openInBrowser`, and `crossnote serve` — producing `img`/`a` URLs
 * like `…/%25E5%259B%25BE.png` that no browser could resolve. The relative
 * part of the path came from mdurl (already percent-encoded once), while the
 * document directory was a raw filesystem path, so only the link part got
 * corrupted (vscode-mpe#2441).
 */
describe('markdown link destinations are decoded before path resolution', () => {
  track();

  const originalBuildDirectory = getCrossnoteBuildDirectory();
  let tmpDir: string;
  let cjkDir: string;
  let notebook: Notebook;

  beforeAll(async () => {
    tmpDir = mkdirSync({ prefix: 'xnote-link-decoding' });
    writeFakeBuildDirectory(tmpDir);
    setCrossnoteBuildDirectory(tmpDir);
    cjkDir = path.join(tmpDir, '中文目录');
    fs.mkdirSync(cjkDir, { recursive: true });
    notebook = await Notebook.init({
      notebookPath: tmpDir,
      config: {
        markdownParser: 'markdown-it',
        markdownYoBinaryPath: '',
        mathRenderingOption: 'KaTeX',
      },
    });
  });

  afterAll(() => {
    setCrossnoteBuildDirectory(originalBuildDirectory);
  });

  async function parseForExport(
    body: string,
    options: Record<string, unknown> = {},
  ) {
    const engine = new MarkdownEngine({
      notebook,
      filePath: path.join(cjkDir, 'a.md'),
    });
    return engine.parseMD(body, {
      useRelativeFilePath: false,
      hideFrontMatter: true,
      isForPreview: false,
      ...options,
    });
  }

  test('image src with non-ASCII filename is encoded exactly once', async () => {
    const { html } = await parseForExport('![t](./图.png)');
    const src = html.match(/<img src="([^"]*)"/)?.[1] ?? '';

    // Exactly once: `图` appears as %E5%9B%BE, never as %25E5%259B%25BE.
    expect(src).toBe(addFileProtocol(path.join(cjkDir, '图.png')));
    expect(src).toContain('%E5%9B%BE.png');
    expect(src).not.toContain('%25');
  });

  test('image src with percent-encoded space is encoded exactly once', async () => {
    const { html } = await parseForExport('![t](./my%20img.png)');
    const src = html.match(/<img src="([^"]*)"/)?.[1] ?? '';

    expect(src).toBe(addFileProtocol(path.join(cjkDir, 'my img.png')));
    expect(src).not.toContain('%25');
  });

  test('a[href] with non-ASCII filename is encoded exactly once', async () => {
    const { html } = await parseForExport('[t](./笔记.md)');
    const href = html.match(/<a href="([^"]*)"/)?.[1] ?? '';

    expect(href).toBe(addFileProtocol(path.join(cjkDir, '笔记.md')));
    expect(href).not.toContain('%25');
  });

  test('notebook-root-relative (/图.png) resolves against the project dir', async () => {
    const { html } = await parseForExport('![t](/根.png)');
    const src = html.match(/<img src="([^"]*)"/)?.[1] ?? '';

    expect(src).toBe(addFileProtocol(path.join(tmpDir, '根.png')));
    expect(src).not.toContain('%25');
  });

  test('relative render (useRelativeFilePath) keeps the URL-encoded destination', async () => {
    // Browsers resolve the encoded form; decoding it here would break e.g.
    // `%23` in a filename (it would become a URL fragment).
    const { html } = await parseForExport('![t](./图.png)', {
      useRelativeFilePath: true,
    });

    expect(html).toContain('src="./%E5%9B%BE.png"');
  });

  test('embedLocalImages reads the real file (html export embed_local_images)', async () => {
    // embedded-local-images round-trips through removeFileProtocol, which
    // decodes once; with the pre-fix double-encoded URL the filename was
    // still encoded after that decode, so fs.readFile missed the real file.
    fs.writeFileSync(path.join(cjkDir, '图.png'), 'PNGDATA');
    const engine = new MarkdownEngine({
      notebook,
      filePath: path.join(cjkDir, 'a.md'),
    });
    const { html: body } = await engine.parseMD('![t](./图.png)', {
      useRelativeFilePath: false,
      hideFrontMatter: true,
      isForPreview: false,
    });
    const full = await engine.generateHTMLTemplateForExport(
      body,
      {},
      {
        isForPrint: false,
        isForPrince: false,
        embedLocalImages: true,
        offline: false,
      },
    );

    expect(full).toContain(
      `data:image/png;charset=utf-8;base64,${Buffer.from('PNGDATA').toString('base64')}`,
    );
  });

  test('protocols, data: URLs and anchors are untouched', async () => {
    const { html } = await parseForExport(
      '![t](https://example.com/图.png) ![d](data:image/png;base64,AAA) [x](#sec)',
    );

    expect(html).toContain('src="https://example.com/%E5%9B%BE.png"');
    expect(html).toContain('src="data:image/png;base64,AAA"');
    expect(html).toContain('href="#sec"');
  });

  test('a bare % in a destination is kept as-is', async () => {
    // decodeURIComponent throws on `50%.png`; the decoder must keep it so
    // files literally named `50%.png` still resolve.
    const { html } = await parseForExport('![t](<./50%.png>)');
    const src = html.match(/<img src="([^"]*)"/)?.[1] ?? '';

    expect(src).toBe(addFileProtocol(path.join(cjkDir, '50%.png')));
  });
});
