import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Notebook } from '../src/notebook/index';

// Integration tests for
// https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/2319 —
// headings using underscore-based emphasis must render without leaking the
// internal `{#id data-source-line="N"}` attribute block, and the rendered
// heading id must match the id recorded for TOC links.

describe('headings with underscore emphasis', () => {
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
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'heading-emphasis-'));
    notebook = await Notebook.init({
      notebookPath: tmp,
      config: { markdownParser: 'markdown-it' },
    });
  });

  afterAll(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('renders emphasis-only heading without leaking the attribute block', async () => {
    const { html } = await parse('# _Toy Story_\n');
    expect(html).toContain('<em>Toy Story</em>');
    expect(html).toMatch(/<h1[^>]*id="toy-story"/);
    // No `{#...}` text may leak into the visible output.
    expect(html.replace(/<[^>]*>/g, '')).not.toContain('{#');
  });

  it('renders bold-only heading without leaking the attribute block', async () => {
    const { html } = await parse('## __Bold Title__\n');
    expect(html).toContain('<strong>Bold Title</strong>');
    expect(html).toMatch(/<h2[^>]*id="bold-title"/);
    expect(html.replace(/<[^>]*>/g, '')).not.toContain('{#');
  });

  it('generates GitHub-style ids for emphasis closed by punctuation', async () => {
    const { html } = await parse('# x _foo bar_! end\n');
    expect(html).toMatch(/<h1[^>]*id="x-foo-bar-end"/);
    expect(html.replace(/<[^>]*>/g, '')).not.toContain('{#');
  });

  it('keeps rendered heading ids consistent with TOC anchors', async () => {
    // `x _foo_bar_ y` is pathological: markdown-it renders
    // `<em>foo_bar</em>` but the id generator keeps the underscores
    // (`x-_foo_bar_-y`). The id is escaped when embedded as a
    // `{#id}` attribute block, so the rendered id must still match
    // the id used for TOC links — and nothing may leak.
    const markdown = [
      '# _Toy Story_',
      '',
      '## x _foo bar_! end',
      '',
      '### x _foo_bar_ y',
      '',
      'content',
      '',
    ].join('\n');
    const { html, tocHTML } = await parse(markdown);

    expect(html.replace(/<[^>]*>/g, '')).not.toContain('{#');

    const renderedIds = [...html.matchAll(/<h\d[^>]*\sid="([^"]*)"/g)].map(
      (m) => m[1],
    );
    const tocAnchors = [...tocHTML.matchAll(/href="#([^"]*)"/g)].map(
      (m) => m[1],
    );
    expect(renderedIds.length).toBe(3);
    expect(tocAnchors).toEqual(renderedIds);
  });

  it('respects user-provided heading ids containing underscores', async () => {
    const { html } = await parse('# Title {#my_custom_id}\n');
    expect(html).toMatch(/<h1[^>]*id="my_custom_id"/);
    expect(html.replace(/<[^>]*>/g, '')).not.toContain('{#');
  });

  it('renders emphasis heading correctly with markdown_yo parser too', async () => {
    const notebookYo = await Notebook.init({
      notebookPath: tmp,
      config: { markdownParser: 'markdown_yo' },
    });
    const markdown = '# _Toy Story_\n\n## x _foo_bar_ y\n';
    const filePath = path.join(tmp, 'note-yo.md');
    fs.writeFileSync(filePath, markdown);
    const engine = notebookYo.getNoteMarkdownEngine(filePath);
    const { html } = await engine.parseMD(markdown, {
      useRelativeFilePath: false,
      isForPreview: true,
      hideFrontMatter: false,
    });
    expect(html).toMatch(/<h1[^>]*id="toy-story"/);
    // The escaped id must round-trip: no backslashes or `{#` may leak.
    expect(html.replace(/<[^>]*>/g, '')).not.toContain('{#');
    expect(html).not.toContain('\\_');
  });
});
