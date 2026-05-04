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
