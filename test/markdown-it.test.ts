import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Notebook } from '../src/notebook/index';

/**
 * What markdown-it 15 renders differently from 14.3.3 apart from links, each as
 * the CommonMark specification or Pandoc has it (markdown-it's changelog:
 * 15.0.0 #1142, 15.0.1 #1201, #1180 and #1204; and `markdown-it-deflist` 4.0.0).
 * `test/linkify.test.ts` has the links.
 */
describe('what markdown-it 15 changed', () => {
  let tmp: string;
  let notebook: Notebook;

  const render = (markdown: string): string =>
    notebook.md.render(markdown).trim();

  beforeAll(async () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'markdown-it-'));
    notebook = await Notebook.init({
      notebookPath: tmp,
      config: { markdownParser: 'markdown-it' },
    });
  });

  afterAll(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  test('a definition list is loose only around its blank lines', () => {
    // a blank line between a term and its definition makes a paragraph of it,
    expect(render('term\n\n:   definition')).toBe(
      '<dl data-source-line="1">\n<dt data-source-line="1">term</dt>\n<dd data-source-line="3">\n<p data-source-line="3">definition</p>\n</dd>\n</dl>',
    );
    // and one between two definitions does not: 14.3.3 had it the other way round
    expect(render('term\n:   a\n\n:   b')).toBe(
      '<dl data-source-line="1">\n<dt data-source-line="1">term</dt>\n<dd data-source-line="2">a</dd>\n<dd data-source-line="4">b</dd>\n</dl>',
    );
  });

  test('the text an image is shown by is the plain text of its description', () => {
    // 14.3.3 left the entity, the code and the escaped characters out of it
    expect(
      render('![foo &amp; bar](x) and ![a `code` b](y) and ![a \\*b\\* c](z)'),
    ).toBe(
      '<p data-source-line="1"><img src="x" alt="foo &amp; bar"> and <img src="y" alt="a code b"> and <img src="z" alt="a *b* c"></p>',
    );
  });

  test('the address of a link to an IPv6 host keeps its brackets', () => {
    // 14.3.3 wrote %5B and %5D for them, which is no address of a host
    expect(render('[t](http://[::1]:8080/x)')).toBe(
      '<p data-source-line="1"><a href="http://[::1]:8080/x">t</a></p>',
    );
  });

  test('a code span of spaces only keeps its spaces', () => {
    expect(render('a `   ` b')).toBe(
      '<p data-source-line="1">a <code>   </code> b</p>',
    );
  });

  test('a code span is made after a bracket, a tilde or a caret that closes nothing, and in the text of a link', () => {
    // when another backtick follows: 14.3.3 printed all the backticks
    expect(render('[`a`b`')).toBe(
      '<p data-source-line="1">[<code>a</code>b`</p>',
    );
    expect(render('[`a`b`](x)')).toBe(
      '<p data-source-line="1"><a href="x"><code>a</code>b`</a></p>',
    );
    // after a tilde or a caret of a subscript or a superscript that is never closed
    expect(render('~`a`b`')).toBe(
      '<p data-source-line="1">~<code>a</code>b`</p>',
    );
    expect(render('^`a`b`')).toBe(
      '<p data-source-line="1">^<code>a</code>b`</p>',
    );
  });
});
