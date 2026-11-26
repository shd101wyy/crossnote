/**
 * HTML sanitization for rendered markdown output.
 *
 * Addresses CVE-2025-65716: Prevents arbitrary JavaScript execution
 * through malicious HTML in markdown files (e.g., iframes with onload
 * handlers, script tags, javascript: URLs).
 */

import * as cheerio from 'cheerio';
import type { CheerioAPI } from 'cheerio';
import type { AnyNode, Element } from 'domhandler';
import { normalizeWavedromSource } from '../renderers/wavedrom-source';
import { isDangerousUrl, URL_ATTRIBUTES } from '../lib/dangerous-urls';

const DANGEROUS_TAGS = ['object', 'embed', 'applet'];

// Script types that are used as data containers (not executable by browsers)
const SAFE_SCRIPT_TYPES = new Set(['wavedrom', 'text/tikz']);

// The attribute whose value is HTML, which a script of the page writes into
// the page again as such: reveal.js writes the speaker notes of a slide and
// of a fragment of it — `data-notes` on the section and on the element —
// into the window of its speaker view. Which elements it takes them from is
// its own to decide (a class it looks for, one it gives an element itself),
// so the value is read as the HTML it is on every element that has it.
const HTML_ATTRIBUTES = new Set(['data-notes']);

/**
 * Sanitize rendered HTML in-place using a cheerio instance.
 *
 * This strips dangerous elements and attributes while preserving
 * safe HTML content needed for markdown preview rendering.
 *
 * Must be called after all render enhancements are applied and
 * before extracting the final HTML string.
 */
export function sanitizeRenderedHTML($: CheerioAPI): void {
  sanitize($, true);
}

/**
 * `notesAreHTML`: whether an attribute of speaker notes in the page is the
 * HTML of notes. It is not within notes: nothing writes an attribute of an
 * element inside the notes into the page again, so there it is only an
 * attribute, and notes within notes are not read again and again.
 */
function sanitize($: CheerioAPI, notesAreHTML: boolean): void {
  // Remove dangerous non-script tags entirely
  $(DANGEROUS_TAGS.join(', ')).remove();

  // Remove script tags, but preserve non-executable data scripts
  // (e.g., <script type="WaveDrom"> used by wavedrom diagrams)
  $('script').each((_, el: Element) => {
    const scriptType = (el.attribs?.type || '').toLowerCase().trim();
    if (!SAFE_SCRIPT_TYPES.has(scriptType)) {
      $(el).remove();
      return;
    }

    // WaveDrom data scripts are eval'd by the bundled WaveDrom renderer
    // (ProcessAll/eva) in presentation mode and HTML export. Normalize the
    // body to inert strict JSON so that eval can never execute attacker
    // controlled JavaScript (shd101wyy/vscode-markdown-preview-enhanced#2315).
    if (scriptType === 'wavedrom') {
      const safe = normalizeWavedromSource($(el).text());
      if (safe === null) {
        $(el).remove();
      } else {
        $(el).text(safe);
      }
    }
  });

  // Process all elements for dangerous attributes
  $('*').each((_, el: AnyNode) => {
    if (!('attribs' in el)) {
      return;
    }
    const attribs = (el as Element).attribs;
    if (!attribs) {
      return;
    }

    for (const attr of Object.keys(attribs)) {
      // The value is the HTML of speaker notes: it is sanitized as such.
      if (notesAreHTML && HTML_ATTRIBUTES.has(attr.toLowerCase())) {
        attribs[attr] = sanitizeStableHTML(attribs[attr], false);
        continue;
      }

      // Strip all on* event handler attributes (onload, onerror, onclick, etc.)
      if (/^on/i.test(attr)) {
        delete attribs[attr];
        continue;
      }

      // Strip dangerous URL schemes from URL-bearing attributes
      if (
        URL_ATTRIBUTES.includes(attr.toLowerCase()) &&
        isDangerousUrl(attribs[attr])
      ) {
        delete attribs[attr];
      }
    }
  });

  // Sandbox all iframes and remove srcdoc (which can contain arbitrary HTML)
  $('iframe').each((_, el: Element) => {
    const attribs = el.attribs;
    if (!attribs) {
      return;
    }
    // Empty sandbox = maximum restrictions (no scripts, no forms, no popups, etc.)
    attribs['sandbox'] = '';
    delete attribs['srcdoc'];
  });
}

/**
 * How many readings are given up on: markup can be written so that every
 * reading puts an event handler one reading further away (a form nested in
 * MathML does it), so no number of readings is enough for all markup.
 */
const MAX_READINGS = 3;

/**
 * Sanitize HTML that a page takes back as HTML, and return it as HTML.
 *
 * Reading markup a second time can read it differently from the first: in
 * MathML and SVG, what one reading takes for the text of a `style` element is
 * an element with an event handler in the next — a "mutation". So the markup
 * is read and sanitized again until reading it once more changes nothing;
 * where it has not stopped changing after `MAX_READINGS` readings, its MathML
 * and SVG are taken out, for nowhere else do two readings differ.
 *
 * It is read as the content of an element, which is how the page takes it.
 * `notesAreHTML` is that of `sanitize`: the markup of a page holds notes that
 * reveal.js writes into the page again, the markup of notes does not.
 */
export function sanitizeStableHTML(
  html: string,
  notesAreHTML: boolean = true,
): string {
  for (let reading = 0; ; reading++) {
    const $ = cheerio.load(`<div>${html}</div>`);
    if (reading === MAX_READINGS) {
      $('math, svg').remove();
    }
    sanitize($, notesAreHTML);
    const next = $('div').html() ?? '';
    if (next === html || reading === MAX_READINGS) {
      return next;
    }
    html = next;
  }
}
