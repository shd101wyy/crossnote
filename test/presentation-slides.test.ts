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
  line: string;
  /** The `data-background-*` attributes of the slide. */
  backgrounds: Record<string, string>;
}

/**
 * Render `markdown` as the preview of a presentation and return its slides.
 */
async function renderSlides(
  markdown: string,
  markdownParser: 'markdown-it' | 'pandoc' = 'markdown-it',
  files: Record<string, string> = {},
  useRelativeFilePath: boolean = false,
): Promise<Slide[]> {
  const tmpDir = mkdirSync({ prefix: 'xnote-slides-' });
  const filePath = path.join(tmpDir, 'deck.md');
  fs.writeFileSync(filePath, markdown);
  for (const [name, content] of Object.entries(files)) {
    const file = path.join(tmpDir, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  }
  const notebook = await Notebook.init({
    notebookPath: tmpDir,
    config: {
      markdownParser,
      markdownYoBinaryPath: '',
    },
  });
  const engine = new MarkdownEngine({ notebook, filePath });
  const { html } = await engine.parseMD(markdown, {
    isForPreview: true,
    useRelativeFilePath,
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
      line: section.attribs['data-source-line'],
      backgrounds: Object.keys(section.attribs).reduce(
        (backgrounds: Record<string, string>, name) => {
          if (name.startsWith('data-background-')) {
            backgrounds[name] = section.attribs[name];
          }
          return backgrounds;
        },
        {},
      ),
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
      expect(slides[0].text).toMatch(/^First/);
      expect(slides[1].text).toBe('Second');
    },
  );

  // Pandoc puts the marker on a line of its own inside its paragraph.
  test('a slide marker after a fenced code block starts a slide under pandoc too', async () => {
    const slides = await renderSlides(
      `<!-- slide -->

# First

\`\`\`js
let a = 1;
\`\`\`

<!-- slide -->

# Second
`,
      'pandoc',
    );

    expect(slides.map(({ h, v }) => [h, v])).toEqual([
      ['0', '0'],
      ['1', '0'],
    ]);
  });

  // Only a `<!-- slide -->` is configured a slide. The same span, written as
  // HTML, is split on as well: it must not cost the document its slides.
  test('a marker written as HTML does not stop the slides from being made', async () => {
    const slides = await renderSlides(`<!-- slide -->

# First

\`\`\`js
let a = 1;
\`\`\`

<span>[CROSSNOTESLIDE]</span>

# Second
`);

    expect(slides.map(({ h, v }) => [h, v])).toEqual([['0', '0']]);
    expect(slides[0].text).toMatch(/^First .* Second$/);
  });

  const part = `<!-- slide -->

# Part A

<!-- slide -->

# Part B
`;

  test('the slides of an imported markdown file are kept', async () => {
    const slides = await renderSlides(
      `<!-- slide -->

# First

![](part.md)

<!-- slide -->

# Second
`,
      'markdown-it',
      { 'part.md': part },
    );

    expect(slides.map(({ text }) => text)).toEqual([
      'First',
      'Part A',
      'Part B',
      'Second',
    ]);
    expect(slides.map(({ line }) => line)).toEqual(['1', '5', '5', '7']);
  });

  test('the slides of a markdown file imported as the last block are kept', async () => {
    const slides = await renderSlides(
      `<!-- slide -->

# First

![](part.md)
`,
      'markdown-it',
      { 'part.md': part },
    );

    expect(slides.map(({ text }) => text)).toEqual([
      'First',
      'Part A',
      'Part B',
    ]);
  });

  test('the slides of an embedded markdown file are kept', async () => {
    const slides = await renderSlides(
      `<!-- slide -->

# First

![[part.md]]

<!-- slide -->

# Second
`,
      'markdown-it',
      { 'part.md': part },
    );

    expect(slides.map(({ text }) => text)).toEqual([
      'First',
      'Part A',
      'Part B',
      'Second',
    ]);
    expect(slides.map(({ line }) => line)).toEqual(['1', '5', '5', '7']);
  });

  test('only the slides of an imported section are kept', async () => {
    const slides = await renderSlides(
      `<!-- slide -->

# First

@import "part.md#Part A"

<!-- slide vertical=true -->

# Second
`,
      'markdown-it',
      {
        'part.md': `# Part A

<!-- slide -->

## A.2

# Part B

<!-- slide -->

## B.1
`,
      },
    );

    // The marker before `# Part B` is not in the deck: it does not take the
    // place of the one before `# Second`.
    expect(slides.map(({ text }) => text)).toEqual([
      'First Part A',
      'A.2',
      'Second',
    ]);
    expect(slides.map(({ h, v, line }) => [h, v, line])).toEqual([
      ['0', '0', '1'],
      ['1', '0', '5'],
      ['1', '1', '7'],
    ]);
  });

  test('only the slides of an imported block are kept', async () => {
    const slides = await renderSlides(
      `<!-- slide -->

# First

@import "part.md#^note"

<!-- slide vertical=true -->

# Second
`,
      'markdown-it',
      {
        'part.md': `<!-- slide -->

# Other

<!-- slide -->
Text ^note
`,
      },
    );

    expect(slides.map(({ text }) => text)).toEqual(['First', 'Text', 'Second']);
    expect(slides.map(({ h, v, line }) => [h, v, line])).toEqual([
      ['0', '0', '1'],
      ['1', '0', '5'],
      ['1', '1', '7'],
    ]);
  });

  test('the slides of a section that is not found are not brought along', async () => {
    const slides = await renderSlides(
      `<!-- slide -->

# First

@import "part.md#No such part"

<!-- slide vertical=true -->

# Second
`,
      'markdown-it',
      { 'part.md': part },
    );

    expect(slides.map(({ text }) => text)).toEqual(['First', 'Second']);
    expect(slides.map(({ h, v, line }) => [h, v, line])).toEqual([
      ['0', '0', '1'],
      ['0', '1', '7'],
    ]);
  });

  test('the slides of a block that is not found are not brought along', async () => {
    const slides = await renderSlides(
      `<!-- slide -->

# First

@import "part.md#^no such block"

<!-- slide vertical=true -->

# Second
`,
      'markdown-it',
      { 'part.md': part },
    );

    expect(slides.map(({ text }) => text)).toEqual(['First', 'Second']);
    expect(slides.map(({ h, v, line }) => [h, v, line])).toEqual([
      ['0', '0', '1'],
      ['0', '1', '7'],
    ]);
  });

  test('a section that runs to the end of its file brings its slides, and no other', async () => {
    const slides = await renderSlides(
      `<!-- slide -->

# First

@import "part.md#Part A"

<!-- slide vertical=true -->

# Second
`,
      'markdown-it',
      {
        'part.md': `<!-- slide -->
# Part A
<!-- slide -->

## A.1
`,
      },
    );

    expect(slides.map(({ text }) => text)).toEqual([
      'First Part A',
      'A.1',
      'Second',
    ]);
    expect(slides.map(({ h, v, line }) => [h, v, line])).toEqual([
      ['0', '0', '1'],
      ['1', '0', '5'],
      ['1', '1', '7'],
    ]);
  });

  // A slide marker on the first line of the part, and one on its last
  // line, are the part's; the ones just before and after it are not.
  for (const [what, hash, part, texts] of [
    [
      'a section',
      'Part A',
      `<!-- slide -->
# Part A
<!-- slide -->
## A.2
<!-- slide -->
# Part B

<!-- slide -->

## B.1
`,
      ['First Part A', 'A.2', '', 'Second'],
    ],
    [
      'a block',
      '^note',
      `<!-- slide -->

# Other

<!-- slide -->
Text ^note
<!-- slide -->
`,
      ['First', 'Text', '', 'Second'],
    ],
  ] as const) {
    test(`the markers on the first and the last line of ${what} are its slides`, async () => {
      const slides = await renderSlides(
        `<!-- slide -->

# First

@import "part.md#${hash}"

<!-- slide vertical=true -->

# Second
`,
        'markdown-it',
        { 'part.md': part },
      );

      // The marker on the last line of the part starts a slide of its own.
      expect(slides.map(({ text }) => text)).toEqual(texts);
      // Each marker of the part starts a slide of its own row.
      expect(slides.map(({ h, v, line }) => [h, v, line])).toEqual([
        ['0', '0', '1'],
        ['1', '0', '5'],
        ['2', '0', '5'],
        ['2', '1', '7'],
      ]);
    });
  }

  test('the backgrounds of the slides of a file imported from the web are left as they are written', async () => {
    // The file has no directory of its own here: the paths are resolved as
    // those of the importing file are.
    const originalFetch = global.fetch;
    global.fetch = (async () =>
      new Response(
        '<!-- slide data-background-image="bg.png" -->\n\n# From the web\n',
      )) as typeof fetch;
    try {
      const slides = await renderSlides(
        '@import "https://example.com/part.md"',
      );
      expect(slides.map(({ text }) => text)).toEqual(['From the web']);
      expect(slides[0].backgrounds['data-background-image']).toEqual(
        expect.stringMatching(/^file:\/\/.*\/bg\.png$/),
      );
      // Not a path made of the address of the file.
      expect(slides[0].backgrounds['data-background-image']).not.toContain(
        'example.com',
      );
    } finally {
      global.fetch = originalFetch;
    }
  });

  for (const useRelativeFilePath of [false, true]) {
    test(`the backgrounds of the slides of an imported file are found from that file, in ${
      useRelativeFilePath ? 'relative' : 'absolute'
    } paths`, async () => {
      const slides = await renderSlides(
        `@import "sub/part.md"`,
        'markdown-it',
        {
          'sub/part.md': `<!-- slide data-background-image="bg.png" data-background-video="https://example.com/clip.mp4" data-background-iframe="/root.html" -->

# Part A

<!-- slide data-background-video="clip.mp4#t=2" data-background-iframe="page%3F1.html" -->

# Part B
`,
        },
        useRelativeFilePath,
      );

      // How the path of a file in the directory `directory` of the notebook
      // comes out.
      const pathTo = (directory: string, file: string) =>
        useRelativeFilePath
          ? `${directory}${file}`
          : expect.stringMatching(
              new RegExp(
                `^file://.*/${directory}${file.replace(/\./g, '\\.')}$`,
              ),
            );

      // A URL, and a path from the root of the project, are as they were.
      expect(slides[0].backgrounds).toEqual({
        'data-background-image': pathTo('sub/', 'bg.png'),
        'data-background-video': 'https://example.com/clip.mp4',
        'data-background-iframe': pathTo('', 'root.html'),
      });
      // The query of a video stays one, and so does a name that is written
      // with an escaped character.
      expect(slides[1].backgrounds).toEqual({
        'data-background-video': pathTo('sub/', 'clip.mp4#t=2'),
        'data-background-iframe': pathTo('sub/', 'page%3F1.html'),
      });
    });
  }

  test('a marker that is not in a paragraph of its own starts the line it is on', async () => {
    // In a block of raw HTML the marker is a bare span on a line of its own.
    const slides = await renderSlides(`<!-- slide -->

# First

<div>
<!-- slide -->
# Second
`);

    expect(slides.map(({ h, v }) => [h, v])).toEqual([
      ['0', '0'],
      ['1', '0'],
    ]);
  });

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
