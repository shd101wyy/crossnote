/**
 * URL-scheme rules shared by the server-side HTML sanitizer
 * (`src/markdown-engine/sanitize.ts`) and the WaveDrom data sanitizer
 * (`src/renderers/wavedrom-source.ts`).
 */

/** URL schemes that must never survive sanitization. */
export const DANGEROUS_URL_PATTERN =
  /^\s*(javascript|vbscript)\s*:|^\s*data\s*:\s*text\/html/i;

/** Attributes whose string values are URLs and must be scheme-checked. */
export const URL_ATTRIBUTES = [
  'href',
  'src',
  'action',
  'formaction',
  'xlink:href',
];

/** True if a URL value uses a scheme that can execute script. */
export function isDangerousUrl(value: string): boolean {
  return DANGEROUS_URL_PATTERN.test(value);
}
