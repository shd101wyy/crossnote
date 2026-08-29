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
});
