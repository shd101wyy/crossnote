import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { load } from 'cheerio';
import { mkdirSync, track } from '../src/lib/temp';
import { MarkdownEngine } from '../src/markdown-engine';
import { HeadingData } from '../src/markdown-engine/toc';
import { transformMarkdown } from '../src/markdown-engine/transformer';
import { Notebook } from '../src/notebook';

/**
 * A section of a file imported with a fragment (`@import "file.md#Heading"`,
 * `![[file#Heading]]`, `![alt](file#Heading)`) is cut by the lines of the
 * heading of that name and of the heading that ends it. Both are looked for
 * among the headings of the file itself. The headings of the files it imports
 * are headings of the page too, each where its import stands, which is what
 * the TOC is made of — but they are not headings of the file: their line
 * numbers are lines of their own files, so taking one of them for the heading
 * of the section cut the wrong lines of the file, or none (crossnote#629).
 */

track();

const PARSERS = [['markdown-it'], ['pandoc']] as const;

const hasPandoc = (() => {
  try {
    execFileSync('pandoc', ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
})();

const FILES: Record<string, string> = {
  // The two files of the issue.
  'part.md': `# Part A

## A.2

# Part B

b
`,
  'other.md': `# Part B

x
`,
  'deep.md': `## Deep

d
`,
  // A section of that name of the file's own, below an import of a section
  // with the same name.
  'same-above.md': `# Mid intro

@import "part.md#Part A"

# Part A

## A.2
`,
  // A section that holds an import of a file with a heading of the same
  // level.
  'same-below.md': `# Part A

@import "other.md"

text of Part A
`,
  // A section that holds an import of a file with a deeper heading only,
  // and the section after it.
  'deep-below.md': `# Part A

@import "deep.md"

text of Part A

# Part B

b
`,
  // No heading of that name of its own; the file it imports has one.
  'only-imported.md': `# Intro

@import "part.md"

<!-- slide -->

closing
`,
  // A file that imports a file which imports a file.
  'outer.md': `# Intro

@import "mid.md"

# Part A

## A.2

# Part B

b of outer
`,
  // The same, with the import inside the section.
  'outer-wide.md': `# Part A

@import "mid.md"

## A.2

# Part B

b of outer
`,
  'mid.md': `@import "inner.md"

## Mid own
`,
  // Headings with the names and the levels of those of the files that
  // import it.
  'inner.md': `# Part A

### Inner

# Part B

b of inner
`,
};

/** The text an embedding carries. */
function carried(embedding: string): string {
  return decodeURIComponent(
    Buffer.from(embedding, 'base64').toString('latin1'),
  );
}

/**
 * The output with every embedding replaced by what it carries. Under
 * markdown-it an import is carried as an embedding of one line; under pandoc
 * it is written out where it stands. This is the latter, for both.
 */
function writtenOut(outputString: string): string {
  return outputString.replace(
    /!\[@embedding\]\([^)]*\)\{[^}]*embedding="([^"]+)"[^}]*\}/g,
    (_match: string, embedding: string) => writtenOut(carried(embedding)),
  );
}

/** The lines of an output, without the spaces a line ends with. */
function linesOf(outputString: string): string[] {
  return writtenOut(outputString)
    .split('\n')
    .map((line) => line.trimEnd());
}

function withoutTrailingEmptyLines(lines: string[]): string[] {
  const rest = [...lines];
  while (rest.length && rest[rest.length - 1] === '') {
    rest.pop();
  }
  return rest;
}

/** The lines of an output, without the empty lines it ends with. */
function outputLines(outputString: string): string[] {
  return withoutTrailingEmptyLines(linesOf(outputString));
}

/**
 * What an import of a fragment brought, line by line: not the empty first
 * line the import starts with, nor the empty lines it ends with.
 */
function brought(outputString: string): string[] {
  return outputLines(outputString).slice(1);
}

/**
 * The headings of a list, each as its text, its level and the line it is on
 * in its file.
 */
function outlineOf(headings: HeadingData[]): Array<[string, number, number]> {
  return headings.map((heading) => [
    heading.content,
    heading.level,
    heading.lineNo as number,
  ]);
}

/**
 * The headings of the page, in its order: the tag and the text of each.
 */
function headingsOfPage(html: string): string[] {
  const $ = load(html);
  return $('h1, h2, h3')
    .toArray()
    .map((heading) =>
      'tagName' in heading
        ? `${heading.tagName} ${$(heading).text().trim()}`
        : '',
    );
}

