import * as path from 'path';
import { Notebook, parseNotebookPath } from '../src/notebook';
import { MarkdownParser } from '../src/notebook/types';

describe('Notebook notebookPath parsing', () => {
  test('a native Windows drive path keeps its drive instead of parsing it as a scheme', () => {
    // `URI.parse('C:\\notes')` reads `C` as the scheme and drops the drive
    // from the path; the remainder only works while the process cwd shares
    // the drive (`crossnote serve D:\notes` from a `C:` cwd breaks).
    const uri = parseNotebookPath('C:\\notes\\docs');
    expect(uri.scheme).toBe('file');
    expect(uri.fsPath.toLowerCase().replace(/\//g, '\\')).toContain(
      'c:\\notes\\docs',
    );
  });

  test('scheme-bearing inputs and POSIX paths parse unchanged', () => {
    expect(parseNotebookPath('file:///c%3A/notes/docs').scheme).toBe('file');
    expect(parseNotebookPath('untitled:Untitled-1').scheme).toBe('untitled');
    // vscode-uri defaults an empty scheme to `file` on Windows only.
    expect(['', 'file']).toContain(parseNotebookPath('/tmp/notes').scheme);
    expect(parseNotebookPath('/tmp/notes').path).toBe('/tmp/notes');
  });

  test('Notebook.init with a native filesystem path keeps the real root', async () => {
    const notebook = await Notebook.init({
      notebookPath: path.resolve(__dirname, './markdown/test-files'),
      config: {},
    });
    // On Windows the native spelling is a drive path; the notebook root
    // must keep the drive (`C:\`, case-insensitively — vscode-uri
    // lowercases it in fsPath) rather than become drive-relative (`\`).
    expect(path.parse(notebook.notebookPath.fsPath).root.toLowerCase()).toBe(
      path.parse(path.resolve(__dirname)).root.toLowerCase(),
    );
  });
});

describe('Notebook markdown-yo rendering', () => {
  test('the legacy markdownParser spelling markdown_yo still selects markdown-yo', async () => {
    const notebook = await Notebook.init({
      notebookPath: path.resolve(__dirname, './markdown/test-files'),
      // Written before the package rename (#546); the old spelling must
      // not silently fall back to markdown-it.
      config: {
        markdownParser: 'markdown_yo' as MarkdownParser,
      },
    });

    expect(notebook.config.markdownParser).toBe('markdown-yo');
    // init awaits the WASM load only when the parser is selected, so the
    // renderer being ready here proves the alias took effect at init time.
    expect(notebook.markdownYoRenderer).not.toBeNull();

    notebook.updateConfig({ markdownParser: 'markdown-it' });
    notebook.updateConfig({
      markdownParser: 'markdown_yo' as MarkdownParser,
    });
    expect(notebook.config.markdownParser).toBe('markdown-yo');
  });

  test('renderMarkdown applies updated config to markdown-yo renders', async () => {
    const notebook = await Notebook.init({
      notebookPath: path.resolve(__dirname, './markdown/test-files'),
      config: {
        markdownParser: 'markdown-yo',
        enableTypographer: false,
      },
    });

    // The WASM module must actually load — every other markdown-yo
    // expectation also holds via the silent markdown-it fallback, so a
    // broken package (e.g. a tarball missing the .wasm file) would
    // otherwise pass unnoticed.
    expect(notebook.markdownYoRenderer).not.toBeNull();

    expect(notebook.renderMarkdown('"test"', { isForPreview: true })).toContain(
      '&quot;test&quot;',
    );

    notebook.updateConfig({ enableTypographer: true });

    expect(notebook.renderMarkdown('"test"', { isForPreview: true })).toContain(
      '“test”',
    );
  });

  test('renderMarkdown falls back to markdown-it when markdown-yo is disabled', async () => {
    const notebook = await Notebook.init({
      notebookPath: path.resolve(__dirname, './markdown/test-files'),
      config: {
        markdownParser: 'markdown-yo',
      },
    });

    expect(
      notebook.renderMarkdown('[[My Note]]', { isForPreview: true }),
    ).toContain('class="wikilink"');

    notebook.updateConfig({ markdownParser: 'markdown-it' });

    const html = notebook.renderMarkdown('[[My Note]]', { isForPreview: true });
    expect(html).toContain('href="My Note.md"');
    expect(html).not.toContain('class="wikilink"');
  });
});
