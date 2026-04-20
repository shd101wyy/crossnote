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

// Re-implement the sanitizer here using the same config as src/webview/lib/sanitize.ts
// so we can test it in a real DOM environment (jsdom via @jest-environment).
function createSanitizer() {
  const purify = DOMPurify(window);

  const SAFE_SCRIPT_TYPES = new Set(['wavedrom', 'text/tikz']);

  purify.addHook(
    'uponSanitizeElement',
    (node: Node, data: { tagName: string }) => {
      if (data.tagName === 'script') {
        const el = node as Element;
        const scriptType = (el.getAttribute?.('type') || '')
          .toLowerCase()
          .trim();
        if (!SAFE_SCRIPT_TYPES.has(scriptType)) {
          el.parentNode?.removeChild(el);
        }
      }
    },
  );

  purify.addHook('afterSanitizeAttributes', (node: Element) => {
    if (node.tagName === 'IFRAME') {
      node.setAttribute('sandbox', '');
      node.removeAttribute('srcdoc');
    }
  });

  return (html: string): string =>
    purify.sanitize(html, {
      ADD_TAGS: [
        'iframe',
        'style',
        'script',
        'semantics',
        'annotation',
        'annotation-xml',
      ],
      ADD_ATTR: [
        'sandbox',
        'allow',
        'allowfullscreen',
        'frameborder',
        'scrolling',
        'encoding',
        'data-source-line',
        'data-source-lines',
        'data-id',
        'data-cmd',
        'data-code',
        'data-processed',
        'data-widget-name',
        'data-widget-src',
        'data-widget-attributes',
        'data-background-image',
        'data-background-iframe',
      ],
      ALLOW_DATA_ATTR: true,
    });
}

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
  const sanitize = createSanitizer();

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
});
