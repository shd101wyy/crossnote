import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Notebook } from '../src/notebook/index';

describe('callouts', () => {
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
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'callout-'));
    notebook = await Notebook.init({
      notebookPath: tmp,
      config: { markdownParser: 'markdown-it' },
    });
  });

  afterAll(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('renders formatted titles without leaking them into the body', async () => {
    const { html } = await parse(
      '> [!note] Example `[!note]` **Callout**\n> Example content\n',
    );

    expect(html).toContain('<div class="callout" data-callout="note">');
    expect(html).toContain(
      '<div class="callout-title">Example <code>[!note]</code> <strong>Callout</strong></div>',
    );
    expect(html).toMatch(/<p[^>]*>Example content<\/p>/);
  });

  it('renders formatted titles for foldable callouts', async () => {
    const { html } = await parse('> [!tip]+ **More** details\n> Body\n');

    expect(html).toContain(
      '<details class="callout" data-callout="tip" open="">',
    );
    expect(html).toContain(
      '<summary class="callout-title"><strong>More</strong> details</summary>',
    );
    expect(html).toMatch(/<p[^>]*>Body<\/p>/);
  });

  // Regression tests for vscode-mpe#2375: when the marker line is its own
  // paragraph (stand-alone, or followed by a blank quoted line), stripping
  // it used to null the inline token's children, crashing the renderer
  // with `Cannot read properties of null (reading 'length')`.
  it('renders a callout whose marker line is followed by a blank quoted line', async () => {
    const { html } = await parse('> [!note]  \n> \n> Body text\n');

    expect(html).toContain('<div class="callout" data-callout="note">');
    expect(html).toContain('<div class="callout-title">Note</div>');
    expect(html).toMatch(/<p[^>]*>Body text<\/p>/);
  });

  it('renders a callout whose marker line stands alone', async () => {
    const { html } = await parse('Before\n\n> [!warning]\n\nAfter\n');

    expect(html).toContain('<div class="callout" data-callout="warning">');
    expect(html).toContain('<div class="callout-title">Warning</div>');
    expect(html).not.toContain('[!warning]');
    expect(html).toMatch(/<p[^>]*>Before<\/p>/);
    expect(html).toMatch(/<p[^>]*>After<\/p>/);
  });

  it('renders a foldable callout whose marker line stands alone', async () => {
    const { html } = await parse('> [!tip]-\n');

    expect(html).toContain('<details class="callout" data-callout="tip">');
    expect(html).toContain('<summary class="callout-title">Tip</summary>');
    expect(html).toContain('</details>');
  });

  it('renders a titled callout with a blank quoted line before the body', async () => {
    const { html } = await parse('> [!note] Custom Title\n>\n> Body text\n');

    expect(html).toContain('<div class="callout-title">Custom Title</div>');
    expect(html).toMatch(/<p[^>]*>Body text<\/p>/);
    expect(html).not.toContain('Custom Title</div>\n<p');
  });

  // vscode-mpe#2377: the title used to be rendered with
  // md.renderInline(title, env), whose parse re-runs core rules with the
  // document env — markdown-it-footnote's footnote_tail then re-emitted
  // an (empty) footnotes section inside the callout title, duplicated
  // below the real one at the document bottom.
  it('does not leak footnotes into the callout title', async () => {
    const { html } = await parse(
      '> [!warning]\n> something\n\nhere a foot point[^1]\n[^1]: something\n',
    );

    expect(html).toContain('<div class="callout-title">Warning</div>');
    // Exactly one footnotes section, at the document bottom — not one
    // inside the callout and one after it.
    expect(html.match(/<section class="footnotes">/g)).toHaveLength(1);
    expect(html).toMatch(/<\/div>\n<p[^>]*>here a foot point/);
    // The single footnotes section comes after the callout, not inside it.
    const calloutEnd = html.indexOf('<p data-source-line');
    const footnotesAt = html.indexOf('<section class="footnotes">');
    expect(footnotesAt).toBeGreaterThan(calloutEnd);
    expect(html).toMatch(/<p[^>]*>something <a href="#fnref1"/);
  });
});
