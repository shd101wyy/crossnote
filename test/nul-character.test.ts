import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Notebook } from '../src/notebook/index';

// vscode-mpe#2394 reported that a document containing a NUL (\0) byte
// rendered only up to that byte. The pipeline is verified to be NUL-safe:
// markdown-it's normalize rule (and markdown_yo likewise) replaces \0 with
// U+FFFD before tokenization, so nothing downstream — transformers, render
// enhancers, the sanitizer, or the `data-html` attribute the preview embeds
// in `<body>` — ever sees a raw NUL, and content after it keeps rendering.
// These tests lock that in so a future parser/transformer change cannot
// reintroduce truncation or leak raw NUL bytes into the preview HTML.
describe('documents containing NUL characters', () => {
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
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'nul-char-'));
    notebook = await Notebook.init({
      notebookPath: tmp,
      config: { markdownParser: 'markdown-it' },
    });
  });

  afterAll(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('renders content after a NUL byte and never emits a raw NUL', async () => {
    const { html } = await parse(
      'before\0after\n\nmore **content** here\n\n## Section 2\n\ntail content\n',
    );

    expect(html).not.toContain('\0');
    expect(html).toContain('before\uFFFDafter');
    expect(html).toContain('<strong>content</strong>');
    expect(html).toContain('<h2 id="section-2"');
    expect(html).toContain('tail content');
  });

  it.each([
    ['inside a fenced code block', '```\ncode-before\0code-after\n```\n'],
    ['inside inline code', 'text `x\0y` text\n'],
    ['inside a heading', '# head\0ing\n'],
    ['inside inline raw HTML', 'a <span>in\0line</span> b\n'],
    ['as the first character of the document', '\0start\n'],
  ])('keeps rendering the document with a NUL %s', async (_, snippet) => {
    const { html } = await parse(`${snippet}\ntail marker\n`);

    expect(html).not.toContain('\0');
    expect(html).toContain('tail marker');
  });

  it('does not leak a raw NUL into the preview template', async () => {
    const filePath = path.join(tmp, 'note.md');
    fs.writeFileSync(filePath, 'before\0after\n\ntail content\n');
    const engine = notebook.getNoteMarkdownEngine(filePath);
    const template = await engine.generateHTMLTemplateForPreview({
      inputString: 'before\0after\n\ntail content\n',
      config: {},
      vscodePreviewPanel: null,
    });

    // The template is assigned to `webview.html`; a raw NUL inside the
    // `data-html` attribute would at best corrupt the preview markdown.
    expect(template).not.toContain('\0');
    expect(template).toContain('before\uFFFDafter');
    expect(template).toContain('tail content');
  });

  it('renders content after a NUL byte with the markdown_yo parser too', async () => {
    const notebookYo = await Notebook.init({
      notebookPath: tmp,
      config: { markdownParser: 'markdown_yo' },
    });
    const filePath = path.join(tmp, 'note-yo.md');
    fs.writeFileSync(filePath, 'before\0after\n\ntail content\n');
    const engine = notebookYo.getNoteMarkdownEngine(filePath);
    const { html } = await engine.parseMD('before\0after\n\ntail content\n', {
      useRelativeFilePath: false,
      isForPreview: true,
      hideFrontMatter: false,
    });

    expect(html).not.toContain('\0');
    expect(html).toContain('tail content');
  });
});
