import * as fs from 'fs';
import * as path from 'path';
import { mkdirSync, track } from '../src/lib/temp';
import { MarkdownEngine } from '../src/markdown-engine';
import { Notebook } from '../src/notebook';

/**
 * A pandoc export hands `pandoc` a markdown file of its own. A `<!-- slide -->`
 * of the note is a hint for the presentation in the preview and in the HTML
 * export: the transformer writes it as the marker the page is split on, and
 * that marker reached the document, as the text `[CROSSNOTESLIDE:0]`
 * (crossnote#591). A document pandoc writes has no slides, so the markers
 * are taken out of what it is given.
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

describe('the pandoc export of a note with slide markers (#591)', () => {
  track();

  test('a slide marker is not written into the document', async () => {
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
      /\n# First \{#first ?\}\n+Text one\.\n+# Second \{#second ?\}\n+Text two\./,
    );
  });

  test('what comes after a marker is where it was, without a blank line glued on', async () => {
    const given = await exported(`Para one
<!-- slide -->
Para two
`);

    expect(given).not.toContain('CROSSNOTESLIDE');
    // As if the line of the marker was not there: one paragraph.
    expect(given).toMatch(/Para one\nPara two/);
  });

  test('a marker written as text is left alone', async () => {
    const written = '<span>[CROSSNOTESLIDE:0]</span>';
    const given = await exported(`# Title\n\n${written}\n\n# First\n`);

    expect(given).toContain(written);
  });
});
