/**
 * Markers written into the rendered page for a `<!-- slide -->` and a `[toc]`.
 *
 * A marker is a paragraph of its own, wherever the block before it ends on
 * the line: a fenced block is not followed by a newline, as a paragraph is.
 * One that is not in a paragraph of its own has to start the line.
 *
 * The `<p...>` alternative cannot contain `<`: a page of many `<p` with no
 * `>` is then scanned in linear time. A marker that starts a line has only
 * spaces and tabs before it on that line (`^[ \t]*`), so a page of many
 * line breaks is scanned in linear time too (crossnote#588).
 */

import * as crypto from 'crypto';

/**
 * The token of one rendering of a note: 16 random bytes as hex, taken from
 * nothing of the note. The rendering puts it into every slide marker it
 * writes — `slideMarker()` — and only a marker that carries it is one
 * (crossnote#589). The number of a slide alone does not do: `0` is always
 * the first slide's, so a marker written as text, wherever its text reaches
 * the page, could start a slide with the class, id, background and source
 * line of another.
 */
export function newSlideMarkerToken(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * The marker the transformer writes for a slide: `<span>[CROSSNOTESLIDE…]</span>`,
 * a paragraph of its own. It names the rendering by its token and the
 * configuration of the slide by its number among the `slideConfigs` of the
 * page.
 *
 * The token comes first, and is 32 hex characters, so that no colon follows
 * the number: `:100:` and `:1234:` are shortcodes to the emoji plugin, which
 * would put the emoji in the place of the number in the marker of the 101st
 * and of the 1235th slide, and the slide would not be cut.
 */
export function slideMarker(
  markerNumber: number,
  slideMarkerToken: string,
): string {
  return `<span>[CROSSNOTESLIDE:${slideMarkerToken}:${markerNumber}]</span>`;
}

/**
 * The slide markers of one rendering: those that carry its token. A marker
 * without it — one written as text — is not matched, and stays the text it
 * is. `slideMarkerToken` is hex, so there is nothing to escape in it.
 */
export function slideMarkerRegExp(slideMarkerToken: string): RegExp {
  return new RegExp(
    String.raw`(?:<p[^><]*>|^[ \t]*)<span>\[CROSSNOTESLIDE:${slideMarkerToken}:(\d+)\]<\/span>(?:<\/p>)?\s*`,
    'gm',
  );
}

export function tocMarkerRegExp(): RegExp {
  return /(?:<p[^><]*>|^[ \t]*)<span>\[CROSSNOTETOC\]<\/span>(?:<\/p>)?\s*/gm;
}
