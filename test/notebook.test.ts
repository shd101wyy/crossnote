import * as path from 'path';
import { Notebook } from '../src/notebook';

describe('Notebook markdown-yo rendering', () => {
  test('renderMarkdown applies updated config to markdown-yo renders', async () => {
    const notebook = await Notebook.init({
      notebookPath: path.resolve(__dirname, './markdown/test-files'),
      config: {
        markdownParser: 'markdown-yo',
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
