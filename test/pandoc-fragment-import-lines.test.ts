import * as fs from 'fs';
import * as path from 'path';
import { mkdirSync, track } from '../src/lib/temp';
import { transformMarkdown } from '../src/markdown-engine/transformer';
import { Notebook } from '../src/notebook';

/**
 * A section of a file is imported by the lines of its headings, and a block
 * by the lines of its paragraph. Those are lines of the file; the lines are
 * taken from what the transformer made of it, and the two count alike while
 * every line of the file is one line of the output. Under the pandoc parser
 * an import is written out as what it imports, over as many lines as that
 * takes, and the lines after it lie lower in the output than their numbers
 * say (crossnote#593). With markdown-it every import is one line, and
 * nothing of this applies.
 */

/** The section `# Part A` to the end of the file, as the transformer writes it. */
const SECTION = ['', '# Part A {#part-a }', '', '## A.2 {#a2 }', '  ', ''];

/** The paragraph of a block, as the transformer writes it. */
const BLOCK = ['', 'second <span id="id" class="block-id"></span>  ', ''];

/** Each kind of import that takes several lines, as it is written. */
const IMPORTS = [
  ['a markdown file', '@import "other.md"'],
  ['an html file', '@import "x.html"'],
  ['a csv file', '@import "x.csv"'],
  ['a code file as a fenced block', '@import "x.js" {code_block=true}'],
] as const;

track();

