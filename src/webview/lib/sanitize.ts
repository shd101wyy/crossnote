/**
 * Browser-side HTML sanitization using DOMPurify.
 * Defense-in-depth layer for CVE-2025-65716.
 */

import DOMPurify from 'dompurify';
import { normalizeWavedromSource } from '../../renderers/wavedrom-source';

// Script types used as data containers by diagram renderers (not executable)
const SAFE_SCRIPT_TYPES = new Set(['wavedrom', 'text/tikz']);

/**
 * DOMPurify configured for markdown preview:
 * - Allows most HTML elements needed for rich markdown rendering
 * - Allows iframes (for embeds) but forces sandbox attribute
 * - Preserves non-executable data scripts (e.g., WaveDrom)
 * - Strips executable script tags and on* event handlers
 * - Strips javascript:/vbscript: URLs
 */
const purify = DOMPurify(window);

// Allow iframes but force sandbox; strip executable scripts while keeping data scripts
purify.addHook('uponSanitizeElement', (node, data) => {
  if (data.tagName === 'script') {
    const el = node as Element;
    const scriptType = (el.getAttribute?.('type') || '').toLowerCase().trim();
    if (!SAFE_SCRIPT_TYPES.has(scriptType)) {
      el.parentNode?.removeChild(el);
      return;
    }

    // WaveDrom data scripts are eval'd by the bundled WaveDrom renderer in
    // presentation mode. Normalize the body to inert strict JSON so eval can
    // never execute attacker controlled JavaScript
    // (shd101wyy/vscode-markdown-preview-enhanced#2315).
    if (scriptType === 'wavedrom') {
      const safe = normalizeWavedromSource(el.textContent || '');
      if (safe === null) {
        el.parentNode?.removeChild(el);
      } else {
        el.textContent = safe;
      }
    }
  }
});

purify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'IFRAME') {
    node.setAttribute('sandbox', '');
    node.removeAttribute('srcdoc');
  }
  if (node.tagName === 'use') {
    // <use> may only reference same-document fragments (WaveDrom's only
    // pattern). External references would pull un-sanitized DOM into the
    // page from outside, for no legitimate diagram use.
    const href = node.getAttribute('href');
    const xlinkHref = node.getAttribute('xlink:href');
    if (
      (href !== null && !href.startsWith('#')) ||
      (xlinkHref !== null && !xlinkHref.startsWith('#'))
    ) {
      node.removeAttribute('href');
      node.removeAttributeNS('http://www.w3.org/1999/xlink', 'href');
    }
  }
});

// DOMPurify's built-in URL allowlist, plus `tag:` for Obsidian-style #tag
// anchors emitted by the markdown-it tag plugin.  Without this the href
// gets stripped, the anchor falls through to "no href → skip" in the
// click-binding loop, and clicking a #tag becomes a silent no-op.
const ALLOWED_URI_REGEXP =
  /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|tag):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i;

/** What `sanitizeHtml` sanitizes with. */
const CONFIG = {
  ADD_TAGS: [
    'iframe',
    // SVG style elements used by diagram renderers
    'style',
    // SVG <use> is on DOMPurify's default SVG disallow list, but
    // WaveDrom draws every waveform mark as a <use xlink:href="#...">
    // into the skin's <defs>; without this the waves render as empty
    // space (only the text labels survive). href values still go
    // through ALLOWED_URI_REGEXP, so javascript:/data: targets are
    // stripped.
    'use',
    // Non-executable data scripts (filtered by uponSanitizeElement hook)
    'script',
    // MathML elements used by KaTeX (DOMPurify 3.4.0+ strips these by default)
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
    // MathML attributes used by KaTeX
    'encoding',
    // data-* attributes used by crossnote
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
  ALLOWED_URI_REGEXP,
};

/**
 * Sanitize HTML string for safe DOM insertion.
 */
export function sanitizeHtml(html: string): string {
  return purify.sanitize(html, CONFIG);
}

/**
 * Sanitize the SVG Mermaid drew, for the same insertion.
 *
 * The labels of a diagram are HTML inside `<foreignObject>`. DOMPurify
 * takes that element out unless it is allowed, and the HTML in it unless
 * the element counts as an HTML integration point: it is one to a browser,
 * and is not one to DOMPurify by default (`annotation-xml` is the only
 * one). Both are said here, and the label then goes through the rules
 * every other HTML of the page goes through. A diagram Mermaid draws at
 * its default security level comes out as it went in. At
 * `securityLevel: 'loose'` Mermaid writes the address of a `click` as it
 * was given, and an `onclick` of its own for the popups of a sequence
 * diagram: a `javascript:` address is taken out, and so is the `onclick`.
 */
export function sanitizeMermaidSvg(svg: string): string {
  return purify.sanitize(svg, {
    ...CONFIG,
    ADD_TAGS: [...CONFIG.ADD_TAGS, 'foreignObject'],
    // The integration points are given as a whole: the default one stays.
    HTML_INTEGRATION_POINTS: { 'annotation-xml': true, 'foreignobject': true },
  });
}
