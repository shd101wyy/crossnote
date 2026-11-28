import * as fs from 'fs';
import * as path from 'path';
import { load } from 'cheerio';
import { mkdirSync, track } from '../src/lib/temp';
import { MarkdownEngine } from '../src/markdown-engine';
import { Notebook, NotebookConfig } from '../src/notebook';

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
 * A notebook of the given files, its markdown rendered by the given parser.
 */
async function notebookOf(
  markdownParser: 'markdown-it' | 'pandoc' = 'markdown-it',
  files: Record<string, string> = {},
  config: Partial<Pick<NotebookConfig, 'wikiLinkResolution'>> = {},
): Promise<Notebook> {
  const tmpDir = mkdirSync({ prefix: 'xnote-slides-' });
  for (const [name, content] of Object.entries(files)) {
    const file = path.join(tmpDir, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  }
  return Notebook.init({
    notebookPath: tmpDir,
    config: {
      markdownParser,
      markdownYoBinaryPath: '',
      ...config,
    },
  });
}

/**
 * Render `markdown` as the preview of the file `name` of the notebook, and
 * return what the rendering made: the page and the table of contents.
 */
async function renderFile(
  notebook: Notebook,
  name: string,
  markdown: string,
  useRelativeFilePath: boolean = false,
): Promise<{ html: string; tocHTML: string; isPresentation: boolean }> {
  const filePath = path.join(notebook.notebookPath.fsPath, name);
  const engine = new MarkdownEngine({ notebook, filePath });
  const { html, tocHTML } = await engine.parseMD(markdown, {
    isForPreview: true,
    useRelativeFilePath,
    hideFrontMatter: false,
  });
  return { html, tocHTML, isPresentation: engine.isPreviewInPresentationMode };
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
  const notebook = await notebookOf(markdownParser, {
    'deck.md': markdown,
    ...files,
  });
  const { html, isPresentation } = await renderFile(
    notebook,
    'deck.md',
    markdown,
    useRelativeFilePath,
  );

  // The marker of a slide that was not turned into one is left in the page.
  expect(html).not.toContain('[CROSSNOTESLIDE]');
  return { html, isPresentation };
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

  // Only a `<!-- slide -->` is configured a slide. The same span, written as
  // HTML, names no slide: what follows it stays on the slide before.
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

  test('a marker written as HTML between two slides starts none: what follows it stays on the slide before', async () => {
    const slides = await renderSlides(`<!-- slide -->

# First

<span>[CROSSNOTESLIDE]</span>

# Between

<!-- slide -->

# Second
`);

    expect(slides.map(({ h, v, text }) => [h, v, text])).toEqual([
      ['0', '0', 'First Between'],
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

  test('a marker that names no slide does not take the place of one', async () => {
    const slides = await renderSlides(`<!-- slide -->

# First

<span>[CROSSNOTESLIDE:7]</span>

# Second
`);

    expect(slides.map(({ h, v, text }) => [h, v, text])).toEqual([
      ['0', '0', 'First Second'],
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

  describe('the speaker notes that are markdown', () => {
    /**
     * Render a presentation of one slide that holds the given markup, and
     * return the notes of the slide: the `aside.notes` that are its content.
     */
    async function notesOf(markup: string) {
      const { html } = await render(`<!-- slide -->\n\n# First\n\n${markup}`);
      return load(html)('section[data-h] > aside.notes');
    }

    test('the notes of an aside marked data-markdown are rendered by crossnote, and sanitized as the HTML they are then', async () => {
      // Left as markdown, reveal.js renders them itself with the `marked`
      // bundled in its notes plugin, which keeps a `javascript:` link, and
      // writes what it made into the window of its speaker view as it is
      // (#600).
      const notes = await notesOf(
        [
          '<aside class="notes" data-markdown>',
          '- **one** <img src=x onerror=alert(1)>',
          '- [two](javascript:alert(1))',
          '</aside>',
        ].join('\n'),
      );

      // reveal.js takes the notes as markdown for as long as the attribute is
      // on the aside.
      expect(notes.attr('data-markdown')).toBeUndefined();
      expect(notes.find('li strong').text()).toBe('one');
      // The image is raw HTML of the page's first rendering, so its path was
      // resolved as the path of any image of the page.
      expect(notes.find('img').attr('src')).toMatch(/\/x$/);
      expect(notes.find('[onerror]')).toHaveLength(0);
      expect(notes.find('a')).toHaveLength(0);
    });

    test('an attribute the notes give an element in markdown is not written: the notes are sanitized after they are rendered', async () => {
      // The rendering of the notes makes the attribute; a sanitizer that ran
      // before it would not have seen it.
      const notes = await notesOf(
        '<aside class="notes" data-markdown># Heading {onmouseover=alert(1)}</aside>',
      );

      expect(notes.find('h1').text().trim()).toBe('Heading');
      expect(notes.find('[onmouseover]')).toHaveLength(0);
    });

    test('the notes of every slide are rendered, not only those of the first', async () => {
      const { html } = await render(
        [
          '<!-- slide -->',
          '',
          '# First',
          '',
          '<aside class="notes" data-markdown>*a*</aside>',
          '',
          '<!-- slide -->',
          '',
          '# Second',
          '',
          '<aside class="notes" data-markdown>*b*</aside>',
        ].join('\n'),
      );
      const notes = load(html)('section[data-h] aside.notes');

      expect(notes).toHaveLength(2);
      expect(notes.eq(0).html()).toBe('<p><em>a</em></p>\n');
      expect(notes.eq(1).html()).toBe('<p><em>b</em></p>\n');
    });

    test('they are rendered with the markdown-it of the notebook', async () => {
      const notes = await notesOf(
        '<aside class="notes" data-markdown>:smile: a\nb</aside>',
      );

      expect(notes.html()).toContain('😄');
      expect(notes.html()).toContain('a<br>\nb');
    });

    test('what they hold is not given a line of the note, but a heading keeps the line it has in the note', async () => {
      // The transformer writes the line of a heading into the heading itself,
      // as attributes for the attrs plugin of markdown-it.
      const notes = await notesOf(
        '<aside class="notes" data-markdown>\n# Heading\nA paragraph.\n</aside>',
      );

      expect(notes.find('p').text()).toBe('A paragraph.');
      expect(notes.find('[data-source-line]')).toHaveLength(1);
      expect(notes.find('h1').attr('data-source-line')).toBe('6');
    });

    test('the attribute is the same in capitals', async () => {
      const notes = await notesOf(
        '<aside class="notes" DATA-MARKDOWN>*a*</aside>',
      );

      expect(notes.attr('data-markdown')).toBeUndefined();
      expect(notes.html()).toBe('<p><em>a</em></p>\n');
    });

    test('an aside without the attribute is left as it is', async () => {
      const notes = await notesOf(
        '<aside class="notes"><b>Note</b> [x](y)</aside>',
      );

      expect(notes.html()).toBe('<b>Note</b> [x](y)');
    });

    test('an element that reveal.js takes no notes from is left as it is', async () => {
      const { html } = await render(
        '<!-- slide -->\n\n# First\n\n<div class="notes" data-markdown>*a*</div>\n\n<aside data-markdown>*b*</aside>',
      );
      const marked = load(html)('section[data-h] [data-markdown]');

      expect(marked).toHaveLength(2);
      expect(marked.eq(0).prop('tagName')).toBe('DIV');
      expect(marked.eq(0).html()).toBe('*a*');
      expect(marked.eq(1).prop('tagName')).toBe('ASIDE');
      expect(marked.eq(1).html()).toBe('*b*');
    });

    test('notes within notes: the inner ones are rendered before the markdown around them', async () => {
      const outer = await notesOf(
        '<aside class="notes" data-markdown>- *outer*\n\n<aside class="notes" data-markdown>*inner*</aside></aside>',
      );

      expect(outer.attr('data-markdown')).toBeUndefined();
      expect(outer.find('li em').text()).toBe('outer');
      expect(outer.find('[data-markdown]')).toHaveLength(0);
      expect(outer.find('aside.notes').html()).toBe('<p><em>inner</em></p>\n');
    });

    test('the notes of a fragment are rendered too', async () => {
      const { html } = await render(
        '<!-- slide -->\n\n# First\n\n<div class="fragment">A point<aside class="notes" data-markdown>*a*</aside></div>',
      );
      const notes = load(html)('section[data-h] .fragment aside.notes');

      expect(notes.attr('data-markdown')).toBeUndefined();
      expect(notes.html()).toBe('<p><em>a</em></p>\n');
    });

    // Under pandoc the path of the notebook is not set to the path of the
    // note that is rendered, so where a wikilink is resolved from is what the
    // rendering makes of it. (With the default resolution, a link is relative
    // to the path it is resolved from, so it comes out the same from any.)
    test('a wikilink of the notes is resolved from the path of their note: of two notes of the same name, the one next to the note', async () => {
      const notebook = await notebookOf(
        'pandoc',
        { 'a/x.md': 'a', 'pres/x.md': 'pres' },
        { wikiLinkResolution: 'shortest' },
      );
      // Under pandoc the notes of the notebook are not looked up by a
      // rendering; they are here.
      await notebook.refreshNotes({ dir: '.', includeSubdirectories: true });
      const { html } = await renderFile(
        notebook,
        'pres/deck.md',
        '<!-- slide -->\n\n# First\n\n<aside class="notes" data-markdown>See [[x]]</aside>',
      );
      const notes = load(html)('section[data-h] > aside.notes');

      expect(notes.find('a').text()).toBe('x');
      expect(notes.find('a').attr('href')).toMatch(/\/pres\/x\.md$/);
    });

    test('the path of the notebook is given back: under pandoc, the table of contents of the note rendered next is resolved from the path of that note', async () => {
      const notebook = await notebookOf(
        'pandoc',
        { 'x.md': 'x' },
        { wikiLinkResolution: 'absolute' },
      );
      await renderFile(
        notebook,
        'pres/deck.md',
        '<!-- slide -->\n\n# First\n\n<aside class="notes" data-markdown>See [[x]]</aside>',
      );
      const { tocHTML } = await renderFile(notebook, 'doc.md', '# See [[x]]');

      expect(tocHTML).toContain('href="x.md"');
    });

    // The notes are read once more than they were written: the HTML parser
    // takes `<style @>` for an element, and CommonMark does not. In the page
    // what follows it is the text of the element, and in the reading it is
    // markup — an aside marked for markdown that was no element in the page,
    // in the element that a note itself marks as the fragment that is
    // current. reveal.js would render it with `marked`, into the speaker view
    // as it is. The sanitizer takes the marker off it, and what it holds
    // goes through the sanitizer as the HTML it now is.
    const exposed = [
      [
        'a link',
        [
          '<aside class="notes" data-markdown>',
          'x<style @>',
          '',
          '<div class="current-fragment">A<aside class="notes" data-markdown>[x](javascript:alert(1))</aside></div>',
          '</style>',
        ],
      ],
      [
        'an input that takes the focus',
        [
          '<aside class="notes" data-markdown>',
          'x<style @>',
          '',
          '<div class="current-fragment">A<aside class="notes" data-markdown>',
          '<span a="1',
          '2"><style @>',
          '<input autofocus onfocus=alert(1)>',
          '</style>',
          '</aside></div>',
          '</style>',
        ],
      ],
    ] as [string, string[]][];

    test.each(exposed)(
      'an aside marked for markdown that the rendering of the notes brings out is not left to reveal.js: %s runs nothing',
      async (_, markup) => {
        const { html } = await render(
          `<!-- slide -->\n\n# First\n\n${markup.join('\n')}`,
        );
        const $ = load(html);
        const current = $('.current-fragment aside.notes');

        // The notes reveal.js takes are there, and it takes them as HTML.
        expect(current).toHaveLength(1);
        expect($('[data-markdown]')).toHaveLength(0);
        expect($('[onfocus]')).toHaveLength(0);
        expect($('a[href^="javascript"]')).toHaveLength(0);
      },
    );
  });
});