describe('a fragment of a file that has an import over several lines above it', () => {
  let tmp: string;
  let nb: Notebook;

  beforeAll(async () => {
    tmp = mkdirSync({ prefix: 'xnote-pandoc-fragment-lines-' });
    const files: Record<string, string> = {
      'other.md': '<!-- slide -->\n\nA\n\nB\n\nC\n',
      'x.html': '<div>\n<p>html one</p>\n<p>html two</p>\n</div>',
      'x.csv': 'a,b\n1,2\n3,4\n',
      'x.js': 'let a = 1;\nlet b = 2;\n',
      // The section with a slide inside it, and the section after it.
      'part.md': [
        '@import "other.md"',
        '',
        '# Part A',
        '',
        '## A.2',
        '',
        '<!-- slide vertical=true -->',
        '',
        '### A.3',
        '',
        '# Part B',
        '',
      ].join('\n'),
      'with-front-matter.md':
        '---\ntitle: x\n---\n@import "x.html"\n\n# Part A\n\n## A.2\n',
      'import-inside.md':
        '# Part A\n\n@import "x.html"\n\n## A.2\n\n# Part B\n',
      'mid.md': '@import "part.md#Part A"\n\n# Part M\n\n## M.2\n',
    };
    IMPORTS.forEach(([, line], i) => {
      files[`above-${i}.md`] = `${line}\n\n# Part A\n\n## A.2\n`;
      files[`block-${i}.md`] = `${line}\n\nfirst\n\nsecond ^id\n\nthird\n`;
    });
    for (const [name, content] of Object.entries(files)) {
      fs.writeFileSync(path.join(tmp, name), content);
    }
    nb = await Notebook.init({
      notebookPath: tmp,
      config: { markdownParser: 'pandoc' },
    });
  });

  /** Transform a note written in the folder of the files above. */
  async function imported(
    markdown: string,
    markdownParser: 'markdown-it' | 'pandoc' = 'pandoc',
  ) {
    return transformMarkdown(markdown, {
      notebook: nb,
      markdownParser,
      forPreview: false,
      fileDirectoryPath: tmp,
      projectDirectoryPath: tmp,
      filesCache: {},
      useRelativeFilePath: false,
      protocolsWhiteListRegExp: /^(https?)/,
      forJest: true,
      timestamp: 12345,
    });
  }

  describe.each(IMPORTS.map(([kind], i) => [kind, i] as const))(
    'after an import of %s',
    (_kind, i) => {
      test('the section is cut from the lines of the output', async () => {
        // Every line of the section, and nothing of what stands before it.
        const { outputString, headings } = await imported(
          `@import "above-${i}.md#Part A"`,
        );
        expect(outputString.split('\n')).toEqual(SECTION);
        expect(headings.map((heading) => heading.content)).toEqual([
          'Part A',
          'A.2',
        ]);
      });

      test('the block is cut from the lines of the output too', async () => {
        const { outputString } = await imported(`@import "block-${i}.md#^id"`);
        expect(outputString.split('\n')).toEqual(BLOCK);
      });
    },
  );

  test('the import syntaxes give the same section', async () => {
    const expected = (await imported('@import "part.md#Part A"')).outputString;
    for (const note of ['![[part.md#Part A]]', '![alt](part.md#Part A)']) {
      expect((await imported(note)).outputString).toBe(expected);
    }
  });

  test('the slide inside the section is kept, with what it configures', async () => {
    const { outputString, headings, slideConfigs } = await imported(
      '@import "part.md#Part A"',
    );
    expect(outputString.split('\n')).toEqual([
      '',
      '# Part A {#part-a }',
      '',
      '## A.2 {#a2 }',
      '',
      '<p><span>[CROSSNOTESLIDE:1]</span></p>  ',
      '',
      '### A.3 {#a3 }',
      '  ',
      '',
    ]);
    expect(headings.map((heading) => heading.content)).toEqual([
      'Part A',
      'A.2',
      'A.3',
    ]);
    expect(slideConfigs.map((slide) => slide.vertical)).toEqual([true]);
  });

  test('the front matter of the file is counted as its lines', async () => {
    const { outputString, headings } = await imported(
      '@import "with-front-matter.md#Part A"',
    );
    expect(outputString.split('\n')).toEqual(SECTION);
    // Lines of the file: the headings keep them.
    expect(headings.map((heading) => heading.lineNo)).toEqual([6, 8]);
  });

  test('an import inside the section is part of the section', async () => {
    const { outputString, headings } = await imported(
      '@import "import-inside.md#Part A"',
    );
    expect(outputString.split('\n')).toEqual([
      '',
      '# Part A {#part-a }',
      '',
      '<div><div>',
      '<p>html one</p>',
      '<p>html two</p>',
      '</div></div>  ',
      '',
      '## A.2 {#a2 }',
      '  ',
      '',
    ]);
    expect(headings.map((heading) => heading.content)).toEqual([
      'Part A',
      'A.2',
    ]);
  });

  test('a block that holds an import takes the lines of the import', async () => {
    fs.writeFileSync(
      path.join(tmp, 'block-with-import.md'),
      '@import "x.csv"\nsecond ^id\n\nthird\n',
    );
    const { outputString } = await imported(
      '@import "block-with-import.md#^id"',
    );
    // The paragraph is the import and the line after it.
    expect(outputString.split('\n')).toEqual([
      '',
      '  ',
      '|a|b|  ',
      '|---|---|  ',
      '|1|2|  ',
      '|3|4|  ',
      '  ',
      'second <span id="id" class="block-id"></span>  ',
      '',
    ]);
  });

  test('a fragment of a file that imports a fragment is cut from the lines of its own output', async () => {
    const { outputString, headings } = await imported(
      '@import "mid.md#Part M"',
    );
    expect(outputString.split('\n')).toEqual([
      '',
      '# Part M {#part-m }',
      '',
      '## M.2 {#m2 }',
      '  ',
      '',
    ]);
    expect(headings.map((heading) => heading.content)).toEqual([
      'Part M',
      'M.2',
    ]);
  });

  test('with markdown-it nothing changes: every import is one line', async () => {
    const { outputString, headings } = await imported(
      '@import "above-1.md#Part A"',
      'markdown-it',
    );
    // The section is carried in an embedding of its own line.
    const embedding = outputString.match(/\{embedding="([^"]+)"\}/);
    expect(embedding).not.toBeNull();
    expect(
      decodeURIComponent(
        Buffer.from(embedding![1], 'base64').toString('latin1'),
      ),
    ).toBe(SECTION.join('\n').replace(/\n$/, ''));
    expect(headings.map((heading) => heading.content)).toEqual([
      'Part A',
      'A.2',
    ]);
  });
});
