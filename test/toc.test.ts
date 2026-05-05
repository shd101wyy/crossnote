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
});
