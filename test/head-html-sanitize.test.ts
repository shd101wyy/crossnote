import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';
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

  test('body-leading content cannot smuggle scripts past the stripper', async () => {
    const tmpDir = mkdirSync({ prefix: 'xnote-head' });
    const configDir = path.join(tmpDir, '.crossnote');
    fs.mkdirSync(configDir, { recursive: true });

    // The leading <div> makes the parser place the whole fragment —
    // script included — in <body>, so stripping left the head empty.
    // The empty head used to fall back to the raw header string,
    // reintroducing the removed script.
    const headHtml = '<div>hi</div><script>alert("smuggled");</script>';

    fs.writeFileSync(path.join(configDir, 'head.html'), headHtml);
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
    const webviewConfig: WebviewConfig = notebook.config as WebviewConfig;

    const html = await engine.generateHTMLTemplateForPreview({
      inputString: '# Test',
      config: webviewConfig,
      vscodePreviewPanel: null,
    });

    // The raw head.html text appears (escaped) inside data-config, so
    // assert on tag forms, which cannot occur there.
    expect(html).not.toMatch(/<script[^>]*>\s*alert\(/);
  });
});

describe('head.html trusted script roots', () => {
  track();

  /**
   * Create a workspace ("workspace") and a global config directory
   * ("global") as siblings under one tracked temp parent, so a file
   * placed in the parent sits outside both.
   */
  function setupDirs() {
    const parent = mkdirSync({ prefix: 'xnote-tsr' });
    const workspaceDir = path.join(parent, 'workspace');
    const globalDir = path.join(parent, 'global');
    fs.mkdirSync(workspaceDir);
    fs.mkdirSync(globalDir);
    fs.writeFileSync(path.join(workspaceDir, 'test.md'), '# Test');
    return { parent, workspaceDir, globalDir };
  }

  /**
   * Render a preview whose head content comes from the *global* config
   * directory, modeled the way a host passes it: `includeInHeader` in the
   * constructor config (highest-priority merge) and the global directory
   * named in `notebook.trustedScriptRoots`.
   */
  async function renderPreviewWithHead({
    workspaceDir,
    trustedRoots,
    headHtml,
    previewScriptsEnabled,
  }: {
    workspaceDir: string;
    trustedRoots: string[];
    headHtml: string;
    previewScriptsEnabled: boolean;
  }): Promise<string> {
    const notebook = await Notebook.init({
      notebookPath: workspaceDir,
      config: {
        markdownParser: 'markdown-it',
        markdownYoBinaryPath: '',
        includeInHeader: headHtml,
      },
    });
    notebook.previewScriptsEnabled = previewScriptsEnabled;
    notebook.trustedScriptRoots = trustedRoots;
    const engine = new MarkdownEngine({
      notebook,
      filePath: path.join(workspaceDir, 'test.md'),
    });
    const webviewConfig: WebviewConfig = notebook.config as WebviewConfig;
    return engine.generateHTMLTemplateForPreview({
      inputString: '# Test',
      config: webviewConfig,
      vscodePreviewPanel: null,
    });
  }

  // The emitted src for a kept script tag (the form addFileProtocol
  // produces when there is no webview panel to rewrite it).
  const fileUrlOf = (filePath: string) => pathToFileURL(filePath).href;

  test('opt-in loads a script from a trusted root outside the notebook', async () => {
    const { workspaceDir, globalDir } = setupDirs();
    fs.writeFileSync(path.join(globalDir, 'helper.js'), 'alert("global");');

    const html = await renderPreviewWithHead({
      workspaceDir,
      trustedRoots: [globalDir],
      headHtml: '<script src="./helper.js"></script>',
      previewScriptsEnabled: true,
    });

    expect(html).toContain(
      `<script src="${fileUrlOf(path.join(globalDir, 'helper.js'))}"></script>`,
    );
  });

  test('a notebook-local file takes precedence over the trusted root', async () => {
    const { workspaceDir, globalDir } = setupDirs();
    fs.writeFileSync(path.join(workspaceDir, 'helper.js'), 'alert("local");');
    fs.writeFileSync(path.join(globalDir, 'helper.js'), 'alert("global");');

    const html = await renderPreviewWithHead({
      workspaceDir,
      trustedRoots: [globalDir],
      headHtml: '<script src="./helper.js"></script>',
      previewScriptsEnabled: true,
    });

    expect(html).toContain(
      `<script src="${fileUrlOf(
        path.join(workspaceDir, 'helper.js'),
      )}"></script>`,
    );
    expect(html).not.toContain(fileUrlOf(path.join(globalDir, 'helper.js')));
  });

  test('paths escaping both the notebook and the trusted root are removed', async () => {
    const { parent, workspaceDir, globalDir } = setupDirs();
    // Sits in the shared parent: outside the workspace AND outside the
    // trusted root, reachable from both via "../".
    const evilPath = path.join(parent, 'evil.js');
    fs.writeFileSync(evilPath, 'alert("evil");');

    const html = await renderPreviewWithHead({
      workspaceDir,
      trustedRoots: [globalDir],
      headHtml: '<script src="../evil.js"></script>',
      previewScriptsEnabled: true,
    });

    expect(html).not.toContain(fileUrlOf(evilPath));
  });

  test('a symlink inside the trusted root pointing outside it is removed', async () => {
    const { parent, workspaceDir, globalDir } = setupDirs();
    const outsideDir = path.join(parent, 'outside');
    fs.mkdirSync(outsideDir);
    const targetPath = path.join(outsideDir, 'target.js');
    fs.writeFileSync(targetPath, 'alert("outside");');
    fs.symlinkSync(targetPath, path.join(globalDir, 'link.js'));

    const html = await renderPreviewWithHead({
      workspaceDir,
      trustedRoots: [globalDir],
      headHtml: '<script src="./link.js"></script>',
      previewScriptsEnabled: true,
    });

    // The realpath escapes the trusted root, so neither the link path
    // nor its target may be emitted.
    expect(html).not.toContain(fileUrlOf(path.join(globalDir, 'link.js')));
    expect(html).not.toContain(fileUrlOf(targetPath));
  });

  test('a src that resolves to no existing file is removed', async () => {
    const { workspaceDir, globalDir } = setupDirs();

    const html = await renderPreviewWithHead({
      workspaceDir,
      trustedRoots: [globalDir],
      headHtml: '<script src="./ghost.js"></script>',
      previewScriptsEnabled: true,
    });

    // Script-only head content also guards the empty-head fallback: the
    // removed tag must not reappear from the raw header string.
    expect(html).not.toMatch(/<script src="[^"]*ghost\.js">/);
  });

  test('trusted roots have no effect unless previewScriptsEnabled is on', async () => {
    const { workspaceDir, globalDir } = setupDirs();
    fs.writeFileSync(path.join(globalDir, 'helper.js'), 'alert("global");');

    const html = await renderPreviewWithHead({
      workspaceDir,
      trustedRoots: [globalDir],
      headHtml: '<script src="./helper.js"></script>',
      previewScriptsEnabled: false,
    });

    expect(html).not.toContain(fileUrlOf(path.join(globalDir, 'helper.js')));
  });
});
