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

describe('Math rendering with MathJax', () => {
  let notebook: Notebook;

  beforeAll(async () => {
    notebook = await Notebook.init({
      notebookPath: path.resolve(__dirname, './markdown/test-files'),
      config: {
        markdownParser: 'markdown-it',
        mathRenderingOption: 'MathJax',
      },
    });
  });

  it('emits a `mathjax-exps` span for inline math in a paragraph', () => {
    // Sanity check that MathJax mode goes through the same parseMath
    // helper that the html_block path also uses.  MathJax is
    // client-side rendered, so the server output is just a
    // placeholder span/div the client-side script picks up later.
    const html = notebook.renderMarkdown('Energy is $E=mc^2$ here.', {
      isForPreview: true,
    });
    expect(html).toContain('mathjax-exps');
    expect(html).toContain('<span class="mathjax-exps">');
  });

  it('emits a `mathjax-exps` div for block math inside an HTML block', () => {
    // The vscode-mpe#2280 fix should produce MathJax placeholders
    // (not KaTeX HTML) when the renderer is configured for MathJax.
    // Note: MathJax placeholders intentionally KEEP the `$$…$$`
    // delimiters in their inner text — that's how the client-side
    // MathJax script discovers and renders the formula.
    const md = ['<div class="proof">', '$$', 'E = mc^2', '$$', '</div>'].join(
      '\n',
    );
    const html = notebook.renderMarkdown(md, { isForPreview: true });
    // Block math in display mode → div, not span.
    expect(html).toMatch(/<div class="mathjax-exps">/);
    // The placeholder div wraps the original (escaped) source — the
    // outer `<div class="proof">` remains around it.  Confirms the
    // post-process didn't drop or duplicate the wrapper HTML.
    expect(html).toContain('class="proof"');
    // Newlines inside the formula get collapsed to spaces (per
    // parseMath).  Confirms the placeholder's inner text contains
    // the formula body.
    expect(html).toMatch(/E = mc\^2/);
  });

  it('emits `mathjax-exps` spans for inline math inside an HTML <table>', () => {
    // Same vscode-mpe#2280 reproducer, MathJax mode this time.
    const md = [
      '<table>',
      '    <tr>',
      '        <td>$a^2+b^2=c^2$</td>',
      '    </tr>',
      '</table>',
    ].join('\n');
    const html = notebook.renderMarkdown(md, { isForPreview: true });
    // Span (inline) not div (block) — `$…$` is the inline form.
    expect(html).toMatch(/<span class="mathjax-exps">/);
    // The original `<td>$a^2+b^2=c^2$</td>` got rewritten into
    // `<td><span class="mathjax-exps">$a^2+b^2=c^2$</span></td>`.
    // The delimiters STAY in the placeholder because MathJax reads
    // them client-side; assert that shape directly.
    expect(html).toMatch(
      /<td><span class="mathjax-exps">\$a\^2\+b\^2=c\^2\$<\/span><\/td>/,
    );
    expect(html).toContain('<table>');
  });
});

describe('Math rendering with custom delimiters', () => {
  // The fix iterates `mathBlockDelimiters` / `mathInlineDelimiters`
  // from notebook config (same source the inline rule reads), so
  // any user-configured delimiter pair should work — not just the
  // default `$…$` / `$$…$$`.  Spot-check `\(…\)` (inline) and
  // `\[…\]` (block) since they're the other shape Pandoc / LaTeX
  // users commonly configure.
  let notebook: Notebook;

  beforeAll(async () => {
    notebook = await Notebook.init({
      notebookPath: path.resolve(__dirname, './markdown/test-files'),
      config: {
        markdownParser: 'markdown-it',
        mathInlineDelimiters: [['\\(', '\\)']],
        mathBlockDelimiters: [['\\[', '\\]']],
      },
    });
  });

  it('renders `\\(…\\)` inline math inside an HTML <table>', () => {
    const md = [
      '<table>',
      '    <tr>',
      '        <td>\\(a^2+b^2=c^2\\)</td>',
      '    </tr>',
      '</table>',
    ].join('\n');
    const html = notebook.renderMarkdown(md, { isForPreview: true });
    expect(html).toContain('class="katex"');
    expect(html).not.toContain('\\(a^2+b^2=c^2\\)');
    // Inline mode → no display wrapper.
    expect(html).not.toContain('katex-display');
  });

  it('renders `\\[…\\]` block math inside an HTML <div>', () => {
    const md = ['<div>', '\\[', 'E = mc^2', '\\]', '</div>'].join('\n');
    const html = notebook.renderMarkdown(md, { isForPreview: true });
    expect(html).toContain('katex-display');
    expect(html).not.toContain('\\[\nE = mc^2\n\\]');
  });

  it('does NOT match the default `$…$` when custom delimiters are configured', () => {
    // If the config only declares `\(…\)` / `\[…\]`, a literal `$x$`
    // in HTML should pass through verbatim — the custom-delimiter
    // path shouldn't accidentally fall back to defaults.
    const md = '<div>price: $5 to $10</div>';
    const html = notebook.renderMarkdown(md, { isForPreview: true });
    expect(html).toContain('$5 to $10');
    expect(html).not.toContain('class="katex"');
  });
});
