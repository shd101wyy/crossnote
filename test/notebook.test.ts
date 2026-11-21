import * as path from 'path';
import { Notebook } from '../src/notebook';
import { MarkdownParser } from '../src/notebook/types';

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
