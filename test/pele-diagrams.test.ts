/**
 * The `pele` code fence in the engine: Mermaid syntax that the pele bundle
 * draws. The engine only has to hand the source to the page — as it does for
 * `mermaid` — and keep out of the way of the block attributes.
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Notebook } from '../src/notebook/index';

const FLOWCHART = 'flowchart LR\n  A[Mermaid text] --> B[SVG]';
const ESCAPED = 'flowchart LR\n  A[Mermaid text] --&gt; B[SVG]';

describe('pele code blocks', () => {
  let notebook: Notebook;
  let directory: string;

  beforeAll(async () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'crossnote-pele-'));
    fs.writeFileSync(path.join(directory, 'flow.pele'), `${FLOWCHART}\n`);
    notebook = await Notebook.init({
      notebookPath: directory,
      config: { markdownParser: 'markdown-it' },
    });
  });

  afterAll(() => {
    fs.rmSync(directory, { recursive: true, force: true });
  });

  const render = async (markdown: string) => {
    const engine = notebook.getNoteMarkdownEngine(
      path.join(directory, 'note.md'),
    );
    const { html } = await engine.parseMD(markdown, {
      useRelativeFilePath: false,
      isForPreview: true,
      hideFrontMatter: false,
    });
    return html;
  };

  it('hands the escaped source to the page in a div of class pele', async () => {
    const html = await render(
      'before\n\n```pele\nflowchart LR\n  A["<b> & c"] --> B\n```\n\nafter',
    );

    // The source is escaped: nothing of it is read as markup.
    expect(html).toMatch(
      /<div[^>]*class="pele"[^>]*>flowchart LR\n {2}A\["&lt;b&gt; &amp; c"\] --&gt; B\n<\/div>/,
    );
    expect(html).not.toContain('<b>');
    // In place of the code block, which is gone.
    expect(html).not.toContain('data-role="codeBlock"');
    expect(html).toContain('before');
    expect(html).toContain('after');
  });

  it('keeps the attributes of the fence', async () => {
    const html = await render(`\`\`\`pele {.wide #flow}\n${FLOWCHART}\n\`\`\``);

    expect(html).toContain('<div class="pele wide" id="flow"');
  });

  it('is rendered from a :::pele fence as well', async () => {
    const html = await render(`:::pele\n${FLOWCHART}\n:::`);

    expect(html).toMatch(
      /^<div[^>]*class="pele"[^>]*>flowchart LR\n {2}A\[Mermaid text\] --&gt; B\[SVG\]\n<\/div>/m,
    );
  });

  it('is rendered from an imported .pele file as well', async () => {
    const html = await render('@import "flow.pele";');

    expect(html).not.toContain('@import');
    expect(html).toMatch(
      /<div[^>]*class="pele"[^>]*>flowchart LR\n {2}A\[Mermaid text\] --&gt; B\[SVG\]\n/,
    );
  });

  it('shows the source next to the diagram with hide=false', async () => {
    const html = await render(`\`\`\`pele hide=false\n${FLOWCHART}\n\`\`\``);

    // The code block stays, and the diagram follows it.
    const codeBlock = html.indexOf('data-role="codeBlock"');
    const diagram = html.indexOf('<div hide="false"');
    expect(codeBlock).toBeGreaterThanOrEqual(0);
    expect(diagram).toBeGreaterThan(codeBlock);
    expect(html).toContain(
      `<div hide="false" data-source-line="1" class="pele">${ESCAPED}\n</div>`,
    );
  });

  it('stays a code block, highlighted as Mermaid, with code_block=true', async () => {
    const html = await render(
      `\`\`\`pele code_block=true\n${FLOWCHART}\n\`\`\``,
    );

    expect(html).not.toMatch(/<div[^>]*class="pele"/);
    expect(html).toMatch(
      /^<pre[^>]*data-role="codeBlock"[^>]*class="language-mermaid pele"/m,
    );
  });

  it('leaves a language that only starts with pele alone', async () => {
    const html = await render('```pelephant\nA --> B\n```');

    expect(html).toMatch(/<pre[^>]*class="language-pelephant pelephant"/);
  });
});
