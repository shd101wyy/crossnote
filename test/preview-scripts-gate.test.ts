import * as fs from 'fs';
import * as path from 'path';
import { mkdirSync, track } from '../src/lib/temp';
import { MarkdownEngine } from '../src/markdown-engine';
import { Notebook } from '../src/notebook';
import { WebviewConfig } from '../src/notebook/types';

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
 * Helper to render the preview template of a standalone note and return
 * the generated HTML.
 */
async function renderPreviewTemplate(
  notebook: Notebook,
  filePath: string,
  inputString: string,
): Promise<string> {
  const engine = new MarkdownEngine({ notebook, filePath });
  const webviewConfig: WebviewConfig = notebook.config as WebviewConfig;
  return engine.generateHTMLTemplateForPreview({
    inputString,
    config: webviewConfig,
    vscodePreviewPanel: null,
  });
}

/**
 * `generateJSAndCssFilesForPreview` is private; cast to access it so the
 * URL handling can be unit-tested without real network fetches.
 */
function callGenerateJSAndCssFilesForPreview(
  engine: MarkdownEngine,
  files: string[],
): string {
  return (
    engine as unknown as {
      generateJSAndCssFilesForPreview: (files: string[], panel: null) => string;
    }
  ).generateJSAndCssFilesForPreview(files, null);
}

describe('preview scripts gate (@import js and head.html)', () => {
  track();

  test('by default @import "*.js" does not load any script', async () => {
    const tmpDir = mkdirSync({ prefix: 'xnote-scripts' });
    fs.writeFileSync(path.join(tmpDir, 'helper.js'), 'alert("hi");');
    fs.writeFileSync(path.join(tmpDir, 'test.md'), '# Test');

    const notebook = await Notebook.init({
      notebookPath: tmpDir,
      config: {
        markdownParser: 'markdown-it',
        markdownYoBinaryPath: '',
      },
    });

    const html = await renderPreviewTemplate(
      notebook,
      path.join(tmpDir, 'test.md'),
      '@import "/helper.js"\n# Test\n',
    );

    expect(html).not.toMatch(/<script[^>]*src="[^"]*helper\.js"/);
  });

  test('opt-in loads workspace-local scripts only', async () => {
    const tmpDir = mkdirSync({ prefix: 'xnote-scripts' });
    const outsideDir = mkdirSync({ prefix: 'xnote-outside' });
    fs.writeFileSync(path.join(tmpDir, 'helper.js'), 'alert("hi");');
    fs.writeFileSync(path.join(outsideDir, 'outside.js'), 'alert("outside");');
    fs.writeFileSync(path.join(tmpDir, 'test.md'), '# Test');
    const outsideImportPath = path
      .relative(tmpDir, path.join(outsideDir, 'outside.js'))
      .split(path.sep)
      .join('/');

    const notebook = await Notebook.init({
      notebookPath: tmpDir,
      config: {
        markdownParser: 'markdown-it',
        markdownYoBinaryPath: '',
        // @import js/css requires script execution to reach the emission
        // gate at all (parseMD clears JSAndCssFiles otherwise)
        enableScriptExecution: true,
      },
    });
    notebook.previewScriptsEnabled = true;

    const html = await renderPreviewTemplate(
      notebook,
      path.join(tmpDir, 'test.md'),
      `@import "/helper.js"\n@import "/${outsideImportPath}"\n# Test\n`,
    );

    // local file inside the notebook directory is loaded
    expect(html).toMatch(
      /<script type="text\/javascript" src="file:\/\/[^"]*helper\.js"><\/script>/,
    );
    // files outside the notebook directory are not
    expect(html).not.toMatch(/<script[^>]*src="[^"]*outside\.js"/);
  });

  test('emission gate never turns URLs into scripts (unit)', async () => {
    const tmpDir = mkdirSync({ prefix: 'xnote-scripts' });
    const outsideDir = mkdirSync({ prefix: 'xnote-outside' });
    fs.writeFileSync(path.join(tmpDir, 'helper.js'), 'alert("hi");');
    fs.writeFileSync(path.join(outsideDir, 'outside.js'), 'alert("outside");');
    fs.writeFileSync(path.join(tmpDir, 'test.md'), '# Test');
    const outsidePath = path.relative(
      tmpDir,
      path.join(outsideDir, 'outside.js'),
    );

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

    const files = [
      'https://evil.example.com/payload.js',
      'http://evil.example.com/payload.js',
      'file:///etc/evil.js',
      '//evil.example.com/payload.js',
      outsidePath,
      'helper.js',
    ];

    // default: nothing at all is emitted
    expect(callGenerateJSAndCssFilesForPreview(engine, files)).toBe('');

    // opt-in: only the workspace-local file is emitted
    notebook.previewScriptsEnabled = true;
    expect(callGenerateJSAndCssFilesForPreview(engine, files)).toBe(
      `<script type="text/javascript" src="file://${path.join(
        tmpDir,
        'helper.js',
      )}"></script>`,
    );
  });

  test('opt-in keeps only workspace-local <script src> from head.html', async () => {
    const tmpDir = mkdirSync({ prefix: 'xnote-scripts' });
    const configDir = path.join(tmpDir, '.crossnote');
    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'copy.js'), 'alert("copy");');

    const headHtml = `\
<script src="./copy.js"></script>
<script>alert("inline");</script>
<script src="https://evil.example.com/payload.js"></script>
<style>
  .custom { color: red; }
</style>`;

    fs.writeFileSync(path.join(configDir, 'head.html'), headHtml);
    fs.writeFileSync(path.join(tmpDir, 'test.md'), '# Test');

    const notebook = await Notebook.init({
      notebookPath: tmpDir,
      config: {
        markdownParser: 'markdown-it',
        markdownYoBinaryPath: '',
      },
    });
    notebook.previewScriptsEnabled = true;

    const html = await renderPreviewTemplate(
      notebook,
      path.join(tmpDir, 'test.md'),
      '# Test\n',
    );

    // workspace-local script src is kept and rewritten to a file URL
    expect(html).toMatch(/<script src="file:\/\/[^"]*copy\.js"><\/script>/);
    // inline scripts and remote URLs never run (the raw head.html text
    // may still appear inside the data-config attribute — that is inert
    // data, not a tag)
    expect(html).not.toContain('alert("inline")');
    expect(html).not.toContain(
      '<script src="https://evil.example.com/payload.js">',
    );
    // styles are unaffected
    expect(html).toContain('.custom { color: red; }');
  });
});
