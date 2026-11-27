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
 * asked to leave the comments out, as if they were not written.
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
  exec: jest.fn(),
}));

/** Export `markdown` as a Word document, and return what `pandoc` was given. */
const exported = async (markdown: string): Promise<string> => {
  const tmp = mkdirSync({ prefix: 'xnote-pandoc-slides-' });
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

  test('what comes after a comment is where it was, without a blank line glued on', async () => {
    const given = await exported(`Para one
<!-- slide -->
Para two
`);

    expect(given).not.toContain('CROSSNOTESLIDE');
    // As if the comment was not written: one paragraph.
    expect(given).toMatch(/Para one\nPara two/);
  });

  test('the text of a marker is left alone', async () => {
    const typed = '<p><span>[CROSSNOTESLIDE:0]</span></p>';
    const given = await exported(`# Title

\`\`\`html
${typed}
\`\`\`

<span>[CROSSNOTESLIDE:0]</span>

# First
`);

    expect(given).toContain(typed);
    expect(given).toContain('<span>[CROSSNOTESLIDE:0]</span>');
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

  /** The note as the pandoc export transforms it. */
  async function transformed(markdown: string, omitSlideComments: boolean) {
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
    });
  }

  // Each note, and the note the comment is cut out of.
  test.each([
    [
      'between two paragraphs',
      'Para one\n<!-- slide -->\nPara two\n',
      'Para one\nPara two\n',
    ],
    [
      'with a blank line after it',
      'Para one\n<!-- slide -->\n\nPara two\n',
      'Para one\n\nPara two\n',
    ],
    [
      'written over several lines',
      'Para one\n<!-- slide\nid=x\n-->\nPara two\n',
      'Para one\nPara two\n',
    ],
    [
      'written over several lines, with a blank line after it',
      'Para one\n<!-- slide\nid=x\n-->\n\nPara two\n',
      'Para one\n\nPara two\n',
    ],
    [
      'in a block quote',
      '> Para one\n> <!-- slide -->\n> Para two\n',
      '> Para one\n> Para two\n',
    ],
    [
      'in a block quote of two levels',
      '>> Para one\n>> <!-- slide -->\n>> Para two\n',
      '>> Para one\n>> Para two\n',
    ],
    // The line the comment ends on keeps what follows the comment on it.
    [
      'with text after it on its line',
      'Para one\n<!-- slide --> trailing\nPara two\n',
      'Para one\n trailing\nPara two\n',
    ],
    ['at the start of the note', '<!-- slide -->\n# First\n', '# First\n'],
    ['at the end of the note', '# First\n\n<!-- slide -->', '# First\n\n'],
    [
      'at the end of the note, after a line break',
      '# First\n\n<!-- slide -->\n',
      '# First\n\n',
    ],
    [
      'two, one after the other',
      'Para one\n<!-- slide -->\n<!-- slide vertical=true -->\nPara two\n',
      'Para one\nPara two\n',
    ],
    [
      'written as `.slide`',
      'Para one\n<!-- .slide -->\nPara two\n',
      'Para one\nPara two\n',
    ],
    [
      'between a heading and its text',
      '# First\n<!-- slide -->\nText.\n',
      '# First\nText.\n',
    ],
  ])(
    '%s: the note reads as if the comment was not written',
    async (_label, note, without) => {
      const { outputString } = await transformed(note, true);
      const { outputString: baseline } = await transformed(without, true);
      expect(outputString).toBe(baseline);
    },
  );

  test('the comment is still the marker of a slide where it is not left out', async () => {
    const { outputString, slideConfigs } = await transformed(
      '<!-- slide class="x" -->\n# First\n',
      false,
    );
    expect(outputString).toContain('<p><span>[CROSSNOTESLIDE:0]</span></p>');
    expect(slideConfigs).toHaveLength(1);
  });

  test('a slide left out is no slide', async () => {
    const { outputString, slideConfigs } = await transformed(
      '<!-- slide class="x" -->\n# First\n',
      true,
    );
    expect(outputString).toBe('# First {#first }\n');
    expect(slideConfigs).toEqual([]);
  });
});
