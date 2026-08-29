import * as fs from 'fs';
import * as path from 'path';
import { mkdirSync, track } from '../src/lib/temp';
import { MarkdownEngine } from '../src/markdown-engine';
import { Notebook, NotebookConfig } from '../src/notebook';
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

/**
 * Write a minimal fake crossnote build directory containing the theme
 * files the export template reads, each with a marker comment. This
 * keeps the test independent of the compiled `out/` artifacts (jest
 * runs before `pnpm build` in CI).
 */
function writeFakeBuildDirectory(root: string) {
  const previewThemeDir = path.join(root, 'styles', 'preview_theme');
  const prismThemeDir = path.join(root, 'styles', 'prism_theme');
  fs.mkdirSync(previewThemeDir, { recursive: true });
  fs.mkdirSync(prismThemeDir, { recursive: true });
  const files: Array<[string, string]> = [
    // paired preview themes (github + solarized stand in for all pairs)
    [
      path.join(previewThemeDir, 'github-light.css'),
      '/* preview:github-light */',
    ],
    [
      path.join(previewThemeDir, 'github-dark.css'),
      '/* preview:github-dark */',
    ],
    [
      path.join(previewThemeDir, 'solarized-light.css'),
      '/* preview:solarized-light */',
    ],
    [
      path.join(previewThemeDir, 'solarized-dark.css'),
      '/* preview:solarized-dark */',
    ],
    // unpaired (dark-only) preview theme
    [path.join(previewThemeDir, 'night.css'), '/* preview:night */'],
    // paired prism themes
    [path.join(prismThemeDir, 'github.css'), '/* prism:github */'],
    [path.join(prismThemeDir, 'github-dark.css'), '/* prism:github-dark */'],
    [
      path.join(prismThemeDir, 'solarized-light.css'),
      '/* prism:solarized-light */',
    ],
    [
      path.join(prismThemeDir, 'solarized-dark.css'),
      '/* prism:solarized-dark */',
    ],
    // unpaired prism themes
    [path.join(prismThemeDir, 'darcula.css'), '/* prism:darcula */'],
    // always appended
    [path.join(root, 'styles', 'style-template.css'), '/* style-template */'],
  ];
  files.forEach(([file, content]) => fs.writeFileSync(file, content));
}

describe('export color scheme (browser / HTML export follows reader scheme)', () => {
  track();

  const originalBuildDirectory = getCrossnoteBuildDirectory();
  let tmpDir: string;

  beforeAll(() => {
    tmpDir = mkdirSync({ prefix: 'xnote-export-theme' });
    writeFakeBuildDirectory(tmpDir);
    setCrossnoteBuildDirectory(tmpDir);
  });

  afterAll(() => {
    setCrossnoteBuildDirectory(originalBuildDirectory);
  });

  async function renderExportTemplate(
    config: Partial<NotebookConfig>,
    options: { isForPrint?: boolean; isForPrince?: boolean },
  ): Promise<string> {
    const notebook = await Notebook.init({
      notebookPath: tmpDir,
      config: {
        markdownParser: 'markdown-it',
        markdownYoBinaryPath: '',
        ...config,
      },
    });
    const engine = new MarkdownEngine({
      notebook,
      filePath: path.join(tmpDir, 'test.md'),
    });
    return engine.generateHTMLTemplateForExport(
      '<p>hello</p>',
      {},
      {
        isForPrint: options.isForPrint ?? false,
        isForPrince: options.isForPrince ?? false,
        offline: true,
        embedLocalImages: false,
      },
    );
  }

  test('non-paper export embeds the light/dark pair (github)', async () => {
    const html = await renderExportTemplate({}, {});

    expect(html).toContain('<meta name="color-scheme" content="light dark">');
    expect(html).toContain('/* preview:github-light */');
    expect(html).toContain('/* preview:github-dark */');
    expect(html).toContain('/* prism:github */');
    expect(html).toContain('/* prism:github-dark */');
    expect(html).toContain('@media (prefers-color-scheme: dark)');
    // within each family the light variant is the default and the dark
    // variant only appears later, inside the media query
    expect(html.indexOf('/* preview:github-light */')).toBeLessThan(
      html.indexOf('/* preview:github-dark */'),
    );
    expect(html.indexOf('/* prism:github */')).toBeLessThan(
      html.indexOf('/* prism:github-dark */'),
    );
  });

  test('non-paper export pairs every light/dark theme family (solarized)', async () => {
    const html = await renderExportTemplate(
      { previewTheme: 'solarized-light.css' },
      {},
    );

    expect(html).toContain('/* preview:solarized-light */');
    expect(html).toContain('/* preview:solarized-dark */');
    expect(html).toContain('/* prism:solarized-light */');
    expect(html).toContain('/* prism:solarized-dark */');
    expect(html).not.toContain('/* preview:github-light */');
  });

  test('themes without a light/dark pair are embedded as-is', async () => {
    const html = await renderExportTemplate({ previewTheme: 'night.css' }, {});

    expect(html).toContain('/* preview:night */');
    expect(html).toContain('/* prism:darcula */');
    expect(html).not.toContain('@media (prefers-color-scheme: dark)');
    expect(html).not.toContain('<meta name="color-scheme"');
  });

  test('paper output (print / prince) keeps the forced light theme', async () => {
    const html = await renderExportTemplate({}, { isForPrint: true });

    expect(html).toContain('/* preview:github-light */');
    expect(html).toContain('/* prism:github */');
    expect(html).not.toContain('/* preview:github-dark */');
    expect(html).not.toContain('@media (prefers-color-scheme: dark)');
    expect(html).not.toContain('<meta name="color-scheme"');

    const princeHtml = await renderExportTemplate(
      { previewTheme: 'solarized-light.css' },
      { isForPrince: true },
    );
    expect(princeHtml).toContain('/* preview:github-light */');
    expect(princeHtml).not.toContain('/* preview:solarized-dark */');
  });

  test('printBackground keeps themes for screen output too', async () => {
    const html = await renderExportTemplate(
      { printBackground: true, previewTheme: 'github-dark.css' },
      {},
    );

    expect(html).toContain('<meta name="color-scheme" content="light dark">');
    expect(html).toContain('/* preview:github-light */');
    expect(html).toContain('/* preview:github-dark */');
  });
});
