import * as cheerio from 'cheerio';
import { sanitizeRenderedHTML } from '../../src/markdown-engine/sanitize';

/**
 * Markup that a page reads differently when it reads it again: in MathML and
 * SVG, what one reading takes for the text of a `style` element is an element
 * with an event handler in the next. `test/sanitize-stable.test.ts` has
 * cheerio read it, `test/browser/sanitize-stable.spec.ts` a real Chromium.
 */
export const MUTATIONS = [
  `<form><math><mtext></form><form><mglyph><style></math><input autofocus onfocus=alert(1)>`,
  `<form><math><mtext></form><form><mglyph><style></math><img src=1 onerror=alert(1)>`,
  `<math><mtext><table><mglyph><style><!--</style><img title="--><img src=1 onerror=alert(1)>">`,
  `<math><mtext><table><mglyph><style><!--</style><img title="--&gt;&lt;img src=1 onerror=alert(1)&gt;">`,
];

/**
 * `markup` behind `depth` forms that are open where the parser looks for
 * their end: the innermost form is closed inside MathML in one reading and
 * outside in the next, and what follows is read in another context in the
 * reading after that. The event handler ends up `depth` readings away, so no
 * number of readings is enough for all markup.
 */
function formsDeep(depth: number, markup: string): string {
  for (let level = 0; level < depth; level++) {
    markup = `<form><math><mtext></form><form><mglyph><style></math>${markup}`;
  }
  return markup;
}

/** Markup that three readings leave an event handler in. */
export const LONG_MUTATION = formsDeep(3, `<input autofocus onfocus=alert(1)>`);

/**
 * Sanitized once, as `sanitizeStableHTML` reads: what one reading makes of
 * the markup above is not what a page reads.
 */
export function sanitizeOnce(html: string): string {
  const $ = cheerio.load(`<div>${html}</div>`);
  sanitizeRenderedHTML($);
  return $('div').html() ?? '';
}

/**
 * What a page finds in markup it reads as the content of an element: every
 * event handler and script, by a reading with cheerio.
 */
export function readAgain(html: string): string[] {
  const $ = cheerio.load(`<div>${html}</div>`);
  const threats: string[] = [];
  $('*').each((_, el) => {
    if ('attribs' in el) {
      threats.push(
        ...Object.keys(el.attribs).filter((name) => /^on/i.test(name)),
      );
    }
  });
  if ($('script').length) {
    threats.push('script');
  }
  return threats;
}
