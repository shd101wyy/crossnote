import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { load } from 'cheerio';
import { transformMarkdown } from '../src/markdown-engine/transformer';
import { Notebook } from '../src/notebook/index';

/**
 * An `@import` or a lone `![](...)` indented by four spaces or a tab is a
 * CommonMark code block. The transformer used to rewrite those lines to
 * `![@embedding](...)` before markdown-it saw them, so the preview showed
 * the internal form rather than the source (crossnote#594).
 */
describe('indented code block @import / image (crossnote#594)', () => {
  let tmp: string;
  let nb: Notebook;

  const issueRepro = `# Title

    @import "part.md"

Paragraph.

    ![](x.txt)
`;

  beforeAll(async () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'indented-code-import-'));
    fs.writeFileSync(path.join(tmp, 'part.md'), 'Imported part body.\n');
    fs.writeFileSync(path.join(tmp, 'x.md'), 'Imported image markdown body.\n');
    fs.writeFileSync(path.join(tmp, 'x.txt'), 'plain file body\n');
    nb = await Notebook.init({
      notebookPath: tmp,
      config: { markdownParser: 'markdown-it' },
    });
  });

  afterAll(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  async function transform(
    markdown: string,
    notebook: Notebook = nb,
  ): Promise<string> {
    const { outputString } = await transformMarkdown(markdown, {
      notebook,
      markdownParser: notebook.config.markdownParser,
      forPreview: true,
      fileDirectoryPath: tmp,
      projectDirectoryPath: tmp,
      filesCache: {},
      useRelativeFilePath: false,
      protocolsWhiteListRegExp: /^(https?)/,
      forJest: true,
      timestamp: 12345,
    });
    return outputString;
  }

  async function render(
    markdown: string,
    notebook: Notebook = nb,
  ): Promise<string> {
    fs.writeFileSync(path.join(tmp, 'a.md'), markdown);
    const engine = notebook.getNoteMarkdownEngine(path.join(tmp, 'a.md'));
    const { html } = await engine.parseMD(markdown, {
      useRelativeFilePath: false,
      isForPreview: true,
      hideFrontMatter: false,
      fileDirectoryPath: tmp,
    });
    return html;
  }

  describe('transformMarkdown', () => {
    test('issue repro: four-space @import and image stay as typed', async () => {
      const output = await transform(issueRepro);
      expect(output).toContain('    @import "part.md"');
      expect(output).toContain('    ![](x.txt)');
      expect(output).not.toContain('@embedding');
    });

    test('a tab-indented @import stays as typed', async () => {
      const output = await transform('\t@import "part.md"\n');
      expect(output).toContain('\t@import "part.md"');
      expect(output).not.toContain('@embedding');
    });

    test('a tab-indented image stays as typed', async () => {
      const output = await transform('\t![](x.txt)\n');
      expect(output).toContain('\t![](x.txt)');
      expect(output).not.toContain('@embedding');
    });

    test.each([
      ['1 space', ' '],
      ['2 spaces', '  '],
      ['3 spaces', '   '],
    ])('%s before @import is still an import', async (_label, pad) => {
      const output = await transform(`${pad}@import "part.md"\n`);
      expect(output).toContain('@embedding');
      expect(output).not.toMatch(new RegExp(`^${pad}@import "part\\.md"`, 'm'));
    });

    test.each([
      ['1 space', ' '],
      ['2 spaces', '  '],
      ['3 spaces', '   '],
    ])('%s before a lone image is still an import', async (_label, pad) => {
      const output = await transform(`${pad}![](x.txt)\n`);
      expect(output).toContain('@embedding');
      expect(output).not.toContain(`${pad}![](x.txt)`);
    });

    test('an unindented @import is still rewritten', async () => {
      const output = await transform('@import "part.md"\n');
      expect(output).toContain('@embedding');
      expect(output).not.toMatch(/^@import "part\.md"/m);
    });

    test('pandoc still inlines a four-space indented @import', async () => {
      const pandocNb = await Notebook.init({
        notebookPath: tmp,
        config: { markdownParser: 'pandoc' },
      });
      const output = await transform('    @import "part.md"\n', pandocNb);
      expect(output).toContain('Imported part body');
    });

    test('eight-space @import in a nested list stays as typed', async () => {
      const output = await transform(
        '- outer\n  - inner\n\n        @import "part.md"\n',
      );
      expect(output).toContain('        @import "part.md"');
      expect(output).not.toContain('@embedding');
    });

    test('a tab plus spaces before @import stays as typed', async () => {
      const output = await transform('\t @import "part.md"\n');
      expect(output).toContain('\t @import "part.md"');
      expect(output).not.toContain('@embedding');
    });

    test('four spaces then > before @import stays as typed', async () => {
      const output = await transform('    > @import "part.md"\n');
      expect(output).toContain('    > @import "part.md"');
      expect(output).not.toContain('@embedding');
    });

    test('an import after a code block is still rewritten; an image inside it is not', async () => {
      const output = await transform(
        'para\n\n    code\n@import "part.md"\n\n    ![](x.txt)\n',
      );
      expect(output).toContain('@embedding');
      expect(output).not.toMatch(/^@import "part\.md"/m);
      expect(output).toContain('    ![](x.txt)');
    });

    test('a slide comment then an indented @import is still rewritten', async () => {
      const output = await transform('<!-- slide -->\n    @import "part.md"\n');
      expect(output).toContain('@embedding');
      expect(output).not.toContain('    @import "part.md"');
    });

    test('a leftover CR still rewrites a real @import', async () => {
      const output = await transform(
        'a\rb\n\n    x\n    y\n@import "part.md"\n\n    @import "x.md"\n',
      );
      expect(output).toContain('@embedding');
      expect(output).not.toMatch(/^@import "part\.md"/m);
    });
  });

  describe('preview HTML', () => {
    test('issue repro: code blocks show the source lines', async () => {
      const html = await render(issueRepro);
      const $ = load(html);
      // code-block-styling unwraps indented <pre><code> to <pre> text
      const code = $('pre')
        .map((_, el) => $(el).text())
        .get()
        .join('\n');
      expect(code).toContain('@import "part.md"');
      expect(code).toContain('![](x.txt)');
      expect(html).not.toContain('@embedding');
      expect(html).not.toContain('Imported part body');
    });

    test.each([
      ['1 space', ' '],
      ['2 spaces', '  '],
      ['3 spaces', '   '],
      ['no indent', ''],
    ])('%s before @import still includes the file', async (_label, pad) => {
      const html = await render(`${pad}@import "part.md"\n`);
      expect(html).toContain('Imported part body');
      expect(html).not.toContain('@embedding');
    });

    test('eight-space @import in a nested list stays a code block', async () => {
      const html = await render(
        '- outer\n  - inner\n\n        @import "part.md"\n',
      );
      const $ = load(html);
      const code = $('pre')
        .map((_, el) => $(el).text())
        .get()
        .join('\n');
      expect(code).toContain('@import "part.md"');
      expect(html).not.toContain('@embedding');
      expect(html).not.toContain('Imported part body');
    });

    test('a tab plus spaces before @import stays a code block', async () => {
      const html = await render('\t @import "part.md"\n');
      const $ = load(html);
      const code = $('pre')
        .map((_, el) => $(el).text())
        .get()
        .join('\n');
      expect(code).toContain('@import "part.md"');
      expect(html).not.toContain('@embedding');
      expect(html).not.toContain('Imported part body');
    });

    test('four spaces then > before @import stays a code block', async () => {
      const html = await render('    > @import "part.md"\n');
      const $ = load(html);
      const code = $('pre')
        .map((_, el) => $(el).text())
        .get()
        .join('\n');
      expect(code).toContain('@import "part.md"');
      expect(html).not.toContain('@embedding');
      expect(html).not.toContain('Imported part body');
    });

    test('an import after a code block is still an import; an image inside it is code', async () => {
      const html = await render(
        'para\n\n    code\n@import "part.md"\n\n    ![](x.txt)\n',
      );
      expect(html).toContain('Imported part body');
      expect(html).not.toContain('@import');
      const $ = load(html);
      const code = $('pre')
        .map((_, el) => $(el).text())
        .get()
        .join('\n');
      expect(code).toContain('![](x.txt)');
      expect(html).not.toContain('plain file body');
      expect(html).not.toMatch(/<img[^>]*x\.txt/);
    });

    test('a slide comment then an indented @import still embeds the file', async () => {
      const html = await render('<!-- slide -->\n    @import "part.md"\n');
      expect(html).toContain('Imported part body');
      expect(html).not.toContain('@import');
    });

    test('a slide comment then an indented image imports the file as a code block', async () => {
      const html = await render('<!-- slide -->\n    ![](x.txt)\n');
      expect(html).toContain('plain file body');
      expect(html).not.toMatch(/<img[^>]*x\.txt/);
    });

    test('a leftover CR does not leave a real @import as text', async () => {
      const html = await render(
        'a\rb\n\n    x\n    y\n@import "part.md"\n\n    @import "x.md"\n',
      );
      expect(html).toContain('Imported part body');
      expect(html).not.toContain('@import "part.md"');
    });

    test.each([
      [
        'bullet list, blank line, four-space @import',
        '- item\n\n    @import "part.md"\n',
        'Imported part body',
      ],
      [
        'ordered list, blank line, four-space @import',
        '1. Step one\n\n    @import "part.md"\n\n2. Step two\n',
        'Imported part body',
      ],
      [
        'bullet list, no blank line, four-space @import',
        '- item\n    @import "part.md"\n',
        'Imported part body',
      ],
      [
        'blockquote lazy continuation @import',
        '> quote\n>     @import "part.md"\n',
        'Imported part body',
      ],
      [
        'bullet list, blank line, four-space image',
        '- item\n\n    ![](x.md)\n',
        'Imported image markdown body',
      ],
    ])('%s still includes the file', async (_label, markdown, body) => {
      const html = await render(markdown);
      expect(html).toContain(body);
      expect(html).not.toContain('@import');
    });
  });

  /**
   * The indented-import gate and the code-line lookup run on every
   * render. A `\s` in the gate is quadratic on whitespace-only lines
   * (crossnote#594); scanning every range on every line is
   * O(lines × code blocks). Both must stay linear: well under a
   * second on the shapes that used to take seconds, same spirit as
   * the 80k line-break scan in test/page-markers.test.ts (#620).
   */
  describe('transformMarkdown performance', () => {
    const SCAN_BOUND_MS = 1000;

    async function timedTransform(markdown: string): Promise<number> {
      const started = process.hrtime.bigint();
      await transform(markdown);
      return Number(process.hrtime.bigint() - started) / 1e6;
    }

    test('a page of many line breaks is transformed quickly', async () => {
      const ms = await timedTransform('\n'.repeat(80_000));
      expect(ms).toBeLessThan(SCAN_BOUND_MS);
    }, 20_000);

    test('a page of many indented blank lines is transformed quickly', async () => {
      const ms = await timedTransform('    \n'.repeat(40_000));
      expect(ms).toBeLessThan(SCAN_BOUND_MS);
    }, 20_000);

    test('many indented code blocks then an image opener stay linear', async () => {
      const ms = await timedTransform(
        '    x\n# h\n'.repeat(10_000) + '    ![\n',
      );
      expect(ms).toBeLessThan(SCAN_BOUND_MS);
    }, 20_000);
  });
});
