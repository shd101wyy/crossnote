import * as fs from 'fs';
import * as path from 'path';
import { mkdirSync, track } from '../src/lib/temp';
import { MarkdownEngine } from '../src/markdown-engine';
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

/**
 * Render markdown and return the KaTeX TeX sources (the contents of the
 * `<annotation encoding="application/x-tex">` elements).
 */
async function mathContents(input: string): Promise<string[]> {
  const tmpDir = mkdirSync({ prefix: 'xnote-math-quote' });
  fs.writeFileSync(path.join(tmpDir, 'test.md'), '# Test');
  const notebook = await Notebook.init({
    notebookPath: tmpDir,
    config: {
      markdownParser: 'markdown-it',
      markdownYoBinaryPath: '',
    },
  });
  const engine = new MarkdownEngine({
    notebook,
    filePath: path.join(tmpDir, 'test.md'),
  });
  const out = await engine.parseMD(input, {
    isForPreview: true,
    useRelativeFilePath: false,
    hideFrontMatter: false,
    vscodePreviewPanel: null,
  });
  return [
    ...out.html.matchAll(/annotation encoding="application\/x-tex">([^<]*)</g),
  ].map((m) => m[1]);
}

describe('math_block inside container blocks', () => {
  track();

  test('blockquote markers do not leak into display math', async () => {
    // vscode-mpe#2361: `> $$` blocks rendered the quote markers as
    // greater-than signs inside the formula.
    expect(await mathContents('> $$\n> a+b\n> $$\n')).toEqual(['a+b']);
  });

  test('lazy continuation of a blockquote does not leak markers', async () => {
    expect(await mathContents('> $$\na+b\n> $$\n')).toEqual(['a+b']);
  });

  test('callouts with display math keep working', async () => {
    expect(await mathContents('> [!question] Q\n> $$\n> a+b\n> $$\n')).toEqual([
      'a+b',
    ]);
  });

  test('list item indentation does not leak into display math', async () => {
    expect(await mathContents('- $$\n  a+b\n  $$\n')).toEqual(['a+b']);
  });

  test('top-level multi-line math is unchanged', async () => {
    expect(await mathContents('$$\na\n+\nb\n$$\n')).toEqual(['a\n+\nb']);
  });

  test('unclosed $$ inside a blockquote is not swallowed as math', async () => {
    // The closing delimiter has to appear within the same container;
    // a `$$` left unclosed inside a quote renders literally instead of
    // scanning past the quote for a stray closer.
    expect(await mathContents('> $$\nx\n\nafter\n')).toEqual([]);
  });
});
