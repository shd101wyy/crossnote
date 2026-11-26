/**
 * URL-scheme rules shared by the server-side HTML sanitizer
 * (`src/markdown-engine/sanitize.ts`) and the WaveDrom data sanitizer
 * (`src/renderers/wavedrom-source.ts`).
 */

/**
 * Whitespace and control characters, wherever they are in an address. They
 * are left out before the scheme is read: a browser leaves out a tab or a
 * newline in the middle of a scheme, and a control character or a space at
 * either end, so that an address written `java<TAB>script:` runs as
 * `javascript:`.
 */
// eslint-disable-next-line no-control-regex -- the control characters are what is matched for
const LEFT_OUT_OF_AN_ADDRESS = /[\u0000-\u0020\s]/g;

/** URL schemes that must never survive sanitization. */
const DANGEROUS_URL_PATTERN = /^(javascript|vbscript):|^data:text\/html/i;

/** Attributes whose string values are URLs and must be scheme-checked. */
export const URL_ATTRIBUTES = [
  'href',
  'src',
  'action',
  'formaction',
  'xlink:href',
  // reveal.js loads it in an iframe of its own making
  'data-background-iframe',
];

/** True if a URL value uses a scheme that can execute script. */
export function isDangerousUrl(value: string): boolean {
  return DANGEROUS_URL_PATTERN.test(value.replace(LEFT_OUT_OF_AN_ADDRESS, ''));
}
