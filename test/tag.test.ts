import * as path from 'path';
import Token from 'markdown-it/lib/token';
import { Notebook } from '../src/notebook/index';

describe('Tag syntax', () => {
  let notebook: Notebook;

  beforeAll(async () => {
    notebook = await Notebook.init({
      notebookPath: path.resolve(__dirname, './markdown/test-files'),
      config: {
        markdownParser: 'markdown-it',
      },
    });
  });

  it('renders #tag as anchor with class=tag and data-tag', async () => {
    const html = notebook.renderMarkdown('Hello #world here', {
      isForPreview: true,
    });
    expect(html).toContain('<a class="tag"');
    expect(html).toContain('data-tag="world"');
    expect(html).toContain('href="tag://world"');
    expect(html).toContain('>#world</a>');
  });

  it('renders nested #parent/child tags as anchor with encoded href', async () => {
    const html = notebook.renderMarkdown('Check #topic/subtopic', {
      isForPreview: true,
    });
    expect(html).toContain('<a class="tag"');
    expect(html).toContain('data-tag="topic/subtopic"');
    expect(html).toContain('href="tag://topic%2Fsubtopic"');
    expect(html).toContain('>#topic/subtopic</a>');
  });

  it('renders #tag at start of line as anchor', async () => {
    const html = notebook.renderMarkdown('#tag-at-start of line', {
      isForPreview: true,
    });
    expect(html).toContain('<a class="tag"');
    expect(html).toContain('data-tag="tag-at-start"');
    expect(html).toContain('#tag-at-start');
    // Should NOT be a heading
    expect(html).not.toContain('<h1');
  });

  it('does not render tag inside inline code', async () => {
    const html = notebook.renderMarkdown('This is `#not-a-tag` here', {
      isForPreview: true,
    });
    expect(html).not.toContain('class="tag"');
    expect(html).toContain('#not-a-tag');
  });

  it('does not render tag inside fenced code block', async () => {
    const html = notebook.renderMarkdown('```\n#not-a-tag\n```', {
      isForPreview: true,
    });
    expect(html).not.toContain('class="tag"');
    expect(html).toContain('#not-a-tag');
  });

  it('does not render tag after / (URL fragment)', async () => {
    const html = notebook.renderMarkdown('See http://example.com#fragment', {
      isForPreview: true,
    });
    expect(html).not.toContain('class="tag"');
  });

  it('does not render numbers-only #123 as tag', async () => {
    const html = notebook.renderMarkdown('Value is #123 here', {
      isForPreview: true,
    });
    expect(html).not.toContain('class="tag"');
  });

  it('respects enableTagSyntax config when disabled', async () => {
    const disabledNotebook = await Notebook.init({
      notebookPath: path.resolve(__dirname, './markdown/test-files'),
      config: {
        markdownParser: 'markdown-it',
        enableTagSyntax: false,
      },
    });
    const html = disabledNotebook.renderMarkdown('Hello #world', {
      isForPreview: true,
    });
    expect(html).not.toContain('class="tag"');
  });

  it('generates tag tokens for processNoteMentionsAndMentionedBy', () => {
    const tokens = notebook.md.parse('#my-tag word', {});
    const tagTokens = tokens
      .flatMap((t: Token) => (t.children ? t.children : [t]))
      .filter((t: Token) => t.type === 'tag');

    expect(tagTokens.length).toBe(1);
    expect(tagTokens[0].content).toBe('my-tag');
  });

  it('does not confuse #tag with heading in processNoteMentionsAndMentionedBy', () => {
    const tokens = notebook.md.parse('#my-tag word', {});
    const headingTokens = tokens.filter(
      (t: Token) => t.type === 'heading_open',
    );

    expect(headingTokens.length).toBe(0);
  });

  it('renders #tag via transformer for pandoc parser', async () => {
    const notebookP = await Notebook.init({
      notebookPath: path.resolve(__dirname, './markdown/test-files'),
      config: {
        markdownParser: 'pandoc',
      },
    });
    const markdown = 'Hello #world tag here';
    const engine = notebookP.getNoteMarkdownEngine(
      path.resolve(__dirname, './markdown/test-files/test-tag-pandoc.md'),
    );
    const { html } = await engine.parseMD(markdown, {
      useRelativeFilePath: false,
      isForPreview: true,
      hideFrontMatter: false,
    });

    expect(html).toContain('<a class="tag"');
    expect(html).toContain('data-tag="world"');
    expect(html).toContain('href="tag://world"');
    expect(html).toContain('#world');
  });

  it('renders #tag via transformer for markdown_yo parser', async () => {
    const notebookYo = await Notebook.init({
      notebookPath: path.resolve(__dirname, './markdown/test-files'),
      config: {
        markdownParser: 'markdown_yo',
      },
    });
    const markdown = 'Hello #world tag here';
    const engine = notebookYo.getNoteMarkdownEngine(
      path.resolve(__dirname, './markdown/test-files/test-tag-yo.md'),
    );
    const { html } = await engine.parseMD(markdown, {
      useRelativeFilePath: false,
      isForPreview: true,
      hideFrontMatter: false,
    });

    expect(html).toContain('<a class="tag"');
    expect(html).toContain('data-tag="world"');
    expect(html).toContain('href="tag://world"');
    expect(html).toContain('#world');
  });

  it('encodes nested tag href but keeps slash readable in data-tag', async () => {
    const html = notebook.renderMarkdown('Topic #parent/child here', {
      isForPreview: true,
    });
    // data-tag should preserve the slash (more readable for the host)
    expect(html).toContain('data-tag="parent/child"');
    // href must percent-encode the slash so URL parsing on the host is unambiguous
    expect(html).toContain('href="tag://parent%2Fchild"');
  });

  it('preserves transformer-rendered tag on pandoc parser too (nested)', async () => {
    const notebookP = await Notebook.init({
      notebookPath: path.resolve(__dirname, './markdown/test-files'),
      config: {
        markdownParser: 'pandoc',
      },
    });
    const engine = notebookP.getNoteMarkdownEngine(
      path.resolve(
        __dirname,
        './markdown/test-files/test-tag-pandoc-nested.md',
      ),
    );
    const { html } = await engine.parseMD('Topic #parent/child here', {
      useRelativeFilePath: false,
      isForPreview: true,
      hideFrontMatter: false,
    });
    expect(html).toContain('<a class="tag"');
    expect(html).toContain('data-tag="parent/child"');
    expect(html).toContain('href="tag://parent%2Fchild"');
  });
});
