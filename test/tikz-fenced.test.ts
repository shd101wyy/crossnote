import * as path from 'path';
import * as cheerio from 'cheerio';
import { Notebook } from '../src/notebook/index';

describe('TikZ fenced diagram integration', () => {
  let notebook: Notebook;

  beforeAll(async () => {
    notebook = await Notebook.init({
      notebookPath: path.resolve(__dirname, './markdown/test-files'),
      config: {
        usePandocParser: false,
      },
    });
  });

  it('renders tikz code block as client-side fallback', async () => {
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
    const tikzScript = $('script[type="text/tikz"]');
    // In Jest, node-tikzjax can't load, so the fallback
    // <script type="text/tikz"> should be used.
    expect(tikzScript.length).toBe(1);
    expect(tikzScript.text()).toContain('\\begin{tikzpicture}');
    expect(tikzScript.text()).toContain('\\draw (0,0) -- (1,1);');
  });

  it('preserves tikz script through sanitization', async () => {
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

    // The tikz script should survive sanitization
    expect(html).toContain('type="text/tikz"');
    expect(html).not.toContain('<script>alert');
  });
});
