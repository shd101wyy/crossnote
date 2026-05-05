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

  it('renders ^block-id syntax as span with block id', async () => {
    const markdown = 'This is a paragraph. ^my-block-id\n\nAnother paragraph.';
    const engine = notebook.getNoteMarkdownEngine(
      path.resolve(__dirname, './markdown/test-files/test-block-id.md'),
    );
    const { html } = await engine.parseMD(markdown, {
      useRelativeFilePath: false,
      isForPreview: true,
      hideFrontMatter: false,
    });

    expect(html).toContain('block-id');
    expect(html).toContain('id="my-block-id"');
    expect(html).not.toContain('^my-block-id');
  });

  it('renders ![[note^block-id]] embed extracting just the referenced block', async () => {
    const markdown = 'Before ![[block-ref-note^first-paragraph]] after.';
    const engine = notebook.getNoteMarkdownEngine(
      path.resolve(__dirname, './markdown/test-files/test-block-embed.md'),
    );
    const { html } = await engine.parseMD(markdown, {
      useRelativeFilePath: false,
      isForPreview: true,
      hideFrontMatter: false,
    });

    expect(html).toContain('A paragraph with some content');
    expect(html).toContain('wikilink-embed-content');
    // Should NOT contain content from other blocks
    expect(html).not.toContain('Second list item');
    expect(html).not.toContain('Another paragraph here');
  });

  it('renders ![[note#heading^block-id]] embed with heading section and block ref', async () => {
    const markdown =
      'Before ![[block-ref-note#block-reference-test-note^item-one]] after.';
    const engine = notebook.getNoteMarkdownEngine(
      path.resolve(
        __dirname,
        './markdown/test-files/test-block-heading-embed.md',
      ),
    );
    const { html } = await engine.parseMD(markdown, {
      useRelativeFilePath: false,
      isForPreview: true,
      hideFrontMatter: false,
    });

    expect(html).toContain('First list item');
    expect(html).toContain('wikilink-embed-content');
    // Should be scoped to heading section + specific block
    expect(html).not.toContain('Another paragraph');
  });

  it('shows error when block reference is not found', async () => {
    const markdown = 'Before ![[block-ref-note^non-existent-block]] after.';
    const engine = notebook.getNoteMarkdownEngine(
      path.resolve(__dirname, './markdown/test-files/test-block-not-found.md'),
    );
    const { html } = await engine.parseMD(markdown, {
      useRelativeFilePath: false,
      isForPreview: true,
      hideFrontMatter: false,
    });

    expect(html).toContain('Block reference not found');
    expect(html).toContain('wikilink-embed-error');
  });
});
