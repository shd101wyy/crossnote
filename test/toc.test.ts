import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Notebook } from '../src/notebook/index';
import { generateSidebarToCHTML } from '../src/markdown-engine/toc';

describe('generateSidebarToCHTML', () => {
  let notebook: Notebook;

  beforeAll(async () => {
    notebook = await Notebook.init({
      notebookPath: path.resolve(__dirname, './markdown/test-files'),
      config: {
        markdownParser: 'markdown-it',
      },
    });
  });

  it('renders heading text inline so "1. Foo" is not turned into an ordered list', () => {
    // Reproduces vscode-markdown-preview-enhanced#2276 and #2277:
    // headings starting with "<digits>. <space>" used to be passed through
    // md.render() which interpreted them as block-level ordered lists,
    // producing <ol><li> wrappers and large vertical margins in the TOC.
    const html = generateSidebarToCHTML(
      [
        { content: '1. aaa', level: 1 },
        { content: '2. bbb', level: 1 },
        { content: '3. ccc', level: 1 },
      ],
      notebook.md,
      { ordered: false, depthFrom: 1, depthTo: 6, tab: '  ' },
    );
    expect(html).not.toMatch(/<ol\b/);
    expect(html).not.toMatch(/<li\b/);
    expect(html).toContain('1. aaa');
    expect(html).toContain('2. bbb');
    expect(html).toContain('3. ccc');
  });

  it('preserves inline markdown formatting in heading content', () => {
    const html = generateSidebarToCHTML(
      [{ content: '**bold** and *em*', level: 1 }],
      notebook.md,
      { ordered: false, depthFrom: 1, depthTo: 6, tab: '  ' },
    );
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>em</em>');
  });

  it('does not wrap heading text in <p> blocks', () => {
    const html = generateSidebarToCHTML(
      [{ content: 'Plain heading', level: 1 }],
      notebook.md,
      { ordered: false, depthFrom: 1, depthTo: 6, tab: '  ' },
    );
    expect(html).not.toMatch(/<p\b/);
    expect(html).toContain('Plain heading');
  });

  it('builds nested <details> for child headings', () => {
    const html = generateSidebarToCHTML(
      [
        { content: 'Parent', level: 1 },
        { content: '1. Child', level: 2 },
        { content: '2. Child', level: 2 },
      ],
      notebook.md,
      { ordered: false, depthFrom: 1, depthTo: 6, tab: '  ' },
    );
    expect(html).toContain('<details');
    expect(html).toContain('Parent');
    expect(html).toContain('1. Child');
    expect(html).toContain('2. Child');
    // Child entries must NOT be turned into an ordered list either.
    expect(html).not.toMatch(/<ol\b/);
  });

  it('renders nested <ol> when ordered is true (issue #451)', () => {
    const html = generateSidebarToCHTML(
      [
        { content: 'Section A', level: 1, id: 'section-a' },
        { content: 'Sub A1', level: 2, id: 'sub-a1' },
        { content: 'Section B', level: 1, id: 'section-b' },
      ],
      notebook.md,
      { ordered: true, depthFrom: 1, depthTo: 6, tab: '  ' },
    );
    // Container marks the ordered variant; entries become <li> inside <ol>.
    expect(html).toContain('<div class="md-toc md-toc-ordered">');
    // Top-level list plus one nested list for Sub A1 under Section A.
    expect(html.match(/<ol class="md-toc-ol">/g)).toHaveLength(2);
    expect(html.match(/<li class="md-toc-link-wrapper">/g)).toHaveLength(3);
    // Anchors keep the class + href contract used by styles and click handling.
    expect(html).toContain(
      '<li class="md-toc-link-wrapper"><a href="#section-a" class="md-toc-link">Section A</a>',
    );
    // The collapsible-tree markup must not leak into the ordered variant.
    expect(html).not.toContain('<details');
    expect(html).not.toContain('data-level');
  });

  it('renders ordered TOC headings inline without block wrappers', () => {
    const html = generateSidebarToCHTML(
      [
        { content: '1. aaa', level: 1 },
        { content: '2. bbb', level: 1 },
      ],
      notebook.md,
      { ordered: true, depthFrom: 1, depthTo: 6, tab: '  ' },
    );
    // Heading text like "1. aaa" must stay plain text; only the TOC itself
    // may introduce list markup.
    expect(html).toContain('1. aaa');
    expect(html).toContain('2. bbb');
    expect(html).not.toMatch(/<p\b/);
    expect(html.match(/<ol class="md-toc-ol">/g)).toHaveLength(1);
  });

  it('orders deeply nested headings through successive <ol> levels', () => {
    const html = generateSidebarToCHTML(
      [
        { content: 'H1', level: 1, id: 'h1' },
        { content: 'H2', level: 2, id: 'h2' },
        { content: 'H3', level: 3, id: 'h3' },
        { content: 'Other', level: 1, id: 'other' },
      ],
      notebook.md,
      { ordered: true, depthFrom: 1, depthTo: 6, tab: '  ' },
    );
    expect(html.match(/<ol class="md-toc-ol">/g)).toHaveLength(3);
    // H3 nests inside H2's <li>, which nests inside H1's <li>.
    expect(html).toContain(
      '<li class="md-toc-link-wrapper"><a href="#h1" class="md-toc-link">H1</a>\n<ol class="md-toc-ol">\n<li class="md-toc-link-wrapper"><a href="#h2" class="md-toc-link">H2</a>\n<ol class="md-toc-ol">',
    );
    expect(html).toContain('href="#other"');
  });
});

