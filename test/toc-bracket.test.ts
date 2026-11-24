import * as fs from 'fs';
import * as path from 'path';
import { mkdirSync, track } from '../src/lib/temp';
import { MarkdownEngine } from '../src/markdown-engine';
import { Notebook } from '../src/notebook';

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
 * Render `markdown` as the preview of a note and return the HTML.
 */
async function renderPreview(markdown: string): Promise<string> {
  const tmpDir = mkdirSync({ prefix: 'xnote-toc-' });
  const filePath = path.join(tmpDir, 'note.md');
  fs.writeFileSync(filePath, markdown);
  const notebook = await Notebook.init({
    notebookPath: tmpDir,
    config: {
      markdownParser: 'markdown-it',
      markdownYoBinaryPath: '',
    },
  });
  const engine = new MarkdownEngine({ notebook, filePath });
  const { html } = await engine.parseMD(markdown, {
    isForPreview: true,
    useRelativeFilePath: false,
    hideFrontMatter: false,
  });
  return html;
}

describe('[toc] in the preview', () => {
  track();

  // markdown-it ends a paragraph with a newline, but a fenced block with
  // nothing, so the marker that follows it does not start a line of the
  // page (crossnote#574, as with the marker of a slide).
  test.each([
    ['a paragraph', 'Some text.'],
    ['a fenced code block', '```js\nlet a = 1;\n```'],
  ])(
    'a [toc] after %s is replaced by the table of contents',
    async (_, block) => {
      const html = await renderPreview(`# First

${block}

[toc]

# Second
`);

      expect(html).not.toContain('[CROSSNOTETOC]');
      expect(html).toContain('href="#second"');
    },
  );
});
