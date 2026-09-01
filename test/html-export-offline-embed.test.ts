import * as fs from 'fs';
import * as path from 'path';
import { mkdirSync, track } from '../src/lib/temp';
import { MarkdownEngine } from '../src/markdown-engine';
import { Notebook } from '../src/notebook';
import {
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
  const previewThemeDir = path.join(root, 'styles', 'preview_theme');
  const prismThemeDir = path.join(root, 'styles', 'prism_theme');
  const katexFontsDir = path.join(root, 'dependencies', 'katex', 'fonts');
  const mermaidDir = path.join(root, 'dependencies', 'mermaid');
  fs.mkdirSync(previewThemeDir, { recursive: true });
  fs.mkdirSync(prismThemeDir, { recursive: true });
  fs.mkdirSync(katexFontsDir, { recursive: true });
  fs.mkdirSync(mermaidDir, { recursive: true });

  const files: Array<[string, string]> = [
    [
      path.join(previewThemeDir, 'github-light.css'),
      '/* preview:github-light */',
    ],
    [
      path.join(previewThemeDir, 'github-dark.css'),
      '/* preview:github-dark */',
    ],
    [path.join(prismThemeDir, 'github.css'), '/* prism:github */'],
    [path.join(prismThemeDir, 'github-dark.css'), '/* prism:github-dark */'],
    [path.join(root, 'styles', 'style-template.css'), '/* style-template */'],
    [
      path.join(root, 'dependencies', 'katex', 'katex.min.css'),
      '@font-face{font-family:KaTeX_Main;src:url(fonts/KaTeX_Main-Regular.woff2) format("woff2"),url(fonts/KaTeX_Main-Regular.woff) format("woff")}.katex{font-family:KaTeX_Main}',
    ],
    [path.join(katexFontsDir, 'KaTeX_Main-Regular.woff2'), 'WOFF2FONT'],
    [path.join(katexFontsDir, 'KaTeX_Main-Regular.woff'), 'WOFF1FONT'],
    [
      path.join(mermaidDir, 'mermaid.min.js'),
      'window.MERMAID_OFFLINE_MARKER = true;',
    ],
  ];
  files.forEach(([file, content]) => fs.writeFileSync(file, content));
}

describe('HTML export offline asset embedding', () => {
  track();

  const originalBuildDirectory = getCrossnoteBuildDirectory();
  let tmpDir: string;

  beforeAll(() => {
    tmpDir = mkdirSync({ prefix: 'xnote-html-offline-embed' });
    writeFakeBuildDirectory(tmpDir);
    setCrossnoteBuildDirectory(tmpDir);
  });

  afterAll(() => {
    setCrossnoteBuildDirectory(originalBuildDirectory);
  });

  async function renderExportTemplate(
    bodyHtml: string,
    options: {
      offline: boolean;
      embedOfflineAssets?: boolean;
    },
  ): Promise<string> {
    const notebook = await Notebook.init({
      notebookPath: tmpDir,
      config: {
        markdownParser: 'markdown-it',
        markdownYoBinaryPath: '',
        mathRenderingOption: 'KaTeX',
      },
    });
    const engine = new MarkdownEngine({
      notebook,
      filePath: path.join(tmpDir, 'test.md'),
    });
    return engine.generateHTMLTemplateForExport(
      bodyHtml,
      {},
      {
        isForPrint: false,
        isForPrince: false,
        offline: options.offline,
        embedLocalImages: false,
        embedOfflineAssets: options.embedOfflineAssets,
      },
    );
  }

  const mermaidBody = '<div class="mermaid">graph TD; A-->B;</div>';

  test('offline+embed inlines katex css and mermaid js without file:// deps', async () => {
    const html = await renderExportTemplate(mermaidBody, {
      offline: true,
      embedOfflineAssets: true,
    });

    expect(html).not.toMatch(/file:\/\//);
    expect(html).not.toMatch(
      /<link rel="stylesheet" href="[^"]*katex\.min\.css"/,
    );
    expect(html).not.toMatch(/<script[^>]*src="[^"]*mermaid\.min\.js"/);
    expect(html).toContain('window.MERMAID_OFFLINE_MARKER = true;');
    expect(html).toContain('.katex{font-family:KaTeX_Main}');
    expect(html).toContain(
      'data:font/woff2;base64,' + Buffer.from('WOFF2FONT').toString('base64'),
    );
    expect(html).not.toContain(Buffer.from('WOFF1FONT').toString('base64'));
  });

  test('offline without embed still uses file:// (Open in Browser / PDF)', async () => {
    const html = await renderExportTemplate(mermaidBody, {
      offline: true,
    });

    expect(html).toMatch(/file:\/\/.*katex\.min\.css/);
    expect(html).toMatch(/file:\/\/.*mermaid\.min\.js/);
    expect(html).not.toContain('window.MERMAID_OFFLINE_MARKER = true;');
  });

  test('cdn export still uses https urls', async () => {
    const html = await renderExportTemplate(mermaidBody, {
      offline: false,
    });

    expect(html).toMatch(/https:\/\/.*katex@/);
    expect(html).toMatch(/https:\/\/.*mermaid@/);
    expect(html).not.toContain('window.MERMAID_OFFLINE_MARKER = true;');
  });

  test('plain paragraph does not inline mermaid.js', async () => {
    const html = await renderExportTemplate('<p>hello</p>', {
      offline: true,
      embedOfflineAssets: true,
    });

    expect(html).not.toContain('window.MERMAID_OFFLINE_MARKER = true;');
    expect(html).toContain('.katex{font-family:KaTeX_Main}');
  });
});
