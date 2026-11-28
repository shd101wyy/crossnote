import * as fs from 'fs';
import * as path from 'path';
import { mkdirSync, track } from '../src/lib/temp';
import { MarkdownEngine } from '../src/markdown-engine';
import { transformMarkdown } from '../src/markdown-engine/transformer';
import { Notebook } from '../src/notebook';

/**
 * A pandoc export hands `pandoc` a markdown file of its own. A `<!-- slide -->`
 * of the note is a hint for the presentation in the preview and in the HTML
 * export: the transformer writes it as the marker the page is split on, and
 * that marker reached the document, as the text `[CROSSNOTESLIDE:0]`
 * (crossnote#591). A document pandoc writes has no slides: the transformer is
 * asked to leave the comments out, as it leaves any other comment out.
 */

/** The markdown the last `pandoc` was handed. */
let mockGivenToPandoc: string | undefined;

jest.mock('child_process', () => ({
  execFile: jest.fn(
    (
      _file: string,
      _args: string[],
      _options: unknown,
      callback: (error: null) => void,
    ) => {
      setImmediate(() => callback(null));
      return {
        stdin: {
          end(input: string) {
            mockGivenToPandoc = input;
          },
        },
      };
    },
  ),
}));

/**
 * Export `markdown` as a Word document, with `files` next to the note, and
 * return what `pandoc` was given.
 */
const exported = async (
  markdown: string,
  files: Record<string, string> = {},
): Promise<string> => {
  const tmp = mkdirSync({ prefix: 'xnote-pandoc-slides-' });
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(tmp, name), content);
  }
  const filePath = path.join(tmp, 'note.md');
  fs.writeFileSync(filePath, `---\noutput: word_document\n---\n\n${markdown}`);
  const notebook = await Notebook.init({
    notebookPath: tmp,
    config: { markdownYoBinaryPath: '' },
  });
  const engine = new MarkdownEngine({ notebook, filePath });
  mockGivenToPandoc = undefined;
  await engine.pandocExport();
  expect(mockGivenToPandoc).toBeDefined();
  // The spaces a line of the document ends with are not what these tests are about.
  return mockGivenToPandoc!
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n');
};

