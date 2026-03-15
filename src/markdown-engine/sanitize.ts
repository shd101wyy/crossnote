/**
 * HTML sanitization for rendered markdown output.
 *
 * Addresses CVE-2025-65716: Prevents arbitrary JavaScript execution
 * through malicious HTML in markdown files (e.g., iframes with onload
 * handlers, script tags, javascript: URLs).
 */

const DANGEROUS_URL_PATTERN =
  /^\s*(javascript|vbscript)\s*:|^\s*data\s*:\s*text\/html/i;

const DANGEROUS_TAGS = ['object', 'embed', 'applet'];

// Script types that are used as data containers (not executable by browsers)
const SAFE_SCRIPT_TYPES = new Set(['wavedrom']);

const URL_ATTRIBUTES = ['href', 'src', 'action', 'formaction', 'xlink:href'];

/**
 * Sanitize rendered HTML in-place using a cheerio instance.
 *
 * This strips dangerous elements and attributes while preserving
 * safe HTML content needed for markdown preview rendering.
 *
 * Must be called after all render enhancements are applied and
 * before extracting the final HTML string.
 */
export function sanitizeRenderedHTML($: CheerioStatic): void {
  // Remove dangerous non-script tags entirely
  $(DANGEROUS_TAGS.join(', ')).remove();

  // Remove script tags, but preserve non-executable data scripts
  // (e.g., <script type="WaveDrom"> used by wavedrom diagrams)
  $('script').each((_, el: CheerioElement) => {
    const scriptType = (el.attribs?.type || '').toLowerCase().trim();
    if (!SAFE_SCRIPT_TYPES.has(scriptType)) {
      $(el).remove();
    }
  });

  // Process all elements for dangerous attributes
  $('*').each((_, el: CheerioElement) => {
    const attribs = el.attribs;
    if (!attribs) {
      return;
    }

    for (const attr of Object.keys(attribs)) {
      // Strip all on* event handler attributes (onload, onerror, onclick, etc.)
      if (/^on/i.test(attr)) {
        delete attribs[attr];
        continue;
      }

      // Strip dangerous URL schemes from URL-bearing attributes
      if (
        URL_ATTRIBUTES.includes(attr.toLowerCase()) &&
        DANGEROUS_URL_PATTERN.test(attribs[attr])
      ) {
        delete attribs[attr];
      }
    }
  });

  // Sandbox all iframes and remove srcdoc (which can contain arbitrary HTML)
  $('iframe').each((_, el: CheerioElement) => {
    const attribs = el.attribs;
    if (!attribs) {
      return;
    }
    // Empty sandbox = maximum restrictions (no scripts, no forms, no popups, etc.)
    attribs['sandbox'] = '';
    delete attribs['srcdoc'];
  });
}
