import * as fs from 'fs';
import * as path from 'path';
import { load } from 'cheerio';
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

/** One slide of a presentation: where it is in the deck and what it says. */
interface Slide {
  h: string;
  v: string;
  text: string;
}

/**
 * Render `markdown` as the preview of a presentation and return its slides.
 */
async function renderSlides(markdown: string): Promise<Slide[]> {
  const tmpDir = mkdirSync({ prefix: 'xnote-slides-' });
  const filePath = path.join(tmpDir, 'deck.md');
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

  // The marker of a slide that was not turned into one is left in the page.
  expect(html).not.toContain('[CROSSNOTESLIDE]');
  const $ = load(html);
  return $('section[data-h]')
    .toArray()
    .map((section) => ({
      h: section.attribs['data-h'],
      v: section.attribs['data-v'],
      text: $(section).text().replace(/\s+/g, ' ').trim(),
    }));
}

describe('slides of a presentation', () => {
  track();

  const blocks: [string, string][] = [
    ['a paragraph', 'Some text.'],
    ['a list', '- one\n- two'],
    ['a table', '| a | b |\n| - | - |\n| 1 | 2 |'],
    ['a fenced code block', '```js\nlet a = 1;\n```'],
    ['a Mermaid diagram', '```mermaid\nflowchart LR\n  A --> B\n```'],
    ['a math block', '$$\nx^2 + y^2 = z^2\n$$'],
  ];

  // markdown-it ends a paragraph, a list or a table with a newline, but a
  // fenced block with nothing, so the marker that follows it does not start
  // a line (crossnote#574).
  test.each(blocks)(
    'a slide marker after %s starts a slide',
    async (_, block) => {
      const slides = await renderSlides(`<!-- slide -->

# First

${block}

<!-- slide -->

# Second
`);

      expect(slides.map(({ h, v }) => [h, v])).toEqual([
        ['0', '0'],
        ['1', '0'],
      ]);
      expect(slides[0].text).toMatch(/^First /);
      expect(slides[1].text).toBe('Second');
    },
  );

  test('a vertical marker starts the next slide of a stack', async () => {
    const slides = await renderSlides(`<!-- slide -->

# First

<!-- slide vertical -->

# Second

<!-- slide -->

# Third
`);

    expect(slides.map(({ h, v, text }) => [h, v, text])).toEqual([
      ['0', '0', 'First'],
      ['0', '1', 'Second'],
      ['1', '0', 'Third'],
    ]);
  });

  test('what comes before the first marker is not a slide', async () => {
    const slides = await renderSlides(`# Not a slide

<!-- slide -->

# First
`);

    expect(slides.map(({ h, text }) => [h, text])).toEqual([['0', 'First']]);
  });
});