describe('front matter toc option (issue #451)', () => {
  let tmp: string;
  let notebook: Notebook;

  const parse = async (markdown: string) => {
    const filePath = path.join(tmp, 'note.md');
    fs.writeFileSync(filePath, markdown);
    const engine = notebook.getNoteMarkdownEngine(filePath);
    return engine.parseMD(markdown, {
      useRelativeFilePath: false,
      isForPreview: true,
      hideFrontMatter: false,
    });
  };

  beforeAll(async () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'toc-ordered-'));
    notebook = await Notebook.init({
      notebookPath: tmp,
      config: { markdownParser: 'markdown-it' },
    });
  });

  afterAll(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('renders [TOC] as an ordered list when toc.ordered is true', async () => {
    const { html, tocHTML } = await parse(
      [
        '---',
        'toc:',
        '  ordered: true',
        '---',
        '',
        '[TOC]',
        '',
        '# Section A',
        '',
        '## Sub A1',
        '',
        '# Section B',
        '',
      ].join('\n'),
    );
    // [TOC] block in the document body
    expect(html).toContain('<div class="md-toc md-toc-ordered">');
    expect(html).toMatch(/<ol class="md-toc-ol">/);
    expect(html).toContain('href="#section-a"');
    expect(html).toContain('href="#sub-a1"');
    expect(html).toContain('href="#section-b"');
    expect(html).not.toContain('md-toc-details');
    // Sidebar TOC shares the same markup
    expect(tocHTML).toContain('md-toc-ordered');
  });

  it('renders [TOC] as the collapsible tree by default', async () => {
    const { html } = await parse('[TOC]\n\n# Section A\n\n## Sub A1\n');
    // cheerio serializes the boolean `open` attribute as open=""
    expect(html).toMatch(/<details open(?:="")? class="md-toc-details">/);
    expect(html).not.toMatch(/<ol class="md-toc-ol"/);
  });

  it('renders the collapsible tree when toc.ordered is false', async () => {
    const { html } = await parse(
      '---\ntoc:\n  ordered: false\n---\n\n[TOC]\n\n# A\n\n## B\n',
    );
    expect(html).toMatch(/<details open(?:="")? class="md-toc-details">/);
    expect(html).not.toMatch(/<ol class="md-toc-ol"/);
  });
});
