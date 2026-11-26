import * as fs from 'fs';
import * as path from 'path';
import { mkdirSync, track } from '../src/lib/temp';
import { MarkdownEngine } from '../src/markdown-engine';
import { Notebook } from '../src/notebook';
import { NotebookConfig, WebviewConfig } from '../src/notebook/types';
import {
  getCrossnoteBuildDirectory,
  setCrossnoteBuildDirectory,
} from '../src/utility';

/**
 * MathJax typesets the staged page before the diagrams are drawn, and the
 * source of a mermaid or pele diagram is text in that page: what stands
 * between two `$` of it would be taken for a formula (#599). The engine tells
 * MathJax to leave those elements alone, in the preview and in the export.
 */

jest.mock('less', () => ({
  render: (
    _input: string,
    _options: unknown,
    callback: (error: unknown, output: { css: string } | undefined) => void,
  ) => {
    callback(null, { css: '' });
  },
}));

/** The configuration the page hands to MathJax in its `window.MathJax`. */
function mathJaxConfigIn(html: string): Record<string, unknown> {
  const assignment = 'window.MathJax = (';
  const script = html.slice(html.indexOf(assignment) + assignment.length);
  return JSON.parse(script.slice(0, script.indexOf(');')));
}

describe('the MathJax of a page', () => {
  track();

  const originalBuildDirectory = getCrossnoteBuildDirectory();
  let tmpDir: string;

  beforeAll(() => {
    // The export inlines a few styles from the build directory; they can be
    // empty.
    tmpDir = mkdirSync({ prefix: 'xnote-mathjax-diagrams-' });
    for (const dir of [
      path.join(tmpDir, 'styles', 'prism_theme'),
      path.join(tmpDir, 'dependencies', 'reveal', 'js'),
      path.join(tmpDir, 'dependencies', 'reveal', 'css', 'theme'),
    ]) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(tmpDir, 'styles', 'prism_theme', 'default.css'),
      '/* prism */',
    );
    setCrossnoteBuildDirectory(tmpDir);
  });

  afterAll(() => {
    setCrossnoteBuildDirectory(originalBuildDirectory);
  });

  async function createNotebook(mathjaxConfig: Record<string, unknown> = {}) {
    fs.writeFileSync(path.join(tmpDir, 'note.md'), '# One\n');
    const config: Partial<NotebookConfig> = {
      markdownParser: 'markdown-it',
      markdownYoBinaryPath: '',
      mathRenderingOption: 'MathJax',
    };
    if (Object.keys(mathjaxConfig).length > 0) {
      config.mathjaxConfig = JSON.parse(
        JSON.stringify(mathjaxConfig),
      ) as NotebookConfig['mathjaxConfig'];
    }
    const notebook = await Notebook.init({
      notebookPath: tmpDir,
      config,
    });
    const engine = new MarkdownEngine({
      notebook,
      filePath: path.join(tmpDir, 'note.md'),
    });
    return { notebook, engine };
  }

  test('is told to leave the sources of mermaid and pele diagrams alone', async () => {
    const { notebook, engine } = await createNotebook();
    const preview = await engine.generateHTMLTemplateForPreview({
      inputString: '# One\n',
      config: notebook.config as WebviewConfig,
      vscodePreviewPanel: null,
    });
    const exported = await engine.htmlExportDocument();

    for (const html of [preview, exported]) {
      const mathJaxConfig = mathJaxConfigIn(html);
      // Named where MathJax reads them: in the options of the document.
      expect(mathJaxConfig['options']).toMatchObject({
        ignoreHtmlClass: 'mathjax_ignore|mermaid|pele',
      });
      expect(mathJaxConfig['tex']).not.toHaveProperty('ignoreHtmlClass');
      // The delimiters are the configuration's, as before.
      expect(mathJaxConfig['tex']).toMatchObject({ inlineMath: [['$', '$']] });
    }
  });

  test('keeps the classes the configuration names', async () => {
    const { engine } = await createNotebook({
      options: { ignoreHtmlClass: 'tex2jax_ignore|mine' },
    });
    const html = await engine.htmlExportDocument();

    expect(mathJaxConfigIn(html)['options']).toMatchObject({
      ignoreHtmlClass: 'tex2jax_ignore|mine|mermaid|pele',
    });
  });
});