describe('the markdown pandoc is given for a note with slide comments', () => {
  track();

  test('a slide comment is not written into the document', async () => {
    const given = await exported(`# Title

<!-- slide -->

# First

Text one.

<!-- slide vertical=true -->

# Second

Text two.
`);

    // The front matter is still put back in front of the document.
    expect(given.startsWith('---\n')).toBe(true);
    expect(given).not.toContain('CROSSNOTESLIDE');
    expect(given).toMatch(
      /\n# First \{#first \}\n+Text one\.\n+# Second \{#second \}\n+Text two\./,
    );
  });

  test('the lines of the comment stay, as blank lines', async () => {
    const given = await exported(`Para one
<!-- slide -->
Para two
`);

    // The paragraph before the slide and the one after it are apart, as they
    // are in the preview, where the marker stands between them.
    expect(given).toMatch(/\nPara one\n\nPara two\n?$/);
  });

  test('the text of a marker is left alone', async () => {
    const typed = '<p><span>[CROSSNOTESLIDE:0]</span></p>';
    const given = await exported(`# Title

\`\`\`html
${typed}
\`\`\`

${typed}

# First
`);

    expect(given.split(typed)).toHaveLength(3);
  });

  test('in a file the note imports', async () => {
    const given = await exported(
      `# Title

@import "deck.md"
`,
      {
        'deck.md': `# First

<!-- slide -->

# Second

Text two.
`,
      },
    );

    expect(given).not.toContain('CROSSNOTESLIDE');
    expect(given).toContain('\n# Second {#second }\n\nText two.');
  });

  test('in a file the note imports by a fragment', async () => {
    const given = await exported(
      `@import "deck.md#second"
`,
      {
        // The file is cut out by the lines of the note it is read as: the lines
        // of a comment that is left out have to stay where they are.
        'deck.md': `<!-- slide -->

# First

Text one.

<!-- slide -->

# Second

Text two.
`,
      },
    );

    expect(given).not.toContain('CROSSNOTESLIDE');
    expect(given).toMatch(/\n# Second \{#second \}\n\nText two\./);
    expect(given).not.toContain('First');
  });
});

describe('a slide comment the transformer leaves out', () => {
  let tmp: string;
  let notebook: Notebook;

  beforeAll(async () => {
    tmp = mkdirSync({ prefix: 'xnote-pandoc-slides-' });
    notebook = await Notebook.init({
      notebookPath: tmp,
      config: { markdownYoBinaryPath: '' },
    });
  });

  /** The token of a rendering, as a rendering hands it down. */
  const TOKEN = '0123456789abcdef0123456789abcdef';

  /** The note as the pandoc export transforms it. */
  async function transformed(
    markdown: string,
    omitSlideComments: boolean,
    slideMarkerToken?: string,
  ) {
    return transformMarkdown(markdown, {
      fileDirectoryPath: tmp,
      projectDirectoryPath: tmp,
      filesCache: {},
      useRelativeFilePath: true,
      protocolsWhiteListRegExp: null,
      forPreview: false,
      markdownParser: 'pandoc',
      omitSlideComments,
      notebook,
      slideMarkerToken,
    });
  }

  // The lines of the comment stay, as blank as any other comment leaves them.
  test.each([
    [
      'between two paragraphs',
      'Para one\n<!-- slide -->\nPara two\n',
      'Para one\n\nPara two\n',
    ],
    [
      'with a blank line after it',
      'Para one\n<!-- slide -->\n\nPara two\n',
      'Para one\n\n\nPara two\n',
    ],
    [
      'written over several lines',
      'Para one\n<!-- slide\nid=x\n-->\nPara two\n',
      'Para one\n\n\n\nPara two\n',
    ],
    [
      'written over several lines, with a blank line after it',
      'Para one\n<!-- slide\nid=x\n-->\n\nPara two\n',
      'Para one\n\n\n\n\nPara two\n',
    ],
    [
      'in a block quote',
      '> Para one\n> <!-- slide -->\n> Para two\n',
      '> Para one\n> \n> Para two\n',
    ],
    [
      'in a block quote of two levels',
      '>> Para one\n>> <!-- slide -->\n>> Para two\n',
      '>> Para one\n>> \n>> Para two\n',
    ],
    [
      'written over several lines in a block quote',
      '> Para one\n> <!-- slide\n> id=x\n> -->\n> Para two\n',
      '> Para one\n> \n\n\n> Para two\n',
    ],
    // What follows the comment on the line it ends on stays on that line.
    [
      'with text after it on its line',
      'Para one\n<!-- slide --> trailing\nPara two\n',
      'Para one\n trailing\nPara two\n',
    ],
    [
      'in a block quote, with text after it on its line',
      '> Para one\n> <!-- slide --> quoted\n> Para two\n',
      '> Para one\n>  quoted\n> Para two\n',
    ],
    [
      'after a page break on the same line',
      'Para one\n<!-- newpage --><!-- slide -->\nPara two\n',
      'Para one\n<div class="pagebreak"> </div>\nPara two\n',
    ],
    [
      'at the start of the note',
      '<!-- slide -->\n# First\n',
      '\n# First {#first }\n',
    ],
    [
      'at the end of the note',
      '# First\n\n<!-- slide -->',
      '# First {#first }\n\n',
    ],
    [
      'at the end of the note, after a line break',
      '# First\n\n<!-- slide -->\n',
      '# First {#first }\n\n\n',
    ],
    [
      'two, one after the other',
      'Para one\n<!-- slide -->\n<!-- slide vertical=true -->\nPara two\n',
      'Para one\n\n\nPara two\n',
    ],
    [
      'in a list, which the blank line makes loose',
      '- one\n<!-- slide -->\n- two\n',
      '- one\n\n- two\n',
    ],
    [
      'written as `.slide`',
      'Para one\n<!-- .slide -->\nPara two\n',
      'Para one\n\nPara two\n',
    ],
    [
      'between a heading and its text',
      '# First\n<!-- slide -->\nText.\n',
      '# First {#first }\n\nText.\n',
    ],
  ])(
    '%s: nothing of it is written, its lines stay',
    async (_label, note, output) => {
      const { outputString } = await transformed(note, true);
      expect(outputString).toBe(output);
    },
  );

  test('the comment is still the marker of a slide where it is not left out, carrying the token it was handed', async () => {
    const { outputString, slideConfigs } = await transformed(
      '<!-- slide class="x" -->\n# First\n',
      false,
      TOKEN,
    );
    expect(outputString).toContain(
      `<p><span>[CROSSNOTESLIDE:${TOKEN}:0]</span></p>`,
    );
    expect(slideConfigs).toHaveLength(1);
  });

  test('a slide left out is no slide', async () => {
    const { outputString, slideConfigs } = await transformed(
      '<!-- slide class="x" -->\n# First\n',
      true,
    );
    expect(outputString).toBe('\n# First {#first }\n');
    expect(slideConfigs).toEqual([]);
  });
});

describe('the [toc] a pandoc export replaces', () => {
  track();

  test('a [toc] is replaced by a markdown table of contents', async () => {
    const given = await exported(`# First

[toc]

# Second
`);

    expect(given).not.toContain('[CROSSNOTETOC]');
    expect(given).toContain('- [First](#first )');
    expect(given).toContain('- [Second](#second )');
  });

  test('a [toc] inside a block quote is replaced there too', async () => {
    const given = await exported(`> # First
> [toc]
> # Second
`);

    expect(given).not.toContain('[CROSSNOTETOC]');
    expect(given).toContain('- [First](#first )');
    expect(given).toContain('- [Second](#second )');
  });

  test('a [toc] in a list item stays as typed', async () => {
    const given = await exported(`# First

- [toc]

# Second
`);

    expect(given).toContain('- [toc]');
    expect(given).not.toContain('[CROSSNOTETOC]');
    expect(given).not.toContain('- [First](#first )');
  });
});
