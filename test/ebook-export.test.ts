import * as fs from 'fs';
import * as path from 'path';
import { load } from 'cheerio';
import { mkdirSync, track } from '../src/lib/temp';
import { MarkdownEngine } from '../src/markdown-engine';
import { Notebook } from '../src/notebook';
import {
  getCrossnoteBuildDirectory,
  setCrossnoteBuildDirectory,
} from '../src/utility';

/**
 * The eBook export builds a page of its own: the last list of the note is
 * its table of contents, the file of every theme it names is read into the
 * page, and the front matter gives the page its `id` and `class`. Each of
 * those is the note's, and is written after the page was sanitized.
 */

jest.mock('less', () => ({
  render: (
    _input: string,
    _options: unknown,
    callback: (error: unknown, output: { css: string } | undefined) => void,
  ) => {
    callback(null, { css: '' });
  },
}));

const MARKUP_IN_A_LINK =
  '- [<span title=" onmouseover=window.__pwn_heading=1 x="">H</span>](other.md)\n';

describe('the eBook export', () => {
  track();

  const originalBuildDirectory = getCrossnoteBuildDirectory();
  let tmpDir: string;

  beforeAll(() => {
    tmpDir = mkdirSync({ prefix: 'xnote-ebook-' });
    for (const dir of [
      'styles/prism_theme',
      'styles/preview_theme/elsewhere',
      'dependencies/reveal/js',
      'dependencies/reveal/css/theme',
    ]) {
      fs.mkdirSync(path.join(tmpDir, dir), { recursive: true });
    }
    // The styles of an eBook are all read together: each is here.
    fs.writeFileSync(
      path.join(tmpDir, 'styles', 'style-template.css'),
      '/* template */',
    );
    fs.writeFileSync(
      path.join(tmpDir, 'styles', 'twemoji.css'),
      '/* twemoji */',
    );
    fs.writeFileSync(
      path.join(tmpDir, 'styles', 'prism_theme', 'default.css'),
      '/* prism */',
    );
    // the prism theme of the light theme
    fs.writeFileSync(
      path.join(tmpDir, 'styles', 'prism_theme', 'github.css'),
      '/* prism */',
    );
    fs.writeFileSync(
      path.join(tmpDir, 'styles', 'preview_theme', 'github-light.css'),
      '/* light */',
    );
    fs.writeFileSync(
      path.join(
        tmpDir,
        'styles',
        'preview_theme',
        'elsewhere',
        'not-a-theme.css',
      ),
      '/* not a theme */ </style><img src=x onerror="window.__pwn_theme=1">',
    );
    fs.writeFileSync(path.join(tmpDir, 'other.md'), '# Other\n');
    setCrossnoteBuildDirectory(tmpDir);
  });

  afterAll(() => {
    setCrossnoteBuildDirectory(originalBuildDirectory);
  });

  /** Render `markdown` and export it as an eBook written as HTML. */
  async function exportHTML(markdown: string): Promise<string> {
    const filePath = path.join(tmpDir, 'note.md');
    fs.writeFileSync(filePath, markdown);
    const notebook = await Notebook.init({
      notebookPath: tmpDir,
      config: {
        markdownParser: 'markdown-it',
        markdownYoBinaryPath: '',
        previewTheme: 'github-light.css',
      },
    });
    const engine = new MarkdownEngine({ notebook, filePath });
    return fs.readFileSync(
      await engine.eBookExport({ fileType: 'html' }),
      'utf8',
    );
  }

  const ebookOf = (frontMatter: string) =>
    `---\nebook:\n  title: T\n${frontMatter}---\n\n${MARKUP_IN_A_LINK}`;

  test('carries the text of a link of the table of contents in its heading, not its markup', async () => {
    const $ = load(await exportHTML(ebookOf('')));
    const entry = $('[ebook-toc-level-1]');

    expect(Object.keys(entry.attr() ?? {}).sort()).toEqual([
      'ebook-toc-level-1',
      'heading',
      'id',
    ]);
    // The quotes of the text do not end the attribute: nothing of it became
    // an attribute of the entry.
    expect(entry.attr('heading')).toContain('onmouseover=window.__pwn_heading');
    expect($('[onmouseover]')).toHaveLength(0);
  });

  test('reads the file of a theme, and no other file', async () => {
    // A theme is a bare name in the folder of the themes. Anything else is
    // the theme of the notebook.
    for (const theme of [
      'elsewhere/not-a-theme.css',
      '../prism_theme/../../note.md',
    ]) {
      const html = await exportHTML(ebookOf(`  theme: ${theme}\n`));

      expect(html).not.toContain('__pwn_theme');
      expect(html).not.toContain('not a theme');
      expect(html).toContain('/* light */');
    }

    const html = await exportHTML(ebookOf('  theme: github-light.css\n'));
    expect(html).toContain('/* light */');
  });
});

describe('the class of the page in an export', () => {
  track();

  const originalBuildDirectory = getCrossnoteBuildDirectory();
  let tmpDir: string;

  beforeAll(() => {
    tmpDir = mkdirSync({ prefix: 'xnote-page-class-' });
    for (const dir of [
      path.join(tmpDir, 'styles', 'prism_theme'),
      path.join(tmpDir, 'dependencies', 'reveal', 'js'),
      path.join(tmpDir, 'dependencies', 'reveal', 'css', 'theme'),
    ]) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(tmpDir, 'styles', 'prism_theme', 'default.css'),
      '/* prism */',
    );
    setCrossnoteBuildDirectory(tmpDir);
  });

  afterAll(() => {
    setCrossnoteBuildDirectory(originalBuildDirectory);
  });

  test.each([
    ['a name', 'class: x', 'x'],
    ['a list of names', 'class: [a, 1]', 'a 1'],
    ['a boolean', 'class: true', 'true'],
    ['a number', 'class: 123', '123'],
  ])('is written as it is, with %s', async (_, frontMatter, expected) => {
    const filePath = path.join(tmpDir, 'note.md');
    fs.writeFileSync(filePath, `---\n${frontMatter}\n---\n\n# One\n`);
    const notebook = await Notebook.init({
      notebookPath: tmpDir,
      config: {
        markdownParser: 'markdown-it',
        markdownYoBinaryPath: '',
      },
    });
    const engine = new MarkdownEngine({ notebook, filePath });
    const html = await engine.htmlExportDocument();
    const page = load(html)('div.crossnote');

    expect(page.attr('class')).toBe(`crossnote markdown-preview  ${expected}`);
  });
});
