/**
 * Tests for the browser-side DOMPurify sanitizer (src/webview/lib/sanitize.ts).
 *
 * Uses jsdom to simulate the browser environment that DOMPurify requires.
 * Verifies that KaTeX MathML output survives sanitization intact.
 *
 * @jest-environment jsdom
 */

import katex from 'katex';
import DOMPurify from 'dompurify';

// The real browser-side sanitizer. It runs `DOMPurify(window)` at import
// time, which resolves against this test file's jsdom environment — so the
// tests exercise the actual shipped config instead of a copy that can drift
// (a replicated ADD_TAGS once missed `use` and hid the WaveDrom regression).
import { sanitizeHtml } from '../src/webview/lib/sanitize';

/**
 * Normalize cosmetic differences that DOMPurify introduces but don't affect
 * rendering: self-closing SVG tags (<path .../> → <path ...></path>) and
 * trailing space → &nbsp; in <mtext>.
 */
function normalize(html: string): string {
  return html
    .replace(
      /<(path|line|circle|rect|use|polygon|polyline)\b([^>]*?)\s*\/>/g,
      '<$1$2></$1>',
    )
    .replace(/(<mtext>[^<]*?) (<\/mtext>)/g, '$1&nbsp;$2');
}

describe('DOMPurify sanitizeHtml (client-side)', () => {
  const sanitize = sanitizeHtml;

  describe('KaTeX MathML preservation', () => {
    it('preserves inline KaTeX output', () => {
      const html = katex.renderToString('x = \\frac{1}{2}');
      const result = sanitize(html);

      expect(result).toContain('<semantics>');
      expect(result).toContain('<annotation');
      expect(result).toContain('encoding="application/x-tex"');
      expect(result).toContain('x = \\frac{1}{2}');
      expect(normalize(result)).toBe(normalize(html));
    });

    it('preserves display-mode KaTeX output', () => {
      const html = katex.renderToString('E = mc^2', { displayMode: true });
      const result = sanitize(html);

      expect(result).toContain('<semantics>');
      expect(result).toContain('<annotation');
      expect(result).toContain('display="block"');
      expect(normalize(result)).toBe(normalize(html));
    });

    it('preserves complex KaTeX expressions (integrals, sqrt)', () => {
      const html = katex.renderToString(
        '\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}',
        { displayMode: true },
      );
      const result = sanitize(html);

      expect(result).toContain('<semantics>');
      expect(result).toContain('<msubsup>');
      expect(result).toContain('<msqrt>');
      expect(normalize(result)).toBe(normalize(html));
    });

    it('preserves KaTeX matrix output', () => {
      const html = katex.renderToString(
        '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}',
        { displayMode: true },
      );
      const result = sanitize(html);

      expect(result).toContain('<mtable');
      expect(result).toContain('columnalign');
      expect(normalize(result)).toBe(normalize(html));
    });

    it('preserves KaTeX aligned environment', () => {
      const html = katex.renderToString(
        '\\begin{aligned} x &= 1 \\\\ y &= 2 \\end{aligned}',
        { displayMode: true },
      );
      const result = sanitize(html);

      expect(result).toContain('<mtable');
      expect(result).toContain('<mtr>');
      expect(result).toContain('<mtd>');
      expect(normalize(result)).toBe(normalize(html));
    });

    it('preserves all MathML attributes used by KaTeX', () => {
      // This expression uses many MathML attributes: mathvariant, displaystyle, etc.
      const html = katex.renderToString(
        '\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1',
        { displayMode: true },
      );
      const result = sanitize(html);
      expect(normalize(result)).toBe(normalize(html));
    });

    it('does not leak raw LaTeX text from annotation', () => {
      // The key bug: DOMPurify 3.4.0 stripped <semantics> and <annotation>,
      // causing the raw LaTeX text inside <annotation> to leak into the visible
      // output as a text node inside <math>.
      const html = katex.renderToString('\\alpha + \\beta', {
        displayMode: true,
      });
      const result = sanitize(html);

      // The annotation text should be inside <annotation>, not loose in <math>
      expect(result).toContain(
        '<annotation encoding="application/x-tex">\\alpha + \\beta</annotation>',
      );
      // The raw LaTeX should NOT appear outside of annotation
      const withoutAnnotation = result.replace(
        /<annotation[^>]*>.*?<\/annotation>/g,
        '',
      );
      expect(withoutAnnotation).not.toContain('\\alpha + \\beta');
    });
  });

  describe('security (still strips dangerous content)', () => {
    it('strips script tags', () => {
      const result = sanitize('<p>safe</p><script>alert("xss")</script>');
      expect(result).toContain('safe');
      expect(result).not.toContain('alert');
    });

    it('strips on* event handlers', () => {
      const result = sanitize('<img src="x" onerror="alert(1)">');
      expect(result).not.toContain('onerror');
    });

    it('preserves WaveDrom data scripts within body content', () => {
      const result = sanitize(
        '<div>before</div><script type="WaveDrom">{"signal":[]}</script><div>after</div>',
      );
      expect(result).toContain('WaveDrom');
    });

    it('preserves TikZ data scripts within body content', () => {
      const result = sanitize(
        '<div>before</div><script type="text/tikz">\\draw (0,0) -- (1,1);</script><div>after</div>',
      );
      expect(result).toContain('text/tikz');
    });

    it('sandboxes iframes', () => {
      const result = sanitize('<iframe src="https://example.com"></iframe>');
      expect(result).toContain('sandbox=""');
    });
  });

  describe('tag:// scheme preservation', () => {
    it('preserves href="tag://name" on tag anchors', () => {
      // Defense-in-depth: even if the href is stripped, the click handler
      // falls back to data-tag, but having href intact lets right-click
      // "Copy Link" produce something meaningful and is the natural form.
      const input =
        '<a class="tag" data-tag="readme" href="tag://readme">#readme</a>';
      const result = sanitize(input);
      expect(result).toContain('href="tag://readme"');
      expect(result).toContain('data-tag="readme"');
      expect(result).toContain('class="tag"');
    });

    it('preserves percent-encoded tag href for nested tags', () => {
      const input =
        '<a class="tag" data-tag="parent/child" href="tag://parent%2Fchild">#parent/child</a>';
      const result = sanitize(input);
      expect(result).toContain('href="tag://parent%2Fchild"');
      expect(result).toContain('data-tag="parent/child"');
    });

    it('does NOT preserve other unknown schemes', () => {
      // Sanity check that we're not weakening the URL allowlist beyond
      // adding tag:.
      const input = '<a href="javascript:alert(1)">x</a>';
      const result = sanitize(input);
      expect(result).not.toContain('javascript:');
    });
  });

  describe('regression: DOMPurify 3.4.0 without ADD_TAGS strips MathML', () => {
    it('would strip semantics/annotation without our config', () => {
      const purify = DOMPurify(window);
      // Sanitize without our custom ADD_TAGS
      const html = katex.renderToString('x^2');
      const stripped = purify.sanitize(html);

      // Without ADD_TAGS, DOMPurify 3.4.0 strips <semantics> and <annotation>
      expect(stripped).not.toContain('<semantics>');
      expect(stripped).not.toContain('<annotation');

      // But our configured sanitizer preserves them
      const preserved = sanitize(html);
      expect(preserved).toContain('<semantics>');
      expect(preserved).toContain('<annotation');
    });
  });

  describe('regression: DOMPurify strips SVG <use>, emptying WaveDrom diagrams (#518 follow-up)', () => {
    // WaveDrom draws every waveform mark as a <use xlink:href="#..."> into
    // the skin's <defs>. The post-render sanitize pass added in #518 fed
    // the rendered SVG through sanitizeHtml, whose DOMPurify config still
    // had <use> on the default SVG disallow list — the waves disappeared
    // and only the text labels were left (vscode-mpe#2463).
    const renderedWavedrom =
      '<svg xmlns="http://www.w3.org/2000/svg" ' +
      'xmlns:xlink="http://www.w3.org/1999/xlink" class="WaveDrom">' +
      '<defs><g id="wa"><path d="M0,0 h8 v12 h-8 z"/></g></defs>' +
      '<g><use xlink:href="#wa" transform="translate(0,10)"></use>' +
      '<use xlink:href="#wa" transform="translate(0,20)"></use>' +
      '<text>clk</text></g></svg>';

    it('would strip <use> without our config', () => {
      const purify = DOMPurify(window);
      expect(purify.sanitize(renderedWavedrom)).not.toContain('<use');
    });

    it('keeps <use> marks with fragment hrefs', () => {
      const result = sanitize(renderedWavedrom);
      expect(result.match(/<use/g)?.length).toBe(2);
      expect(result).toContain('xlink:href="#wa"');
      // The referenced skin definition survives too.
      expect(result).toContain('<g id="wa">');
    });

    it('still strips dangerous <use> hrefs', () => {
      const result = sanitize(
        '<svg xmlns="http://www.w3.org/2000/svg">' +
          '<use xlink:href="javascript:alert(1)"></use>' +
          '<use href="data:text/html,<script>"></use>' +
          '<use href="data:image/svg+xml;base64,PHN2Zz4="></use></svg>',
      );
      expect(result).not.toContain('javascript:');
      expect(result).not.toContain('data:text/html');
      expect(result).not.toContain('data:image/svg+xml');
    });

    it('strips external <use> references, keeping fragments only', () => {
      const result = sanitize(
        '<svg xmlns="http://www.w3.org/2000/svg" ' +
          'xmlns:xlink="http://www.w3.org/1999/xlink">' +
          '<use xlink:href="//evil.com/x.svg#y"></use>' +
          '<use href="https://evil.com/x.svg#y"></use>' +
          '<use xlink:href="#skin"></use></svg>',
      );
      expect(result).not.toContain('evil.com');
      expect(result).toContain('xlink:href="#skin"');
    });
  });
});
