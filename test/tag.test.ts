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

  it('does not render #id inside heading {#id} block-attributes', async () => {
    // Regression: `# Heading {#myid}` was being broken because the tag
    // plugin captured `#myid`, splitting the text token and preventing
    // the curly-bracket-attributes core ruler from lifting the trailing
    // `{...}` into heading attributes.
    const html = notebook.renderMarkdown('# Heading {#myid}', {
      isForPreview: true,
    });
    expect(html).not.toContain('class="tag"');
    expect(html).not.toContain('>#myid<');
    expect(html).toMatch(/<h1[^>]*\bid="myid"/);
  });

  it('does not render #id inside heading {.class #id} block-attributes', async () => {
    const html = notebook.renderMarkdown('# Heading {.cool #myid}', {
      isForPreview: true,
    });
    expect(html).not.toContain('class="tag"');
    expect(html).not.toContain('>#myid<');
  });

  it('does not render transformer-injected {#id data-source-line=...} as a tag', async () => {
    // The transformer auto-appends `{#id data-source-line="N"}` to every
    // heading.  The plugin must not capture `#id` from that injection.
    const engine = notebook.getNoteMarkdownEngine(
      path.resolve(__dirname, './markdown/test-files/test-tag-heading.md'),
    );
    const { html } = await engine.parseMD('# Markdown', {
      useRelativeFilePath: false,
      isForPreview: true,
      hideFrontMatter: false,
    });
    expect(html).not.toContain('class="tag"');
    expect(html).not.toContain('{#markdown');
    expect(html).not.toContain('data-source-line="1"}');
    expect(html).toMatch(/<h1[^>]*\bid="markdown"/);
  });

  it('still renders a real #tag immediately after a closed {...} block', async () => {
    const html = notebook.renderMarkdown('Text {#cls} #realtag here', {
      isForPreview: true,
    });
    expect(html).toContain('<a class="tag"');
    expect(html).toContain('data-tag="realtag"');
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

  it('transformer skips #tag inside markdown image alt text (markdown_yo)', async () => {
    // Regression: the transformer used to wrap `<a class="tag">` inside
    // `![alt #bug](img.png)` because the regex didn't know about
    // markdown link/image ranges, producing malformed HTML.
    const notebookYo = await Notebook.init({
      notebookPath: path.resolve(__dirname, './markdown/test-files'),
      config: {
        markdownParser: 'markdown_yo',
      },
    });
    const engine = notebookYo.getNoteMarkdownEngine(
      path.resolve(__dirname, './markdown/test-files/test-tag-yo-altskip.md'),
    );
    const { html } = await engine.parseMD(
      'Check ![screenshot #bugfix](img.png) here.\n',
      {
        useRelativeFilePath: false,
        isForPreview: true,
        hideFrontMatter: false,
      },
    );
    // The `#bugfix` is inside `[…]` — must not be wrapped.
    expect(html).not.toContain('class="tag"');
  });

  it('transformer skips #tag inside markdown link text (markdown_yo)', async () => {
    const notebookYo = await Notebook.init({
      notebookPath: path.resolve(__dirname, './markdown/test-files'),
      config: {
        markdownParser: 'markdown_yo',
      },
    });
    const engine = notebookYo.getNoteMarkdownEngine(
      path.resolve(__dirname, './markdown/test-files/test-tag-yo-linkskip.md'),
    );
    const { html } = await engine.parseMD('See [link #x](http://e.com).\n', {
      useRelativeFilePath: false,
      isForPreview: true,
      hideFrontMatter: false,
    });
    expect(html).not.toContain('class="tag"');
  });

  it('transformer skips #id inside {...} block-attributes (markdown_yo)', async () => {
    // For non-markdown-it parsers the tag substitution happens in the
    // transformer regex.  Make sure the curly-bracket attribute span
    // injected on every heading is not turned into a tag.
    const notebookYo = await Notebook.init({
      notebookPath: path.resolve(__dirname, './markdown/test-files'),
      config: {
        markdownParser: 'markdown_yo',
      },
    });
    const engine = notebookYo.getNoteMarkdownEngine(
      path.resolve(__dirname, './markdown/test-files/test-tag-yo-heading.md'),
    );
    const { html } = await engine.parseMD('# Markdown', {
      useRelativeFilePath: false,
      isForPreview: true,
      hideFrontMatter: false,
    });
    expect(html).not.toContain('class="tag"');
    expect(html).not.toContain('{#markdown');
  });
});
