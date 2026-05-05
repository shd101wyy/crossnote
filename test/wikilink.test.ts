import * as path from 'path';
import { Notebook } from '../src/notebook/index';
import { formatWikilinkDisplay } from '../src/custom-markdown-it-features/wikilink';

describe('formatWikilinkDisplay', () => {
  it('passes a plain note name through unchanged', () => {
    expect(formatWikilinkDisplay('README')).toBe('README');
  });

  it('formats Note#Heading with " > " separator', () => {
    expect(formatWikilinkDisplay('README#Overview')).toBe('README > Overview');
  });

  it('formats Note^block with " > " separator', () => {
    expect(formatWikilinkDisplay('README^abc')).toBe('README > ^abc');
  });

  it('formats Note#Heading^block with double separator', () => {
    expect(formatWikilinkDisplay('README#Section^abc')).toBe(
      'README > Section > ^abc',
    );
  });

  it('drops empty leading note for self-links #Heading', () => {
    expect(formatWikilinkDisplay('#Heading')).toBe('Heading');
  });

  it('drops empty leading note for self-links ^block', () => {
    expect(formatWikilinkDisplay('^abc')).toBe('^abc');
  });

  it('preserves both parts when ^ appears before # (reverse order)', () => {
    // Obsidian doesn't actually produce this shape, but we shouldn't
    // silently drop the block ref when a user types it.
    expect(formatWikilinkDisplay('Note^abc#wrong')).toBe('Note > ^abc > wrong');
  });
});

describe('Inline wikilink rendering', () => {
  let notebook: Notebook;

  beforeAll(async () => {
    notebook = await Notebook.init({
      notebookPath: path.resolve(__dirname, './markdown/test-files'),
      config: { markdownParser: 'markdown-it' },
    });
  });

  it('renders [[Note]] with the bare note name', () => {
    const html = notebook.renderMarkdown('See [[README]] for details', {
      isForPreview: true,
    });
    expect(html).toContain('>README</a>');
    expect(html).toContain('href="README.md"');
  });

  it('renders [[Note#Heading]] with " > " between the parts', () => {
    const html = notebook.renderMarkdown('See [[README#Setup]] for details', {
      isForPreview: true,
    });
    expect(html).toContain('>README &gt; Setup</a>');
    expect(html).toContain('href="README.md#Setup"');
  });

  it('renders [[Note#^block]] with " > ^block" suffix', () => {
    const html = notebook.renderMarkdown('See [[README#^abc]] there', {
      isForPreview: true,
    });
    // The display should be "README > ^abc", not the raw "README#^abc"
    expect(html).toContain('>README &gt; ^abc</a>');
    // The href still carries the full fragment so the click handler can
    // route it.  &amp; / &gt; / &lt; in href would break things; assert
    // that the href fragment is intact (no hash escaping needed for #).
    expect(html).toMatch(/href="README\.md#\^abc"/);
    // Sanity: no literal "README#^abc" leaks as display text.
    expect(html).not.toContain('>README#^abc<');
  });

  it('respects an explicit alias [[Note#^abc|Custom]]', () => {
    const html = notebook.renderMarkdown('See [[README#^abc|My Block]] there', {
      isForPreview: true,
    });
    expect(html).toContain('>My Block</a>');
    expect(html).not.toContain('&gt;');
  });

  it('renders [[Note^abc]] (no #) the same way as [[Note#^abc]]', () => {
    const html = notebook.renderMarkdown('See [[README^abc]] there', {
      isForPreview: true,
    });
    expect(html).toContain('>README &gt; ^abc</a>');
  });
});

describe('Wikilink + useGitHubStylePipedLink (Wikipedia order, default)', () => {
  // useGitHubStylePipedLink: false (default) → [[link|text]]
  let notebook: Notebook;

  beforeAll(async () => {
    notebook = await Notebook.init({
      notebookPath: path.resolve(__dirname, './markdown/test-files'),
      config: {
        markdownParser: 'markdown-it',
        useGitHubStylePipedLink: false,
      },
    });
  });

  it('extracts block ref from link side (no alias)', () => {
    const { text, link, blockRef } = notebook.processWikilink('README^abc');
    expect(text).toBe('README^abc');
    expect(link).toBe('README.md^abc');
    expect(blockRef).toBe('^abc');
  });

  it('extracts block ref from the link side of [[link|text]]', () => {
    const { text, link, blockRef } = notebook.processWikilink(
      'README^abc|My Block',
    );
    expect(text).toBe('My Block');
    expect(link).toBe('README.md^abc');
    expect(blockRef).toBe('^abc');
  });

  it('extracts heading + block ref from [[link|text]]', () => {
    const { text, link, hash, blockRef } = notebook.processWikilink(
      'README#Setup^abc|Setup block',
    );
    expect(text).toBe('Setup block');
    // Final link keeps both heading and block fragments so the host
    // resolver can navigate within the heading section if it wants to.
    expect(link).toBe('README.md#Setup^abc');
    expect(hash).toBe('#Setup');
    expect(blockRef).toBe('^abc');
  });

  it('renders [[link|alias]] with the user alias as display', () => {
    const html = notebook.renderMarkdown('See [[README^abc|My Block]] here', {
      isForPreview: true,
    });
    expect(html).toContain('>My Block</a>');
    expect(html).toContain('href="README.md^abc"');
    // The Obsidian-style auto-format must NOT kick in when there's an alias.
    expect(html).not.toContain('&gt;');
  });
});

describe('Wikilink + useGitHubStylePipedLink (GitHub order)', () => {
  // useGitHubStylePipedLink: true → [[text|link]]
  let notebook: Notebook;

  beforeAll(async () => {
    notebook = await Notebook.init({
      notebookPath: path.resolve(__dirname, './markdown/test-files'),
      config: {
        markdownParser: 'markdown-it',
        useGitHubStylePipedLink: true,
      },
    });
  });

  it('still works without an alias (no pipe)', () => {
    const { text, link, blockRef } = notebook.processWikilink('README^abc');
    expect(text).toBe('README^abc');
    expect(link).toBe('README.md^abc');
    expect(blockRef).toBe('^abc');
  });

  it('extracts block ref from the link side of [[text|link]]', () => {
    const { text, link, blockRef } = notebook.processWikilink(
      'My Block|README^abc',
    );
    expect(text).toBe('My Block');
    expect(link).toBe('README.md^abc');
    expect(blockRef).toBe('^abc');
  });

  it('extracts heading + block ref from [[text|link]]', () => {
    const { text, link, hash, blockRef } = notebook.processWikilink(
      'Setup block|README#Setup^abc',
    );
    expect(text).toBe('Setup block');
    expect(link).toBe('README.md#Setup^abc');
    expect(hash).toBe('#Setup');
    expect(blockRef).toBe('^abc');
  });

  it('renders [[Note^abc]] (no pipe, GitHub mode) with auto-formatted display', () => {
    const html = notebook.renderMarkdown('See [[README^abc]] here', {
      isForPreview: true,
    });
    // Same auto-format as the no-pipe Wikipedia-mode case — the
    // pipe-config only matters when there IS a pipe.
    expect(html).toContain('>README &gt; ^abc</a>');
    expect(html).toContain('href="README.md^abc"');
  });

  it('renders [[alias|link]] with the user alias as display', () => {
    const html = notebook.renderMarkdown('See [[My Block|README^abc]] here', {
      isForPreview: true,
    });
    expect(html).toContain('>My Block</a>');
    expect(html).toContain('href="README.md^abc"');
    expect(html).not.toContain('&gt;');
  });
});
