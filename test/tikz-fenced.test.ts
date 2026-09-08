import * as path from 'path';
import * as cheerio from 'cheerio';
import { Notebook } from '../src/notebook/index';

describe('TikZ fenced diagram integration', () => {
  // Same as test/tikz.test.ts: the cold WASM TeX compile inside parseMD
  // exceeds Jest's 5s default on the Node 18 CI runtime.
  const TIKZ_TIMEOUT = 30_000;

  let notebook: Notebook;

  beforeAll(async () => {
    notebook = await Notebook.init({
      notebookPath: path.resolve(__dirname, './markdown/test-files'),
      config: {
        markdownParser: 'markdown-it',
      },
    });
  });

  it(
    'renders tikz code block as SVG',
    async () => {
      const markdown = [
        '```tikz',
        '\\begin{tikzpicture}',
        '\\draw (0,0) -- (1,1);',
        '\\end{tikzpicture}',
        '```',
      ].join('\n');

      const engine = notebook.getNoteMarkdownEngine(
        path.resolve(__dirname, './markdown/test-files/test-tikz.md'),
      );
      const { html } = await engine.parseMD(markdown, {
        useRelativeFilePath: false,
        isForPreview: true,
        hideFrontMatter: false,
      });

      const $ = cheerio.load(html);
      const svg = $('svg');
      expect(svg.length).toBe(1);
      expect(svg.attr('xmlns')).toBe('http://www.w3.org/2000/svg');
    },
    TIKZ_TIMEOUT,
  );

  it(
    'renders tikz and sanitizes output',
    async () => {
      const markdown = [
        '```tikz',
        '\\begin{tikzpicture}',
        '\\draw[->] (0,0) -- (2,1);',
        '\\end{tikzpicture}',
        '```',
      ].join('\n');

      const engine = notebook.getNoteMarkdownEngine(
        path.resolve(__dirname, './markdown/test-files/test-tikz.md'),
      );
      const { html } = await engine.parseMD(markdown, {
        useRelativeFilePath: false,
        isForPreview: true,
        hideFrontMatter: false,
      });

      // Should contain rendered SVG, not raw script tags
      expect(html).toContain('<svg');
      expect(html).not.toContain('<script>alert');
    },
    TIKZ_TIMEOUT,
  );
});