describe.each(PARSERS)(
  'a section imported with a fragment (%s)',
  (markdownParser) => {
    let tmp: string;
    let nb: Notebook;

    beforeAll(async () => {
      tmp = mkdirSync({ prefix: 'xnote-import-fragment-' });
      for (const [name, content] of Object.entries(FILES)) {
        fs.writeFileSync(path.join(tmp, name), content);
      }
      nb = await Notebook.init({
        notebookPath: tmp,
        config: { markdownParser },
      });
    });

    /** Transform a note written in the folder of the files above. */
    async function imported(markdown: string) {
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

    /** Render a note written in the folder of the files above. */
    async function page(markdown: string): Promise<string> {
      const engine = new MarkdownEngine({
        notebook: nb,
        filePath: path.join(tmp, 'note.md'),
      });
      const { html } = await engine.parseMD(markdown, {
        isForPreview: true,
        useRelativeFilePath: false,
        hideFrontMatter: false,
      });
      return html;
    }

    // The transformer needs no pandoc; the page does.
    const pageTest =
      markdownParser === 'pandoc' && !hasPandoc ? test.skip : test;

    // 1. of the issue: the heading of part.md was found first, and its line
    // read as a line of same-above.md.
    test('is the section of that name of the file itself, below an import of a section with the same name', async () => {
      const { outputString, headings } = await imported(
        '@import "same-above.md#Part A"',
      );
      expect(brought(outputString)).toEqual([
        '# Part A {#part-a }',
        '',
        '## A.2 {#a2 }',
      ]);
      // Lines of same-above.md: the fifth and the seventh.
      expect(outlineOf(headings)).toEqual([
        ['Part A', 1, 5],
        ['A.2', 2, 7],
      ]);
    });

    // 2. of the issue: `# Part B` of other.md ended the section, at line 1
    // of other.md.
    test('is not ended by a heading of the same level in a file it imports', async () => {
      const { outputString, headings } = await imported(
        '@import "same-below.md#Part A"',
      );
      expect(brought(outputString)).toEqual([
        '# Part A {#part-a }',
        '',
        // The import of other.md, written out.
        '',
        '# Part B {#part-b }',
        '',
        'x',
        '',
        '',
        'text of Part A',
      ]);
      // The heading of other.md is one of the section, where its import
      // stands; its line is a line of other.md.
      expect(outlineOf(headings)).toEqual([
        ['Part A', 1, 1],
        ['Part B', 1, 1],
      ]);
    });

    test('is still ended by the next heading of the file when a file it imports has a deeper heading only', async () => {
      const { outputString, headings } = await imported(
        '@import "deep-below.md#Part A"',
      );
      expect(brought(outputString)).toEqual([
        '# Part A {#part-a }',
        '',
        // The import of deep.md, written out.
        '',
        '## Deep {#deep }',
        '',
        'd',
        '',
        '',
        'text of Part A',
      ]);
      expect(outlineOf(headings)).toEqual([
        ['Part A', 1, 1],
        ['Deep', 2, 1],
      ]);
    });

    test('is not found when only a file it imports has a heading of that name', async () => {
      const { outputString, headings, slideConfigs } = await imported(
        '# Own\n\n@import "only-imported.md#Part B"\n',
      );
      expect(outputLines(outputString)).toEqual([
        '# Own {#own }',
        '',
        // The import of only-imported.md, written out.
        '',
        '<!-- crossnote: heading "Part B" not found -->',
      ]);
      // No heading and no slide of the file comes along.
      expect(outlineOf(headings)).toEqual([['Own', 1, 1]]);
      expect(slideConfigs).toEqual([]);
    });

    test('is not taken from a file imported by a file it imports', async () => {
      const { outputString, headings } = await imported(
        '@import "outer.md#Part A"',
      );
      expect(brought(outputString)).toEqual([
        '# Part A {#part-a }',
        '',
        '## A.2 {#a2 }',
      ]);
      // Lines of outer.md: the fifth and the seventh.
      expect(outlineOf(headings)).toEqual([
        ['Part A', 1, 5],
        ['A.2', 2, 7],
      ]);
    });

    test('brings the headings of the section: those of the files it imports, and of the files they import', async () => {
      const { headings } = await imported('@import "outer-wide.md#Part A"');
      // Each heading keeps the line it is on in its own file.
      expect(outlineOf(headings)).toEqual([
        ['Part A', 1, 1],
        // inner.md, imported by mid.md, which the section imports.
        ['Part A', 1, 1],
        ['Inner', 3, 3],
        ['Part B', 1, 5],
        // mid.md
        ['Mid own', 2, 3],
        // outer-wide.md again.
        ['A.2', 2, 5],
      ]);
    });

    test('leaves the headings of the files a note imports in the list of the note, for its TOC', async () => {
      const { headings, tocBracketEnabled } = await imported(
        '[TOC]\n\n# Own\n\n@import "part.md"\n\n## Own 2\n',
      );
      expect(tocBracketEnabled).toBe(true);
      expect(outlineOf(headings)).toEqual([
        ['Own', 1, 3],
        ['Part A', 1, 1],
        ['A.2', 2, 3],
        ['Part B', 1, 5],
        ['Own 2', 2, 7],
      ]);
    });

    pageTest(
      'has in the page the headings and the text of the section of the file itself',
      async () => {
        const html = await page('@import "same-above.md#Part A"\n');
        expect(headingsOfPage(html)).toEqual(['h1 Part A', 'h2 A.2']);
        expect(load(html)('body').text()).not.toContain('Mid intro');
      },
    );

    pageTest('has in the page what the files it imports brought', async () => {
      const html = await page('@import "same-below.md#Part A"\n');
      expect(headingsOfPage(html)).toEqual(['h1 Part A', 'h1 Part B']);
      const text = load(html)('body').text();
      expect(text).toContain('x');
      expect(text).toContain('text of Part A');
    });

    pageTest('that is not found brings nothing to the page', async () => {
      const html = await page('@import "only-imported.md#Part B"\n');
      expect(headingsOfPage(html)).toEqual([]);
      expect(load(html)('body').text()).not.toContain('closing');
    });

    pageTest(
      'has in the page the headings of the files the section imports, and of the files they import',
      async () => {
        const html = await page('@import "outer-wide.md#Part A"\n');
        expect(headingsOfPage(html)).toEqual([
          'h1 Part A',
          'h1 Part A',
          'h3 Inner',
          'h1 Part B',
          'h2 Mid own',
          'h2 A.2',
        ]);
      },
    );

    pageTest(
      'lists the headings of the files a note imports in the [TOC] of the page',
      async () => {
        const html = await page(
          '[TOC]\n\n# Own\n\n@import "part.md"\n\n## Own 2\n',
        );
        const $ = load(html);
        expect(
          $('.md-toc a')
            .map((_, link) => $(link).text())
            .get(),
        ).toEqual(['Own', 'Part A', 'A.2', 'Part B', 'Own 2']);
      },
    );
  },
);
