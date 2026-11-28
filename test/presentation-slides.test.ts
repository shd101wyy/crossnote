import * as fs from 'fs';
import * as path from 'path';
import { load } from 'cheerio';
import { mkdirSync, track } from '../src/lib/temp';
import { MarkdownEngine } from '../src/markdown-engine';
import * as transformer from '../src/markdown-engine/transformer';
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
 * A notebook in a folder of its own, with `files` in the folder.
 */
async function notebookOf(files: Record<string, string> = {}) {
  const tmpDir = mkdirSync({ prefix: 'xnote-slides-' });
  for (const [name, content] of Object.entries(files)) {
    const file = path.join(tmpDir, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  }
  const notebook = await Notebook.init({
    notebookPath: tmpDir,
    config: {
      markdownParser: 'markdown-it',
      markdownYoBinaryPath: '',
    },
  });
  return { tmpDir, notebook };
}

/**
 * Render `markdown` as the preview of a document.
 */
async function render(
  markdown: string,
  markdownParser: 'markdown-it' | 'pandoc' = 'markdown-it',
  files: Record<string, string> = {},
  useRelativeFilePath: boolean = false,
): Promise<{ html: string; isPresentation: boolean }> {
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

  // A marker of the engine that was not turned into a slide is left in the
  // page (crossnote#574). One written in the note is text, and stays: it
  // carries no token of the rendering, or that of another one.
  expect(html).not.toMatch(/\[CROSSNOTESLIDE:[0-9a-f]{32}:\d+\]/);
  return { html, isPresentation: engine.isPreviewInPresentationMode };
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
  const { html } = await render(
    markdown,
    markdownParser,
    files,
    useRelativeFilePath,
  );
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

  // markdown-it makes a row of the table of the line of a marker that comes
  // right after a table: the row is taken along with the marker, and the
  // table stays whole.
  test.each([
    ['without alignment', '| a | b |\n| - | - |\n| 1 | 2 |'],
    ['with alignment', '| a | b |\n| :- | -: |\n| 1 | 2 |'],
  ])(
    'a slide marker on the line after a table, %s, starts a slide',
    async (_, table) => {
      const { html } = await render(
        `<!-- slide -->\n\n${table}\n<!-- slide -->\n\n# Second\n`,
      );
      const slides = load(html)('section[data-h]');

      expect(
        slides
          .toArray()
          .map((section) => [
            section.attribs['data-h'],
            section.attribs['data-v'],
          ]),
      ).toEqual([
        ['0', '0'],
        ['1', '0'],
      ]);
      // The table is whole on the first slide, with its one row.
      expect(slides.eq(0).find('table tbody tr')).toHaveLength(1);
      expect(slides.eq(0).text().replace(/\s+/g, ' ').trim()).toBe('a b 1 2');
      expect(slides.eq(1).text().replace(/\s+/g, ' ').trim()).toBe('Second');
    },
  );

  // Only a `<!-- slide -->` is configured a slide. The same span, written as
  // HTML, is text: it stays where it was written, and what follows it stays
  // on the slide before.
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
    expect(slides[0].text).toContain('[CROSSNOTESLIDE]');
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

  test('the slides of a file imported by an imported file are kept', async () => {
    const slides = await renderSlides(
      `<!-- slide -->

# First

![](part.md)

<!-- slide -->

# Second
`,
      'markdown-it',
      {
        'part.md': `# Part A

![](sub/sub.md)
`,
        'sub/sub.md': `<!-- slide vertical=true -->

# Sub A

<!-- slide -->

# Sub B
`,
      },
    );

    expect(slides.map(({ h, v, line, text }) => [h, v, line, text])).toEqual([
      ['0', '0', '1', 'First Part A'],
      ['0', '1', '5', 'Sub A'],
      ['1', '0', '5', 'Sub B'],
      ['2', '0', '7', 'Second'],
    ]);
  });

  // An import indented by four spaces is a code block to markdown-it, so
  // nothing of the file reaches the page: its slides cannot either
  // (crossnote#585).
  const asCodeBlock: [string, string][] = [
    ['@import', `    @import "part.md"`],
    ['an image import', `    ![](part.md)`],
  ];

  test.each(asCodeBlock)(
    'the slides of a file imported as a code block (%s) do not take the place of the others',
    async (_, asBlock) => {
      const slides = await renderSlides(
        `<!-- slide -->

# First

${asBlock}

<!-- slide vertical=true -->

# Second
`,
        'markdown-it',
        { 'part.md': part },
      );

      expect(slides.map(({ h, v, line, text }) => [h, v, line, text])).toEqual([
        ['0', '0', '1', expect.stringMatching(/^First /)],
        ['0', '1', '7', 'Second'],
      ]);
    },
  );

  test('the slides of a file imported as a code block above the first marker do not take the place of the first slide', async () => {
    const slides = await renderSlides(
      `    @import "part.md"

<!-- slide -->

# First
`,
      'markdown-it',
      { 'part.md': part },
    );

    expect(slides.map(({ h, v, line, text }) => [h, v, line, text])).toEqual([
      ['0', '0', '3', 'First'],
    ]);
  });

  // Under pandoc an import indented by four spaces is not a code block, so
  // the slides of the file are in the deck.
  test('the slides of an indented import are kept under pandoc', async () => {
    const slides = await renderSlides(
      `<!-- slide -->

# First

    @import "part.md"

<!-- slide vertical=true -->

# Second
`,
      'pandoc',
      { 'part.md': part },
    );

    expect(slides.map(({ h, v, line, text }) => [h, v, line, text])).toEqual([
      ['0', '0', '1', 'First'],
      ['1', '0', '5', 'Part A'],
      ['2', '0', '5', 'Part B'],
      ['2', '1', '7', 'Second'],
    ]);
  });

  test('a file imported as a code block makes no presentation', async () => {
    const { html, isPresentation } = await render(
      `# Title

    @import "part.md"
`,
      'markdown-it',
      { 'part.md': part },
    );

    expect(isPresentation).toBe(false);
    expect(load(html)('h1').text()).toBe('Title ');
  });

  test('a marker written as HTML between two slides starts none: it stays as text, with what follows it on the slide before', async () => {
    const slides = await renderSlides(`<!-- slide -->

# First

<span>[CROSSNOTESLIDE]</span>

# Between

<!-- slide -->

# Second
`);

    expect(slides.map(({ h, v, text }) => [h, v, text])).toEqual([
      ['0', '0', 'First [CROSSNOTESLIDE] Between'],
      ['1', '0', 'Second'],
    ]);
  });

  test('the slides of a file imported as a code block by an imported file are not brought along', async () => {
    const slides = await renderSlides(
      `<!-- slide -->

# First

![](part.md)

<!-- slide vertical=true -->

# Second
`,
      'markdown-it',
      {
        'part.md': `# Part A

    ![](sub.md)
`,
        'sub.md': part,
      },
    );

    // The code block is on the first slide, with the part; its file's two
    // slides are nowhere.
    expect(slides.map(({ h, v, line, text }) => [h, v, line, text])).toEqual([
      ['0', '0', '1', expect.stringMatching(/^First Part A /)],
      ['0', '1', '7', 'Second'],
    ]);
  });

  test('a marker written as HTML with a number stays as text, whether or not it names a slide', async () => {
    const slides = await renderSlides(`<!-- slide -->

# First

<span>[CROSSNOTESLIDE:7]</span>

<span>[CROSSNOTESLIDE:0]</span>

# Second
`);

    expect(slides.map(({ h, v, text }) => [h, v, text])).toEqual([
      ['0', '0', 'First [CROSSNOTESLIDE:7] [CROSSNOTESLIDE:0] Second'],
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

  test('the number of a slide marker is not an attribute of the slide', async () => {
    const { html } = await render(`<!-- slide -->

# First

<!-- slide vertical -->

# Second
`);

    const attributeNames = load(html)('section.slide')
      .toArray()
      .flatMap((section) => Object.keys(section.attribs));
    expect(attributeNames.filter((name) => /marker|line/i.test(name))).toEqual([
      'data-source-line',
      'data-source-line',
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

  /**
   * A marker written as text (crossnote#589). The number of the marker of a
   * slide is no secret — `0` is always the first slide's — so wherever the
   * text of a marker reached the page it started a slide that carried the
   * class, id, background and source line of slide `n`: what comes before the
   * first slide could be shown as one, a slide was cut in the middle of an
   * element, and the attributes of one slide were put on another. Every
   * rendering now has a token of its own, which its markers carry: only a
   * marker that carries it is one.
   */
  describe('a marker written as text', () => {
    const typed = '<span>[CROSSNOTESLIDE:0]</span>';
    const first =
      '<!-- slide class="first" id="one" data-background-color="red" -->';
    const asPreview = {
      isForPreview: true,
      useRelativeFilePath: false,
      hideFrontMatter: false,
    };

    /** Each slide of a page: its attributes, and what it says. */
    const slidesOf = (html: string) => {
      const $ = load(html);
      return $('section[data-h]')
        .toArray()
        .map((section) => ({
          attributes: { ...section.attribs },
          text: $(section).text().replace(/\s+/g, ' ').trim(),
        }));
    };
    /** The class, the id and the text of each slide of a page. */
    const named = (html: string) =>
      slidesOf(html).map(({ attributes, text }) => [
        attributes.class,
        attributes.id,
        text,
      ]);

    // The reproduction of the issue. The marker is written in the note, and
    // used to start a second slide with the configuration of the first.
    test.each(['markdown-it', 'pandoc'] as const)(
      'starts no slide, and stays as the text it is (%s)',
      async (markdownParser) => {
        const { html, isPresentation } = await render(
          `${first}

# First

${typed}

# Second
`,
          markdownParser,
        );

        expect(isPresentation).toBe(true);
        expect(slidesOf(html)).toEqual([
          {
            attributes: {
              'data-background-color': 'red',
              'class': 'slide first',
              'data-source-line': '1',
              'data-h': '0',
              'data-v': '0',
              'id': 'one',
            },
            text: 'First [CROSSNOTESLIDE:0] Second',
          },
        ]);
      },
    );

    // Wherever the text of a marker reaches the page.
    const withMarker = `Part

${typed}

More part`;
    const reached: [string, string, Record<string, string>][] = [
      [
        'in a markdown file imported as an image',
        '![](part.md)',
        { 'part.md': withMarker },
      ],
      [
        'in a markdown file imported with @import',
        '@import "part.md"',
        { 'part.md': withMarker },
      ],
      [
        'in a markdown file embedded with a wikilink',
        '![[part.md]]',
        { 'part.md': withMarker },
      ],
      [
        'in an html file imported as it is',
        '@import "part.html" {code_block=false}',
        { 'part.html': `<p>Part</p>\n${typed}\n<p>More part</p>` },
      ],
    ];

    test.each(reached)('starts no slide %s', async (_, imported, files) => {
      const { html, isPresentation } = await render(
        `${first}

# First

${imported}

<!-- slide class="second" -->

# Second
`,
        'markdown-it',
        files,
      );

      expect(isPresentation).toBe(true);
      expect(named(html)).toEqual([
        ['slide first', 'one', 'First Part [CROSSNOTESLIDE:0] More part'],
        ['slide second', undefined, 'Second'],
      ]);
    });

    test('makes no slide of what comes before the first one', async () => {
      const { html, isPresentation } = await render(`# Title

${typed}

# Not a slide

<!-- slide class="second" -->

# Second
`);

      expect(isPresentation).toBe(true);
      expect(named(html)).toEqual([['slide second', undefined, 'Second']]);
      // What comes before the first slide is not in the deck.
      expect(load(html)('.reveal').text()).not.toContain('Title');
    });

    // A note embedded in the middle of a line is rendered as a page of its
    // own, by a rendering of its own.
    test('in a note embedded in the middle of a line is not a marker of the page it is embedded into', async () => {
      const { html, isPresentation } = await render(
        `${first}

# First

text ![[part.md]] more

<!-- slide class="second" -->

# Second
`,
        'markdown-it',
        { 'part.md': withMarker },
      );

      expect(isPresentation).toBe(true);
      expect(named(html)).toEqual([
        [
          'slide first',
          'one',
          'First text Part [CROSSNOTESLIDE:0] More part more',
        ],
        ['slide second', undefined, 'Second'],
      ]);
    });

    test('the deck of a note embedded in the middle of a line is not a part of the deck of the page', async () => {
      const { html } = await render(
        `${first}

# First

text ![[part.md]] more

<!-- slide class="second" -->

# Second
`,
        'markdown-it',
        { 'part.md': part },
      );
      const $ = load(html);

      // Two slides in the deck of the page; the two of the part are inside
      // the first, in a deck of their own.
      expect(
        $('.reveal')
          .first()
          .children('.slides')
          .children('section')
          .map((_i, section) => $(section).attr('class'))
          .get(),
      ).toEqual(['slide first', 'slide second']);
      expect(
        $('.wikilink-embed-content .reveal .slides > section'),
      ).toHaveLength(2);
    });

    test('that carries the token of another rendering starts no slide either', async () => {
      // The marker of a slide, as another rendering of a note wrote it.
      const { tmpDir, notebook } = await notebookOf();
      const { outputString } = await transformer.transformMarkdown(
        '<!-- slide -->\n\n# First\n',
        {
          fileDirectoryPath: tmpDir,
          projectDirectoryPath: tmpDir,
          filesCache: {},
          useRelativeFilePath: false,
          forPreview: false,
          protocolsWhiteListRegExp: null,
          notebook,
        },
      );
      const asWritten = /\[CROSSNOTESLIDE:[0-9a-f]{32}:0\]/;
      expect(outputString).toMatch(asWritten);
      const marker = asWritten.exec(outputString)![0];

      // Not through `render`, which checks that no marker with a token is
      // left in the page: this one is written in the note, and stays.
      const engine = notebook.getNoteMarkdownEngine('deck.md');
      const { html } = await engine.parseMD(
        `${first}

# First

<span>${marker}</span>

# Second
`,
        asPreview,
      );

      expect(engine.isPreviewInPresentationMode).toBe(true);
      expect(named(html)).toEqual([
        ['slide first', 'one', `First ${marker} Second`],
      ]);
    });

    test('is told from the markers of the engine by a token that is new for every rendering', async () => {
      const { notebook } = await notebookOf();
      const engine = notebook.getNoteMarkdownEngine('deck.md');
      const note = `${first}

# First

<!-- slide class="second" -->

# Second
`;
      const transform = jest.spyOn(transformer, 'transformMarkdown');
      try {
        for (let rendering = 0; rendering < 2; rendering++) {
          await engine.parseMD(note, asPreview);
        }
        // The token each rendering of the note handed down.
        const tokens = transform.mock.calls.map(
          ([, options]) => options.slideMarkerToken,
        );
        expect(tokens).toEqual([
          expect.stringMatching(/^[0-9a-f]{32}$/),
          expect.stringMatching(/^[0-9a-f]{32}$/),
        ]);
        expect(tokens[1]).not.toBe(tokens[0]);
      } finally {
        transform.mockRestore();
      }
    });

    // What a `<!-- slide … -->` configures is kept, on a second rendering of
    // the note, and in a file it imports: the slides of the file are the
    // slides of the page.
    test('while a slide comment keeps what it configures, on a second rendering and in an imported file', async () => {
      const { notebook } = await notebookOf({
        'part.md': `<!-- slide class="part" id="two" data-background-color="blue" -->

# Part A

<!-- slide vertical=true class="part-b" -->

# Part B
`,
      });
      const engine = notebook.getNoteMarkdownEngine('deck.md');
      const note = `${first}

# First

![](part.md)

<!-- slide class="third" -->

# Third
`;
      const renderings: ReturnType<typeof slidesOf>[] = [];
      for (let rendering = 0; rendering < 2; rendering++) {
        const { html } = await engine.parseMD(note, asPreview);
        renderings.push(slidesOf(html));
      }
      const described = (slides: ReturnType<typeof slidesOf>) =>
        slides.map(({ attributes, text }) => [
          attributes.class,
          attributes.id,
          attributes['data-background-color'],
          attributes['data-source-line'],
          attributes['data-h'],
          attributes['data-v'],
          text,
        ]);

      expect(described(renderings[0])).toEqual([
        ['slide first', 'one', 'red', '1', '0', '0', 'First'],
        ['slide part', 'two', 'blue', '5', '1', '0', 'Part A'],
        ['slide part-b', undefined, undefined, '5', '1', '1', 'Part B'],
        ['slide third', undefined, undefined, '7', '2', '0', 'Third'],
      ]);
      expect(renderings[1]).toEqual(renderings[0]);
    });
  });

  describe('the attributes of a slide and of a list item', () => {
    /** The names of the attributes of every element the page has under `selector`. */
    function attributes(html: string, selector: string) {
      return load(html)(selector)
        .toArray()
        .flatMap((element) =>
          'attribs' in element ? Object.keys(element.attribs) : [],
        );
    }

    const handlers: [string, string, string][] = [
      [
        'a slide',
        '<!-- slide onmouseover="alert(1)" -->\n\n# First',
        'section[data-h]',
      ],
      [
        'a slide, named in capitals',
        '<!-- slide ONMOUSEOVER=alert(1) -->\n\n# First',
        'section[data-h]',
      ],
      [
        'a list item',
        '<!-- slide -->\n\n- item <!-- .element: onclick="alert(1)" -->',
        'section[data-h] li',
      ],
    ];

    const notNames: [string, string, string, string[]][] = [
      [
        'a slide',
        '<!-- slide x>=1 -->\n\n# First',
        'section[data-h]',
        ['class', 'data-source-line', 'data-h', 'data-v'],
      ],
      [
        'a list item',
        '<!-- slide -->\n\n- item <!-- .element: x>=1 -->',
        'section[data-h] li',
        ['data-source-line'],
      ],
    ];

    test.each(handlers)(
      'an event handler written for %s is not in the page',
      async (_, markdown, selector) => {
        const { html } = await render(markdown);

        expect(load(html)(selector)).toHaveLength(1);
        expect(
          attributes(html, selector).filter((name) => /^on/i.test(name)),
        ).toEqual([]);
      },
    );

    test.each(notNames)(
      'a key that is not the name of an attribute is left out of %s',
      async (_, markdown, selector, expected) => {
        const { html, isPresentation } = await render(markdown);

        expect(isPresentation).toBe(true);
        expect(attributes(html, selector)).toEqual(expected);
      },
    );

    test('an attribute of a list item named hasOwnProperty is written like any other', async () => {
      const { html } = await render(
        '<!-- slide -->\n\n- item <!-- .element: hasOwnProperty=x -->',
      );

      expect(load(html)('section[data-h] li').attr('hasownproperty')).toBe('x');
    });

    test('the class of a slide is written with its own class, and its id once', async () => {
      const { html } = await render(
        '<!-- slide class="mine" id="first" -->\n\n# First',
      );
      const section = load(html)('section[data-h]');

      expect(section.attr('class')).toBe('slide mine');
      expect(section.attr('id')).toBe('first');
    });

    test('a class and an id written in capitals are the class and the id of the slide', async () => {
      const { html } = await render(
        '<!-- slide CLASS="mine" ID="first" -->\n\n# First',
      );
      const section = load(html)('section[data-h]');

      expect(section.attr('class')).toBe('slide mine');
      expect(section.attr('id')).toBe('first');
    });

    test('the speaker notes of a slide are sanitized as the HTML they are', async () => {
      // reveal.js writes them into the window of its speaker view as HTML.
      const { html } = await render(
        `<!-- slide data-notes='<input autofocus onfocus=alert(1)><b>Note</b>' -->\n\n# First`,
      );

      expect(load(html)('section[data-h]').attr('data-notes')).toBe(
        '<input autofocus=""><b>Note</b>',
      );
    });

    test('a character reference in a value is decoded, as it always was', async () => {
      const { html } = await render(
        '<!-- slide data-x="a&amp;b &#32; c" -->\n\n# First',
      );

      expect(load(html)('section[data-h]').attr('data-x')).toBe('a&b   c');
    });

    test('the place of a slide in the deck and its source line are written by crossnote, under whatever case they are written', async () => {
      const { html } = await render(
        '<!-- slide DATA-H=99 data-v=99 DATA-SOURCE-LINE=99 -->\n\n# First',
      );
      const section = load(html)('section[data-h]');

      expect(section.attr('data-h')).toBe('0');
      expect(section.attr('data-v')).toBe('0');
      expect(section.attr('data-source-line')).toBe('1');
      expect(Object.keys(section.attr() ?? {}).length).toBe(4);
    });

    test('a background written in capitals is a background', async () => {
      const slides = await renderSlides(
        '<!-- slide DATA-BACKGROUND-IMAGE="bg.png" -->\n\n# First',
      );

      expect(slides[0].backgrounds['data-background-image']).toEqual(
        expect.stringMatching(/^file:\/\/.*\/bg\.png$/),
      );
    });

    test('a value with quotes in it is written as it is', async () => {
      const { html } = await render(
        `<!-- slide data-x='say "hi"' -->\n\n# First`,
      );

      expect(load(html)('section[data-h]').attr('data-x')).toBe('say "hi"');
    });

    test.each([
      'data-background-image',
      'data-background-video',
      'data-background-iframe',
    ])('%s written without an address is no background', async (attribute) => {
      const slides = await renderSlides(
        `<!-- slide ${attribute} -->\n\n# First`,
      );

      expect(
        slides.map(({ text, backgrounds }) => [text, backgrounds]),
      ).toEqual([['First', {}]]);
    });

    // The address is read as a browser reads it: reveal.js loads it in an
    // iframe of its own making, and a browser leaves a tab out of it.
    test.each([
      'javascript:alert(1)',
      'java&#9;script:alert(1)',
      '&#1;javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
    ])(
      'a background iframe whose address %s would run script is no background of an exported page',
      async (address) => {
        // An export has the paths of its files relative: an address that is
        // not a path is left as it is written.
        const { html } = await render(
          `<!-- slide data-background-iframe="${address}" data-background-image="bg.png" -->\n\n# First`,
          'markdown-it',
          {},
          true,
        );
        const section = load(html)('section[data-h]');

        expect(section).toHaveLength(1);
        expect(section.attr('data-background-iframe')).toBeUndefined();
        // A background of another kind is not touched.
        expect(section.attr('data-background-image')).toBe('bg.png');
      },
    );
  });
});
