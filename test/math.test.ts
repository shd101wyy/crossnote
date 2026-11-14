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
import { isDollarMathSpan } from '../src/custom-markdown-it-features/math';
import { buildMathJaxConfigScript } from '../src/markdown-engine/mathjax-config';
import { Notebook } from '../src/notebook/index';
import { getDefaultMathjaxConfig } from '../src/notebook/types';

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

  it('renders multi-line `$$` block with `=` on its own line via block rule (KaTeX)', () => {
    // The block-level `math_block` rule should also work when KaTeX
    // is the renderer — it must prevent Setext heading splitting
    // and let KaTeX render the math.
    const md = [
      '$$',
      '\\begin{pmatrix}',
      'a & b \\\\',
      'c & d',
      '\\end{pmatrix}',
      '=',
      '\\begin{pmatrix}',
      'e & f \\\\',
      'g & h',
      '\\end{pmatrix}',
      '$$',
    ].join('\n');
    const html = notebook.renderMarkdown(md, { isForPreview: true });
    expect(html).toContain('class="katex-display"');
    expect(html).not.toContain('pmatrix="true"');
    expect(html).not.toContain('<h1');
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
    // The currency rule leaves both dollar signs as text, and the
    // surrounding HTML survives.
    expect(html).toContain('<div>');
    expect(html).toContain('</div>');
    expect(html).not.toContain('class="katex"');
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

// Regression: currency dollar signs.  The `$…$` inline rule used to pair
// any two dollar signs in a paragraph, so "R$ 10 … R$11" rendered the text
// between them as a formula.  A `$` glued to a letter or digit, or followed
// by an amount, no longer delimits math — `$5$` alone still does.
describe('Currency dollar signs', () => {
  let notebook: Notebook;

  beforeAll(async () => {
    notebook = await Notebook.init({
      notebookPath: path.resolve(__dirname, './markdown/test-files'),
      config: { markdownParser: 'markdown-it' },
    });
  });

  const render = (md: string) =>
    notebook.renderMarkdown(md, { isForPreview: true });

  it.each([
    ['a space after the sign', 'depositei R$ 10 mas entrou R$11', 'R$11'],
    ['U$ amounts', 'custa U$ 1 mas no sistema mostra U$2', 'U$2'],
    ['bare $ amounts', 'de $5 a $10', '$10'],
    [
      'R$ as a unit label',
      'AMOUNT_CHARGED (R$), AMOUNT_PAID (R$, net of FEE_TOTAL)',
      'AMOUNT_PAID (R$, net',
    ],
    [
      'a bare amount closed by US$',
      '"120 VPUs at $0.204" … linear em US$ 0,0017',
      'US$ 0,0017',
    ],
    [
      'amounts around inline code',
      'acima de R$10.000 (`LIMIT_CENTS = 1.000.000`) … de R$ 9.999',
      'R$ 9.999',
    ],
    ['a non-breaking space', 'R$\u00a010 e R$\u00a020', 'R$\u00a020'],
    ['a soft line break', 'R$ 10\ne R$ 20', 'R$ 20'],
    // Each of the next three is decided by one part of the rule alone.
    ['an amount opener', 'custa $5 hoje (antes em R$)', '(antes em R$)'],
    ['shell variables', 'use $HOME ou $PATH', '$PATH'],
    ['a closer before an amount', 'defina $HOME; custa US$ 5', 'US$ 5'],
    [
      'an HTML table',
      '<table><tr><td>R$ 10</td><td>R$ 20</td></tr></table>',
      '<td>R$ 20</td>',
    ],
  ])('keeps currency as text: %s', (_name, md, kept) => {
    const html = render(md);
    expect(html).not.toContain('class="katex"');
    expect(html).toContain(kept);
  });

  it.each([
    ['a formula', 'Energy is $E=mc^2$ here.'],
    ['a number alone', 'the number $5$ is math'],
    ['a decimal alone', 'and $3.14$ too'],
    ['`$$…$$` inline', 'display $$x$$ math'],
    // Formulas that start with a digit are not amounts.
    ['a leading coefficient', 'solve $2x$ first'],
    ['an equation', 'we know $1+1=2$ here'],
    ['a power', 'the set has $2^n$ elements'],
    ['a negative exponent', 'error below $10^{-3}$ here'],
    ['an inequality', 'for $0 \\le x \\le 1$ we have'],
    ['a fraction', 'half is $1/2$.'],
    ['a degree sign', 'rotate $90^\\circ$ now'],
    // A `$` glued to a word still opens a sub- or superscript…
    ['a chemical formula', 'water is H$_2$O'],
    ['a unit', '750 pc cm$^{-3}$ with'],
    ['a glued power', 'that is 2$^{10}$ bytes'],
    // …and a closer may be followed by a word.
    ['an ordinal', 'the $i$th row'],
    ['a plural', 'all $x$s'],
  ])('still renders math: %s', (_name, md) => {
    expect(render(md)).toContain('class="katex"');
  });

  it('pairs two formulas that start with a digit correctly', () => {
    const html = render('$2(a+b)$, then $(c)$');
    expect(html.split('class="katex"').length - 1).toBe(2);
    expect(html).not.toContain('$');
  });

  it('treats `$ x $` (spaces inside) as text, as Pandoc does', () => {
    expect(render('so $ x $ is text')).not.toContain('class="katex"');
  });

  it('renders the formula and keeps the price in the same paragraph', () => {
    const html = render('$x$ custa R$ 10');
    expect(html).toContain('class="katex"');
    expect(html).toContain('R$ 10');
  });

  it('keeps an escaped `\\$` as text next to a formula', () => {
    const html = render('R\\$ 10 e $x$');
    expect(html).toContain('class="katex"');
    expect(html).toContain('R$ 10');
  });

  // The first `$` of `src` opens and the next one closes.
  const span = (src: string) => {
    const open = src.indexOf('$');
    return isDollarMathSpan(src, open, src.indexOf('$', open + 1));
  };

  it.each<[string, boolean]>([
    ['$x$', true],
    ['$2x$', true],
    ['H$_2$O', true],
    ['$i$th', true],
    ['R$ 10 e R$ 20', false],
    ['$5 a $10', false],
    ['$ x $', false],
    // A letter outside the BMP is two UTF-16 code units.
    ['\u{1D445}$ abc \u{1D445}$, ok', false],
    // A letter with a decomposed (combining) accent.
    ['cafe\u0301$x$', false],
  ])('isDollarMathSpan(%j) is %s', (src, expected) => {
    expect(span(src)).toBe(expected);
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

  it('emits no placeholder for currency dollar signs', () => {
    const html = notebook.renderMarkdown('depositei R$ 10 mas entrou R$11', {
      isForPreview: true,
    });
    expect(html).not.toContain('mathjax-exps');
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

  it('renders multi-line `$$` block with `=` on its own line (matrix with Setext-safe block rule)', () => {
    // The block-level `math_block` rule (inserted before
    // markdown-it's `lheading` Setext parser) must prevent the `=`
    // from splitting the `$$…$$` block into an `<h1>` heading +
    // dangling paragraph.
    const md = [
      '$$',
      '\\begin{pmatrix}',
      'a & b \\\\',
      'c & d',
      '\\end{pmatrix}',
      '=',
      '\\begin{pmatrix}',
      'e & f \\\\',
      'g & h',
      '\\end{pmatrix}',
      '$$',
    ].join('\n');
    const html = notebook.renderMarkdown(md, { isForPreview: true });
    // Must be a single mathjax-exps div, not split by Setext
    // heading parsing.
    expect(html).toMatch(/<div class="mathjax-exps">/);
    expect(html).not.toContain('pmatrix="true"');
    // The content — including `=` — is preserved inside the
    // placeholder.
    expect(html).toMatch(
      /\\begin\{pmatrix\}.*\\end\{pmatrix\} = \\begin\{pmatrix\}/s,
    );
  });

  it('renders multi-line `$$` block without `=` (no regression)', () => {
    // A plain multiline `$$…$$` should still produce a single
    // mathjax-exps div.  The block rule handles this as a normal
    // path.
    const md = [
      '$$',
      '\\int_{-\\infty}^{\\infty}',
      'e^{-x^2} \\, dx = \\sqrt{\\pi}',
      '$$',
    ].join('\n');
    const html = notebook.renderMarkdown(md, { isForPreview: true });
    expect(html).toMatch(/<div class="mathjax-exps">/);
    expect(html).not.toContain('<h1');
    expect(html).toContain('\\int');
  });

  it('preserves `$$` delimiters in block math inside an HTML <td> with MathJax', () => {
    // Regression: vscode-mpe#2302 — the html_block post-process
    // was replacing `$$…$$` with a MathJax placeholder that the
    // inline `$` scanner subsequently re-scanned and stripped the
    // `$$` delimiters from, because `$$` starts with `$`.  The
    // placeholder must include the original delimiters so client-
    // side MathJax can discover and typeset the formula.
    const md = [
      '<table>',
      '<tr><td>',
      '$$',
      '\\textcolor{red}{hello}',
      '$$',
      '</td></tr>',
      '</table>',
    ].join('\n');
    const html = notebook.renderMarkdown(md, { isForPreview: true });
    expect(html).toMatch(/<div class="mathjax-exps">/);
    expect(html).toContain('$$\\textcolor{red}{hello}$$');
    expect(html).not.toContain('class="mathjax-exps">\\textcolor');
    expect(html).toContain('<table>');
  });

  it('preserves inline `$…$` when a `$$` block starts on the next line', () => {
    // Inline math must still work even when a block-math delimiter
    // appears on a separate line.  The block rule consumes `$$`
    // starting a line; the inline rule handles `$…$` within a
    // paragraph.
    const md = ['Some text $x^2$ here.', '', '$$', 'E = mc^2', '$$'].join('\n');
    const html = notebook.renderMarkdown(md, { isForPreview: true });
    expect(html).toContain('<span class="mathjax-exps">');
    expect(html).toContain('<div class="mathjax-exps">');
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

describe('MathJax config defaults', () => {
  it('disables a11y semantic enrichment for performance (#2312)', () => {
    // Enrichment (speech-rule-engine) is ~95% of MathJax 4's per-formula
    // typeset cost; disabling it restores MathJax-3-like preview performance.
    const config = getDefaultMathjaxConfig();
    const options = config.options as Record<string, unknown>;
    expect(options.enableEnrichment).toBe(false);
  });

  it('preserves tex and loader config sections', () => {
    const config = getDefaultMathjaxConfig();
    expect(config.tex).toEqual({});
    expect(config.loader).toEqual({});
  });

  it('is a pure object (no shared mutable references)', () => {
    const a = getDefaultMathjaxConfig();
    const b = getDefaultMathjaxConfig();
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });
});

describe('buildMathJaxConfigScript (#2312 enrichment override)', () => {
  it('serializes the config onto window.MathJax', () => {
    const script = buildMathJaxConfigScript(getDefaultMathjaxConfig());
    expect(script).toContain('window.MathJax = (');
    expect(script).toContain('"enableEnrichment":false');
  });

  it('wraps startup.ready to re-apply a11y toggles onto the live document', () => {
    const script = buildMathJaxConfigScript(getDefaultMathjaxConfig());
    // The ready hook must run the default startup and then copy the
    // configured a11y options onto the built MathDocument (where they
    // actually take effect — MathJax ignores them in the config block).
    expect(script).toContain('cfg.startup.ready = function');
    expect(script).toContain('defaultReady()');
    expect(script).toContain('doc.options[keys[i]] = wanted[keys[i]]');
    expect(script).toContain('enableEnrichment');
  });

  it('preserves a user-provided ready hook', () => {
    const script = buildMathJaxConfigScript({ options: {} });
    expect(script).toContain("typeof userReady === 'function'");
    expect(script).toContain('userReady()');
  });

  it('produces a syntactically valid script', () => {
    const script = buildMathJaxConfigScript(getDefaultMathjaxConfig());
    // Wrap so the bare `window.MathJax = (...)` assignment parses.
    expect(() => new Function('window', script)).not.toThrow();
  });
});
