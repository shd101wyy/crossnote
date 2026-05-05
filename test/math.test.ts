/**
 * Tests for math rendering, including the html_block post-process
 * path that recovers math inside `<table>` / `<div>` / similar HTML
 * blocks.
 *
 * Regression: vscode-mpe#2280 — markdown-it treats top-level HTML
 * blocks as verbatim, so the inline math rule never runs on
 * `$a^2$` written inside `<td>…</td>`.  The custom math plugin
 * hooks `md.renderer.rules.html_block` to scan the rendered HTML
 * for math delimiters and replace each with the configured
 * renderer's output.
 */
import * as path from 'path';
import { Notebook } from '../src/notebook/index';

describe('Math rendering', () => {
  let notebook: Notebook;

  beforeAll(async () => {
    notebook = await Notebook.init({
      notebookPath: path.resolve(__dirname, './markdown/test-files'),
      config: { markdownParser: 'markdown-it' },
    });
  });

  it('renders inline `$x$` math in a paragraph', () => {
    const html = notebook.renderMarkdown('Energy is $E=mc^2$ here.', {
      isForPreview: true,
    });
    // KaTeX wraps output in a `katex` span; the inline form lacks
    // the `katex-display` wrapper.
    expect(html).toContain('class="katex"');
    expect(html).not.toContain('katex-display');
  });

  it('renders block `$$…$$` math', () => {
    const html = notebook.renderMarkdown('$$\nE = mc^2\n$$', {
      isForPreview: true,
    });
    expect(html).toContain('class="katex"');
    expect(html).toContain('katex-display');
  });

  // --- Regression: vscode-mpe#2280 ---

  it('renders `$x$` inside an HTML <table> block (vscode-mpe#2280)', () => {
    // The exact reproducer from the issue.  Pre-fix the inline math
    // rule never saw the formula because the whole `<table>…</table>`
    // came in as one verbatim html_block token.
    const md = [
      '<table>',
      '    <tr>',
      '        <td>$a^2+b^2=c^2$</td>',
      '    </tr>',
      '</table>',
    ].join('\n');
    const html = notebook.renderMarkdown(md, { isForPreview: true });
    expect(html).toContain('class="katex"');
    // Outer table structure preserved.
    expect(html).toContain('<table>');
    expect(html).toContain('<td>');
    // Raw delimiter shouldn't leak through after rendering.
    expect(html).not.toContain('$a^2+b^2=c^2$');
  });

  it('renders block `$$…$$` math inside an HTML block', () => {
    const md = ['<div class="proof">', '$$', 'E = mc^2', '$$', '</div>'].join(
      '\n',
    );
    const html = notebook.renderMarkdown(md, { isForPreview: true });
    expect(html).toContain('katex-display');
    expect(html).toContain('class="proof"');
    expect(html).not.toContain('$$\nE = mc^2\n$$');
  });

  it('handles multiple math fragments inside one HTML block', () => {
    const md = [
      '<table>',
      '    <tr>',
      '        <td>$a^2$</td>',
      '        <td>$b^2$</td>',
      '        <td>$a^2+b^2$</td>',
      '    </tr>',
      '</table>',
    ].join('\n');
    const html = notebook.renderMarkdown(md, { isForPreview: true });
    // Three KaTeX spans, one per <td>.
    expect((html.match(/class="katex"/g) || []).length).toBe(3);
    // None of the originals leak through.
    expect(html).not.toContain('$a^2$');
    expect(html).not.toContain('$b^2$');
    expect(html).not.toContain('$a^2+b^2$');
  });

  it('does NOT render math inside <code> / <pre> blocks', () => {
    // Code samples might legitimately contain `$x$` literals (e.g.
    // a tutorial that's documenting math syntax).  Replacing those
    // would corrupt the source.
    const md = [
      '<div>',
      '  <code>$not-a-formula$</code>',
      '  <pre>$also-literal$</pre>',
      '</div>',
    ].join('\n');
    const html = notebook.renderMarkdown(md, { isForPreview: true });
    expect(html).toContain('$not-a-formula$');
    expect(html).toContain('$also-literal$');
    expect(html).not.toContain('class="katex"');
  });

  it('does NOT render math when mathRenderingOption is None', async () => {
    const noMathNotebook = await Notebook.init({
      notebookPath: path.resolve(__dirname, './markdown/test-files'),
      config: {
        markdownParser: 'markdown-it',
        mathRenderingOption: 'None',
      },
    });
    const md = '<table><tr><td>$x^2$</td></tr></table>';
    const html = noMathNotebook.renderMarkdown(md, { isForPreview: true });
    expect(html).toContain('$x^2$');
    expect(html).not.toContain('class="katex"');
  });

  it('leaves an unmatched delimiter alone (no closing `$`)', () => {
    // The reproducer used to explode if the scanner couldn't find
    // a matching close — now it should emit the open delimiter
    // verbatim and move on.
    const md = '<div>cost is $5 to $10 (no math here)</div>';
    const html = notebook.renderMarkdown(md, { isForPreview: true });
    // Either the `$5 to $` pair was matched as math (which would
    // produce KaTeX output and a literal "10..."), or no math
    // happened at all.  Either way the renderer should not crash;
    // we just assert the surrounding HTML survived.
    expect(html).toContain('<div>');
    expect(html).toContain('</div>');
  });

  it('handles inline HTML wrappers around math (already-working path)', () => {
    // `<span>` is parsed as html_inline within a paragraph, so the
    // inline math rule still runs between the open/close tags.  This
    // case worked before the html_block fix; the test guards against
    // regressing it now that we have two math-rendering paths.
    const html = notebook.renderMarkdown('Hello <span>$x^2$</span> world.', {
      isForPreview: true,
    });
    expect(html).toContain('class="katex"');
    expect(html).toContain('<span>');
  });
});
