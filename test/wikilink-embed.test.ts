import * as path from 'path';
import { Notebook } from '../src/notebook/index';

describe('Wikilink embed integration', () => {
  let notebook: Notebook;

  beforeAll(async () => {
    notebook = await Notebook.init({
      notebookPath: path.resolve(__dirname, './markdown/test-files'),
      config: {
        markdownParser: 'markdown-it',
      },
    });
  });

  it('renders inline ![[markdown-file]] as embedded content with markdown-it', async () => {
    const markdown = 'Before ![[embedded-note]] after end.';
    const engine = notebook.getNoteMarkdownEngine(
      path.resolve(__dirname, './markdown/test-files/test-embed.md'),
    );
    const { html } = await engine.parseMD(markdown, {
      useRelativeFilePath: false,
      isForPreview: true,
      hideFrontMatter: false,
    });

    expect(html).toContain('Before');
    expect(html).toContain('after end');
    expect(html).toContain('Embedded Note');
    expect(html).toContain('This is an embedded note content');
    expect(html).toContain('wikilink-embed-content');
  });

  it('renders inline ![[markdown-file]] as embedded content with markdown_yo', async () => {
    const notebookYo = await Notebook.init({
      notebookPath: path.resolve(__dirname, './markdown/test-files'),
      config: {
        markdownParser: 'markdown_yo',
      },
    });
    const markdown = 'Before ![[embedded-note]] after end.';
    const engine = notebookYo.getNoteMarkdownEngine(
      path.resolve(__dirname, './markdown/test-files/test-embed-yo.md'),
    );
    const { html } = await engine.parseMD(markdown, {
      useRelativeFilePath: false,
      isForPreview: true,
      hideFrontMatter: false,
    });

    expect(html).toContain('Embedded Note');
    expect(html).toContain('This is an embedded note content');
  });

  it('renders inline ![[markdown-file]] as embedded content with pandoc', async () => {
    const notebookPandoc = await Notebook.init({
      notebookPath: path.resolve(__dirname, './markdown/test-files'),
      config: {
        markdownParser: 'pandoc',
      },
    });
    const markdown = 'Before ![[embedded-note]] after end.';
    const engine = notebookPandoc.getNoteMarkdownEngine(
      path.resolve(__dirname, './markdown/test-files/test-embed-pandoc.md'),
    );
    const { html } = await engine.parseMD(markdown, {
      useRelativeFilePath: false,
      isForPreview: true,
      hideFrontMatter: false,
    });

    expect(html).toContain('Embedded Note');
    expect(html).toContain('This is an embedded note content');
  });

  it('shows error message when embedded file is not found', async () => {
    const markdown = 'Inline ![[non-existent-file]] embed.';
    const engine = notebook.getNoteMarkdownEngine(
      path.resolve(__dirname, './markdown/test-files/test-missing.md'),
    );
    const { html } = await engine.parseMD(markdown, {
      useRelativeFilePath: false,
      isForPreview: true,
      hideFrontMatter: false,
    });

    expect(html).toContain('File not found');
    expect(html).toContain('wikilink-embed-error');
  });

  it('renders inline ![[image-file]] as standard image with markdown-it', async () => {
    const markdown = 'Look: ![[test.png]] inline.';
    const engine = notebook.getNoteMarkdownEngine(
      path.resolve(__dirname, './markdown/test-files/test-image-embed.md'),
    );
    const { html } = await engine.parseMD(markdown, {
      useRelativeFilePath: false,
      isForPreview: true,
      hideFrontMatter: false,
    });

    expect(html).not.toContain('wikilink-embed');
    expect(html).toContain('Look:');
    expect(html).toContain('inline');
  });

  it('handles inline ![[note]] with alias syntax', async () => {
    const markdown = 'See ![[embedded-note|My Custom Title]] for details.';
    const engine = notebook.getNoteMarkdownEngine(
      path.resolve(__dirname, './markdown/test-files/test-alias-embed.md'),
    );
    const { html } = await engine.parseMD(markdown, {
      useRelativeFilePath: false,
      isForPreview: true,
      hideFrontMatter: false,
    });

    expect(html).toContain('Embedded Note');
    expect(html).toContain('This is an embedded note content');
    expect(html).not.toContain('My Custom Title');
  });
});
