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

describe('head.html script sanitization', () => {
  track();

  test('resolvePathsInHeader strips <script> tags from head.html', async () => {
    const tmpDir = mkdirSync({ prefix: 'xnote-head' });
    const configDir = path.join(tmpDir, '.crossnote');
    fs.mkdirSync(configDir, { recursive: true });

    const headHtml = `\
<style>
  .custom { color: red; }
</style>
<script type="text/javascript">
  document.addEventListener("DOMContentLoaded", function () {
    alert("xss");
  });
</script>
<script src="/assets/helper.js"></script>
<meta name="viewport" content="width=device-width">`;

    fs.writeFileSync(path.join(configDir, 'head.html'), headHtml);

    const testMdPath = path.join(tmpDir, 'test.md');
    fs.writeFileSync(testMdPath, '# Test');

    const notebook = await Notebook.init({
      notebookPath: tmpDir,
      config: {
        markdownParser: 'markdown-it',
        markdownYoBinaryPath: '',
      },
    });

    const engine = new MarkdownEngine({
      notebook,
      filePath: testMdPath,
    });

    const webviewConfig: WebviewConfig = notebook.config as WebviewConfig;

    const html = await engine.generateHTMLTemplateForPreview({
      inputString: '# Test',
      config: webviewConfig,
      vscodePreviewPanel: null,
    });

    expect(html).toContain('<style');
    expect(html).toContain('.custom { color: red; }');
    expect(html).toContain(
      '<meta name="viewport" content="width=device-width">',
    );
    expect(html).not.toContain('<script type="text/javascript">');
    expect(html).not.toContain('alert("xss")');
    expect(html).not.toContain('<script src="/assets/helper.js">');
  });
});
