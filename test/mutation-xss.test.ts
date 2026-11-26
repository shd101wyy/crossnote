import * as fs from 'fs';
import * as path from 'path';
import { mkdirSync, track } from '../src/lib/temp';
import { MarkdownEngine } from '../src/markdown-engine';
import { Notebook } from '../src/notebook';
import {
  LONG_MUTATION,
  MUTATIONS,
  readAgain,
} from './fixtures/mutating-markup';

/**
 * The page `parseMD` returns is read once more by the browser that shows it:
 * an HTML export is a document, the preview is written into an element. In
 * MathML and SVG that reading can differ from the sanitizer's, which saw text
 * where the page finds an element with an event handler. So a page's reading
 * of the page is what is checked here, by reading it again.
 */

track();

/**
 * Render `markdown` — as a preview, or as an export, whose paths are
 * relative — and return the HTML the engine gives back.
 */
async function render(markdown: string, isForPreview: boolean) {
  const tmpDir = mkdirSync({ prefix: 'xnote-mutation-' });
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
    isForPreview,
    useRelativeFilePath: !isForPreview,
    hideFrontMatter: false,
  });
  return html;
}

/** `markup` as a note writes raw HTML: a block of its own. */
const block = (markup: string) => `<div>\n${markup}\n</div>\n`;

describe('the page a note is rendered to', () => {
  describe.each([
    ['in a preview', true],
    ['in an export', false],
  ])('%s', (_, isForPreview) => {
    test.each([...MUTATIONS, LONG_MUTATION])(
      'has no event handler once a page reads it again: %s',
      async (markup) => {
        expect(readAgain(await render(block(markup), isForPreview))).toEqual(
          [],
        );
      },
    );

    test('has no event handler in a slide once a page reads it again', async () => {
      const markdown = `<!-- slide -->\n\n${block(MUTATIONS[0])}`;
      expect(readAgain(await render(markdown, isForPreview))).toEqual([]);
    });

    test('has no event handler in a slide that begins inside the text of a style', async () => {
      // To the engine the markup is the text of the first style; the slides
      // are cut out of the page after that, and in its slide the markup is
      // read as markup, with MathML around a style of its own.
      const markdown = [
        '<!-- slide -->',
        '',
        '# One',
        '',
        '<style>',
        '',
        '<!-- slide -->',
        '',
        MUTATIONS[0],
        '</style>',
        '',
      ].join('\n');
      expect(readAgain(await render(markdown, isForPreview))).toEqual([]);
    });
  });

  test('keeps the MathML of a formula as it is', async () => {
    const html = await render('$x^2 + y^2 = z^2$\n', true);

    expect(html).toContain('<span class="katex">');
    expect(html).toContain('<math xmlns="http://www.w3.org/1998/Math/MathML">');
  });
});
