/**
 * Markers written into the rendered page for a `<!-- slide -->` and a `[toc]`.
 *
 * A marker is a paragraph of its own, wherever the block before it ends on
 * the line: a fenced block is not followed by a newline, as a paragraph is.
 * One that is not in a paragraph of its own has to start the line.
 *
 * The `<p...>` alternative cannot contain `<`: a page of many `<p` with no
 * `>` is then scanned in linear time (crossnote#588).
 */

export function slideMarkerRegExp(): RegExp {
  return /(?:<p[^><]*>|^\s*)<span>\[CROSSNOTESLIDE(?::(\d+))?\]<\/span>(?:<\/p>)?\s*/gm;
}

export function tocMarkerRegExp(): RegExp {
  return /(?:<p[^><]*>|^\s*)<span>\[CROSSNOTETOC\]<\/span>(?:<\/p>)?\s*/gm;
}
