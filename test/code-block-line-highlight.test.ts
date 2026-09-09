import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Notebook } from '../src/notebook/index';

/**
 * {highlight=...} line-highlight bands (vscode-mpe#2378, #2403, #2404).
 *
 * The bands are absolutely positioned overlays whose color comes from the
 * theme (`--line-highlight-background`, which may be opaque). They stay
 * readable only because style-template.less raises the `code` element (and
 * the line-number gutter) above the bands. That CSS targets
 * `pre[data-line] > code` — it relies on two markup facts asserted below:
 *
 * 1. the code element is a *direct child* of the highlighted pre, and
 * 2. the code element carries no `language-` class of its own (only the
 *    pre does), which is why the old guard
 *    `pre[class*='language-'] > code[class*='language-']` — inherited from
 *    the upstream prism github-dark theme — never matched crossnote markup
 *    and the bands painted over the text.
 */
describe('code block line highlighting', () => {
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
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'line-highlight-'));
    notebook = await Notebook.init({
      notebookPath: tmp,
      config: { markdownParser: 'markdown-it' },
    });
  });

  afterAll(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it('keeps the highlighted code a direct, class-less child of pre[data-line]', async () => {
    const { html } = await parse(
      '```javascript {highlight=[1-2]}\nfunction example() {\n  console.log("Line 2");\n}\n```',
    );

    expect(html).toMatch(
      /<pre [^>]*data-line="1-2"[^>]*><code><span class="token keyword keyword-function">function<\/span>/,
    );
    // The band wrapper follows the code inside the same pre.
    expect(html).toMatch(/<\/code><div class="line-highlight-wrapper">/);
    expect(html).toMatch(
      /<div aria-hidden="true" class="line-highlight" data-range="1-2" data-start="1" data-end="2">/,
    );
  });

  it('keeps the same shape when Prism cannot highlight the language', async () => {
    const { html } = await parse(
      '```notalanguage {highlight=1}\nsome text\n```',
    );

    // Plain-text fallback: still a bare direct <code> child, so the same
    // `pre[data-line] > code` layering rule must cover it.
    expect(html).toMatch(
      /<pre [^>]*data-line="1"[^>]*><code>some text\n<\/code>/,
    );
  });

  it('ships the underlay layering rules in style-template.less', () => {
    const template = fs.readFileSync(
      path.resolve(__dirname, '../styles/style-template.less'),
      'utf8',
    );

    // The code and the line-number gutter must paint above the bands;
    // the rules live inside the `pre[data-line]` block.
    expect(template).toMatch(/pre\[data-line\] \{[\s\S]*?> code \{/);
    const codeBlock = template.match(
      /pre\[data-line\] \{([\s\S]*?)\n {4}\.line-highlight-wrapper/,
    );
    expect(codeBlock).toBeTruthy();
    expect(codeBlock![1]).toMatch(
      /> code \{[\s\S]*?position: relative;[\s\S]*?z-index: 1;/,
    );
    expect(codeBlock![1]).toMatch(/\.line-numbers-rows \{[\s\S]*?z-index: 1;/);
  });
});
