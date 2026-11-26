import * as fs from 'fs';
import * as path from 'path';
import { load } from 'cheerio';
import { isDangerousUrl, URL_ATTRIBUTES } from '../src/lib/dangerous-urls';
import { mkdirSync, track } from '../src/lib/temp';
import { MarkdownEngine } from '../src/markdown-engine';
import { Notebook } from '../src/notebook';
import {
  getCrossnoteBuildDirectory,
  setCrossnoteBuildDirectory,
} from '../src/utility';
import { MUTATIONS, readAgain } from './fixtures/mutating-markup';

/** A form nested in MathML: the handler is one reading away. */
const MUTATION = MUTATIONS[0];

/**
 * The sidebar table of contents of an HTML export is written outside the
 * page, so the sanitizer of the page never saw it — and it holds the headings
 * of the note, as HTML. It is sanitized where it is built.
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

/**
 * What a browser must not find in the markup: an event handler, a script, or
 * an address that runs script.
 */
function threatsOf(html: string): string[] {
  const found = readAgain(html);
  load(html)('*').each((_, el) => {
    if (!('attribs' in el)) {
      return;
    }
    for (const [name, value] of Object.entries(el.attribs)) {
      if (
        URL_ATTRIBUTES.includes(name.toLowerCase()) &&
        isDangerousUrl(value)
      ) {
        found.push(`${name}="${value}"`);
      }
    }
  });
  return found;
}

describe('the sidebar table of contents of an HTML export', () => {
  track();

  const originalBuildDirectory = getCrossnoteBuildDirectory();
  let tmpDir: string;

  beforeAll(() => {
    // The export inlines a few styles from the build directory; they can be
    // empty.
    tmpDir = mkdirSync({ prefix: 'xnote-sidebar-toc-' });
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

  /** Render `markdown` to an HTML export: its sidebar, and the TOC itself. */
  async function exportWith(markdown: string) {
    fs.writeFileSync(path.join(tmpDir, 'note.md'), markdown);
    const notebook = await Notebook.init({
      notebookPath: tmpDir,
      config: {
        markdownParser: 'markdown-it',
        markdownYoBinaryPath: '',
        enableScriptExecution: true,
      },
    });
    const engine = new MarkdownEngine({
      notebook,
      filePath: path.join(tmpDir, 'note.md'),
    });
    const { tocHTML } = await engine.parseMD(markdown, {
      isForPreview: false,
      useRelativeFilePath: true,
      hideFrontMatter: false,
    });
    const html = await engine.htmlExportDocument();
    return { tocHTML, sidebar: load(html)('div.md-sidebar-toc').html() ?? '' };
  }

  test('carries nothing of a heading that could run', async () => {
    const { tocHTML, sidebar } = await exportWith(
      [
        '# <img src=1 onerror=alert(1)>',
        '',
        '## <a href="javascript:alert(2)">y</a>',
        '',
        '## <b onmouseover=alert(3)>bold</b>',
        '',
        '## <script>alert(4)</script>script',
        '',
      ].join('\n'),
    );

    for (const markup of [tocHTML, sidebar]) {
      // Read once more, as a browser reads it.
      expect(threatsOf(markup)).toEqual([]);
    }
  });

  test('is settled where a page can read it differently', async () => {
    // The MathML of the formula and the text of the style are what it takes.
    const { tocHTML } = await exportWith(
      ['# $x$', '', `# ${MUTATION}`, '', '## after', ''].join('\n'),
    );

    expect(threatsOf(tocHTML)).toEqual([]);
    expect(tocHTML).toContain('<math');
  });

  test('is nothing for a note without a heading', async () => {
    const { tocHTML, sidebar } = await exportWith('text only\n');

    expect(tocHTML).toBe('');
    expect(sidebar).toBe('');
  });

  test('is still a table of contents', async () => {
    const { tocHTML, sidebar } = await exportWith(
      [
        '# One *em* `code`',
        '',
        '## Two <b>bold</b>',
        '',
        '### Three',
        '',
        'text',
        '',
      ].join('\n'),
    );
    const $ = load(tocHTML);

    expect(load(sidebar)('a.md-toc-link').length).toBe(3);
    expect($('a.md-toc-link[href^="#"]').length).toBe(3);
    // The heading as it is written, inside its link.
    expect($('a.md-toc-link').first().html()).toContain('<em>em</em>');
    expect($('a.md-toc-link').first().html()).toContain('<code>code</code>');
    expect($('a.md-toc-link').eq(1).html()).toContain('<b>bold</b>');
  });

  test('writes an id of a heading that holds a quote as one attribute', async () => {
    const { tocHTML } = await exportWith(
      ['# Heading {#my"id}', '', 'text', ''].join('\n'),
    );
    const link = load(tocHTML)('a.md-toc-link').first();

    expect(Object.keys(link.attr() ?? {}).sort()).toEqual(['class', 'href']);
    expect(link.attr('href')).toBe('#my"id');
  });
});
