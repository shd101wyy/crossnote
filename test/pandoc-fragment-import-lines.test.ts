import * as fs from 'fs';
import * as path from 'path';
import { mkdirSync, track } from '../src/lib/temp';
import {
  transformMarkdown,
  TransformMarkdownOptions,
} from '../src/markdown-engine/transformer';
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
      // No blank line between the import and the heading after it.
      'import-then-heading.md':
        '@import "x.html"\n# Part A\n\ntext\n\n# Part B\n\nafter\n',
      'import-then-end-heading.md':
        '# Part A\n\ntext\n@import "x.html"\n# Part B\n\nafter\n',
      'div-above.md':
        '::: note\n\ntext\n\n:::\n\n# Part A\n\ntext\n\n# Part B\n',
      'div-inside.md':
        '# Part A\n\n::: note\n\ntext\n\n:::\nlast line\n# Part B\n',
      'slide-above.md':
        '<!-- slide\nvertical=true -->\n\n# Part A\n\ntext\n\n# Part B\n',
      'x.ts': 'const a = 1;\nconst b = 2;\n',
      // A div, then the section, which ends with an import right above the
      // heading after it.
      'div-then-import-at-end.md':
        '::: note\n\n# Part A\n\ntext A\n\n@import "x.ts"\n# Part B\n',
      // A div, an import right above the first heading of the section.
      'div-then-import-at-start.md':
        '::: note\n\n# Part Zero\n\n@import "x.ts"\n# Part A\n\ntext A\n\n# Part B\n',
      'block-is-import.md': '@import "x.csv" ^id\n\nthird\n',
      'block-ends-import.md': 'first ^id\n@import "x.csv"\n\nthird\n',
      // The ^id stands on a line the transformer does not rewrite.
      'block-with-fence.md':
        '@import "x.csv"\n```\nfirst\nsecond ^id\n```\n\nthird\n',
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

  /**
   * The token of the rendering, as every transform of this file is handed
   * one: the marker of a slide carries it, so outputs are compared without
   * it getting in the way.
   */
  const TOKEN = '0123456789abcdef0123456789abcdef';

  /** Transform a note written in the folder of the files above. */
  async function imported(
    markdown: string,
    markdownParser: 'markdown-it' | 'pandoc' = 'pandoc',
    options: Partial<TransformMarkdownOptions> = {},
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
      slideMarkerToken: TOKEN,
      ...options,
    });
  }

  /** The lines of an output, without the spaces a line ends with. */
  function linesOf(outputString: string): string[] {
    return outputString.split('\n').map((line) => line.trimEnd());
  }

  function withoutTrailingEmptyLines(lines: string[]): string[] {
    const rest = [...lines];
    while (rest.length && rest[rest.length - 1] === '') {
      rest.pop();
    }
    return rest;
  }

  /** The text an embedding carries, or the output itself when it is none. */
  function contentOf(outputString: string): string {
    const embedding = /\{embedding="([^"]+)"\}/.exec(outputString);
    return embedding
      ? decodeURIComponent(
          Buffer.from(embedding[1], 'base64').toString('latin1'),
        )
      : outputString;
  }

  /**
   * What an import of a fragment brought, line by line: not the empty first
   * line the import starts with, the spaces a line ends with, nor the empty
   * lines at the end.
   */
  function brought(outputString: string): string[] {
    return withoutTrailingEmptyLines(linesOf(contentOf(outputString)).slice(1));
  }

  /**
   * The lines that stand between two headings when the file is imported
   * whole under the pandoc parser: what a section of it is.
   */
  async function sectionOfWholeFile(
    file: string,
    start: string,
    end: string,
  ): Promise<string[]> {
    const whole = linesOf((await imported(`@import "${file}"`)).outputString);
    return withoutTrailingEmptyLines(
      whole.slice(whole.indexOf(start), whole.indexOf(end)),
    );
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
      `<p><span>[CROSSNOTESLIDE:${TOKEN}:1]</span></p>  `,
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

  test.each([
    [
      'on the line right above the first heading of the section',
      'import-then-heading.md',
    ],
    [
      'on the line right above the heading that ends the section',
      'import-then-end-heading.md',
    ],
  ])('an import %s is counted where it stands', async (_where, file) => {
    const { outputString } = await imported(`@import "${file}#Part A"`);
    expect(brought(outputString)).toEqual(
      await sectionOfWholeFile(
        file,
        '# Part A {#part-a }',
        '# Part B {#part-b }',
      ),
    );
  });

  test.each([
    ['above the section', 'div-above.md'],
    ['inside the section', 'div-inside.md'],
  ])(
    'a `:::` div opened %s takes the two lines it is written on',
    async (_where, file) => {
      // Under the pandoc parser the opening marker is a `<div>` and a blank
      // line: one line of the file over two of the output.
      const { outputString } = await imported(`@import "${file}#Part A"`);
      expect(brought(outputString)).toEqual(
        await sectionOfWholeFile(
          file,
          '# Part A {#part-a }',
          '# Part B {#part-b }',
        ),
      );
    },
  );

  test.each([
    [
      'that ends with an import right above its last heading',
      'div-then-import-at-end.md',
      [
        '# Part A {#part-a }',
        '',
        'text A',
        '',
        '```ts',
        'const a = 1;',
        'const b = 2;',
        '',
        '```',
      ],
    ],
    [
      'that begins right below an import, past a div',
      'div-then-import-at-start.md',
      ['# Part A {#part-a }', '', 'text A'],
    ],
  ])(
    'after a `:::` div, a section %s is whole: no fence is cut',
    async (_where, file, expected) => {
      // A cut one line off lands inside what the import wrote: a fence
      // without its end, or a stray end, takes the rest of the note with it.
      const { outputString } = await imported(`@import "${file}#Part A"`);
      expect(brought(outputString)).toEqual(expected);
    },
  );

  test.each([['pandoc'], ['markdown-it']] as const)(
    'a slide comment of several lines that a markdown export keeps is counted as its lines (%s)',
    async (markdownParser) => {
      // The comment is written as it is, over two lines; the heading after
      // it keeps its own.
      const { outputString } = await imported(
        '@import "slide-above.md#Part A"',
        markdownParser,
        { forMarkdownExport: true },
      );
      expect(brought(outputString)).toEqual(['# Part A', '', 'text']);
    },
  );

  test('a block whose line is an import takes the lines of the import', async () => {
    const { outputString } = await imported('@import "block-is-import.md#^id"');
    expect(brought(outputString)).toEqual([
      '',
      '|a|b|',
      '|---|---|',
      '|1|2|',
      '|3|4|',
    ]);
  });

  test('a block that ends with an import takes the lines of the import', async () => {
    const { outputString } = await imported(
      '@import "block-ends-import.md#^id"',
    );
    expect(brought(outputString)).toEqual([
      'first <span id="id" class="block-id"></span>',
      '',
      '|a|b|',
      '|---|---|',
      '|1|2|',
      '|3|4|',
    ]);
  });

  test('the marker of a block is taken off the line it stands on, past an import', async () => {
    // The `^id` is on a line of a code fence, which the transformer leaves
    // as it is; the import before it, in the same paragraph, added lines.
    const { outputString } = await imported(
      '@import "block-with-fence.md#^id"',
    );
    expect(brought(outputString)).toEqual([
      '',
      '|a|b|',
      '|---|---|',
      '|1|2|',
      '|3|4|',
      '',
      '```',
      'first',
      'second',
      '```',
    ]);
  });

  test('with markdown-it nothing changes: every import is one line', async () => {
    const { outputString, headings } = await imported(
      '@import "above-1.md#Part A"',
      'markdown-it',
    );
    // The section is carried in an embedding of its own line.
    expect(withoutTrailingEmptyLines(linesOf(contentOf(outputString)))).toEqual(
      withoutTrailingEmptyLines(SECTION.map((line) => line.trimEnd())),
    );
    expect(headings.map((heading) => heading.content)).toEqual([
      'Part A',
      'A.2',
    ]);
  });
});
