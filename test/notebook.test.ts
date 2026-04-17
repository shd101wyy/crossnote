import * as path from 'path';
import { Notebook } from '../src/notebook';

describe('Notebook markdown_yo rendering', () => {
  test('renderMarkdown applies updated config to markdown_yo renders', async () => {
    const notebook = await Notebook.init({
      notebookPath: path.resolve(__dirname, './markdown/test-files'),
      config: {
        useMarkdownYoParser: true,
        enableTypographer: false,
      },
    });

    expect(notebook.renderMarkdown('"test"', { isForPreview: true })).toContain(
      '&quot;test&quot;',
    );

    notebook.updateConfig({ enableTypographer: true });

    expect(notebook.renderMarkdown('"test"', { isForPreview: true })).toContain(
      '“test”',
    );
  });

  test('renderMarkdown falls back to markdown-it when markdown_yo is disabled', async () => {
    const notebook = await Notebook.init({
      notebookPath: path.resolve(__dirname, './markdown/test-files'),
      config: {
        useMarkdownYoParser: true,
      },
    });

    expect(
      notebook.renderMarkdown('[[My Note]]', { isForPreview: true }),
    ).toContain('class="wikilink"');

    notebook.updateConfig({ useMarkdownYoParser: false });

    const html = notebook.renderMarkdown('[[My Note]]', { isForPreview: true });
    expect(html).toContain('href="My Note.md"');
    expect(html).not.toContain('class="wikilink"');
  });
});
