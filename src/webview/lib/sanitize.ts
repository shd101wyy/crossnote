/**
 * Browser-side HTML sanitization using DOMPurify.
 * Defense-in-depth layer for CVE-2025-65716.
 */

import DOMPurify from 'dompurify';

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
    }
  }
});

purify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'IFRAME') {
    node.setAttribute('sandbox', '');
    node.removeAttribute('srcdoc');
  }
});

// DOMPurify's built-in URL allowlist, plus `tag:` for Obsidian-style #tag
// anchors emitted by the markdown-it tag plugin.  Without this the href
// gets stripped, the anchor falls through to "no href → skip" in the
// click-binding loop, and clicking a #tag becomes a silent no-op.
const ALLOWED_URI_REGEXP =
  /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|tag):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i;

/**
 * Sanitize HTML string for safe DOM insertion.
 */
export function sanitizeHtml(html: string): string {
  return purify.sanitize(html, {
    ADD_TAGS: [
      'iframe',
      // SVG style elements used by diagram renderers
      'style',
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
  });
}
