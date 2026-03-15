/**
 * Browser-side HTML sanitization using DOMPurify.
 * Defense-in-depth layer for CVE-2025-65716.
 */

import DOMPurify from 'dompurify';

/**
 * DOMPurify configured for markdown preview:
 * - Allows most HTML elements needed for rich markdown rendering
 * - Allows iframes (for embeds) but forces sandbox attribute
 * - Strips all script tags and on* event handlers
 * - Strips javascript:/vbscript: URLs
 */
const purify = DOMPurify(window);

// Allow iframes (used for video embeds, etc.) but force sandbox
purify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'IFRAME') {
    node.setAttribute('sandbox', '');
    node.removeAttribute('srcdoc');
  }
});

/**
 * Sanitize HTML string for safe DOM insertion.
 */
export function sanitizeHtml(html: string): string {
  return purify.sanitize(html, {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: [
      'sandbox',
      'allow',
      'allowfullscreen',
      'frameborder',
      'scrolling',
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
  });
}
