/**
 * Maps positions between the raw markdown source and the rendered preview by
 * matching the visible text around them, so scroll sync can land on an exact
 * spot inside a block instead of only at the start of the block.
 *
 * Both sides are reduced to the same "visible text": letters and digits only,
 * lower-cased. Markdown syntax, HTML tags, comments, link destinations and
 * entities are dropped from the source, so `**Owner** [shall](#x)` in the
 * source and `Owner shall` in the preview both become `ownershall`.
 */

const WORD_CHAR = /[\p{L}\p{N}]/u;

function normalizeChar(ch: string): string | null {
  if (!WORD_CHAR.test(ch)) {
    return null;
  }
  const lower = ch.toLowerCase();
  return lower.length === 1 ? lower : ch;
}

function lowerBound(values: Int32Array, target: number): number {
  let lo = 0;
  let hi = values.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (values[mid] < target) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  return lo;
}

export interface SourceTextIndex {
  /** Visible text of the source. */
  text: string;
  /** Zero-based source line of each character in `text`. */
  lines: Int32Array;
  /** Zero-based source column of each character in `text`. */
  columns: Int32Array;
}

const FENCE = /^[ \t]*(```|~~~)/;
// Line prefixes that render as CSS markers or not at all: ordered-list
// numbers, task-list boxes and reference-link definitions.
const HIDDEN_LINE_PREFIX =
  /^[ \t]*(?:\d+[.)][ \t]+|[-*+][ \t]+\[[ xX]\][ \t]+|\[[^\]\n]+\]:[ \t]*\S[^\n]*)/;
const ENTITY = /^&(?:#\d+|#x[0-9a-f]+|[a-z][a-z0-9]*);/i;
const MAX_SKIP = 2000;

export function buildSourceTextIndex(markdown: string): SourceTextIndex {
  const chars: string[] = [];
  const lines: number[] = [];
  const columns: number[] = [];
  const n = markdown.length;
  let i = 0;
  let line = 0;
  let lineStart = 0;
  let inFence = false;

  const skipTo = (end: number) => {
    for (; i < end; i++) {
      if (markdown.charCodeAt(i) === 10) {
        line++;
        lineStart = i + 1;
      }
    }
  };
  const lineEnd = () => {
    const end = markdown.indexOf('\n', i);
    return end === -1 ? n : end;
  };

  while (i < n) {
    const ch = markdown[i];
    if (ch === '\n') {
      line++;
      i++;
      lineStart = i;
      continue;
    }

    if (i === lineStart) {
      const rest = markdown.slice(i, i + 256);
      if (FENCE.test(rest)) {
        // The fence line and its info string (```js) render nothing.
        inFence = !inFence;
        skipTo(lineEnd());
        continue;
      }
      if (!inFence) {
        const prefix = HIDDEN_LINE_PREFIX.exec(rest);
        if (prefix) {
          i += prefix[0].length;
          continue;
        }
      }
    }

    // Inside code fences everything renders literally.
    if (!inFence) {
      if (markdown.startsWith('<!--', i)) {
        const end = markdown.indexOf('-->', i + 4);
        skipTo(end === -1 ? n : end + 3);
        continue;
      }
      if (ch === '<' && /[A-Za-z/!?]/.test(markdown[i + 1] ?? '')) {
        const end = markdown.indexOf('>', i + 1);
        if (end !== -1 && end - i < MAX_SKIP) {
          skipTo(end + 1);
          continue;
        }
      }
      if (ch === '!' && markdown[i + 1] === '[') {
        // Image: the alt text is not rendered as text.
        const close = markdown.indexOf('](', i + 2);
        const end = close === -1 ? -1 : markdown.indexOf(')', close + 2);
        if (end !== -1 && end < lineEnd()) {
          skipTo(end + 1);
          continue;
        }
      }
      if (ch === ']' && markdown[i + 1] === '(') {
        // Link destination.
        const end = markdown.indexOf(')', i + 2);
        if (end !== -1 && end < lineEnd()) {
          skipTo(end + 1);
          continue;
        }
      }
      if (ch === '&') {
        const entity = ENTITY.exec(markdown.slice(i, i + 12));
        if (entity) {
          i += entity[0].length;
          continue;
        }
      }
    }

    const c = normalizeChar(ch);
    if (c) {
      chars.push(c);
      lines.push(line);
      columns.push(i - lineStart);
    }
    i++;
  }

  return {
    text: chars.join(''),
    lines: Int32Array.from(lines),
    columns: Int32Array.from(columns),
  };
}

/**
 * Visible-text offset of the source position: the first visible character at
 * or after `character` on `line`, clamped to that line's last one. Returns -1
 * when the line shows no text (blank lines, `---`, hidden HTML).
 */
export function sourceOffsetAt(
  index: SourceTextIndex,
  line: number,
  character: number,
): number {
  const first = lowerBound(index.lines, line);
  if (first >= index.lines.length || index.lines[first] !== line) {
    return -1;
  }
  const last = lowerBound(index.lines, line + 1) - 1;
  let lo = first;
  let hi = last;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (index.columns[mid] < character) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  return lo;
}

/**
 * Visible-text offsets of the first and last visible characters inside a
 * source range (`end` exclusive), or null when the range shows no text.
 */
export function sourceRangeToOffsets(
  index: SourceTextIndex,
  start: { line: number; character: number },
  end: { line: number; character: number },
): [number, number] | null {
  // First visible character at or after a position, anywhere in the text.
  const atOrAfter = (line: number, character: number) => {
    let lo = 0;
    let hi = index.text.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (
        index.lines[mid] < line ||
        (index.lines[mid] === line && index.columns[mid] < character)
      ) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }
    return lo;
  };
  const first = atOrAfter(start.line, start.character);
  const last = atOrAfter(end.line, end.character) - 1;
  return first <= last ? [first, last] : null;
}

export interface DomTextIndex {
  /** Visible text of the rendered preview. */
  text: string;
  nodes: Text[];
  /** Index into `nodes` of each character in `text`. */
  nodeIndices: Int32Array;
  /** Offset inside its text node of each character in `text`. */
  offsets: Int32Array;
  /** Offset in `text` where each node's characters start. */
  nodeStarts: Map<Node, number>;
}

const SKIPPED_PARENTS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE']);

export function buildDomTextIndex(root: Element): DomTextIndex {
  const chars: string[] = [];
  const nodeIndices: number[] = [];
  const offsets: number[] = [];
  const nodes: Text[] = [];
  const nodeStarts = new Map<Node, number>();
  const walker = root.ownerDocument.createTreeWalker(root, 4 /* SHOW_TEXT */);

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const parent = node.parentElement;
    if (parent && SKIPPED_PARENTS.has(parent.tagName)) {
      continue;
    }
    const textNode = node as Text;
    const data = textNode.data;
    const nodeIndex = nodes.length;
    nodes.push(textNode);
    nodeStarts.set(textNode, chars.length);
    for (let k = 0; k < data.length; k++) {
      const c = normalizeChar(data[k]);
      if (c) {
        chars.push(c);
        nodeIndices.push(nodeIndex);
        offsets.push(k);
      }
    }
  }

  return {
    text: chars.join(''),
    nodes,
    nodeIndices: Int32Array.from(nodeIndices),
    offsets: Int32Array.from(offsets),
    nodeStarts,
  };
}

/**
 * Visible-text offset of a caret inside a text node: the first visible
 * character at or after `offset`. Returns -1 for nodes outside the index.
 */
export function domOffsetAt(
  index: DomTextIndex,
  node: Node,
  offset: number,
): number {
  const start = index.nodeStarts.get(node);
  if (start === undefined) {
    return -1;
  }
  let k = start;
  while (
    k < index.text.length &&
    index.nodes[index.nodeIndices[k]] === node &&
    index.offsets[k] < offset
  ) {
    k++;
  }
  return Math.min(k, index.text.length - 1);
}

/**
 * Visible-text offset of the first visible character at or after a DOM
 * boundary point, such as either end of a selection Range. Unlike
 * domOffsetAt, the container may be an element, and the result may be
 * `text.length` when no visible text follows.
 */
export function domOffsetAtBoundary(
  index: DomTextIndex,
  root: Node,
  container: Node,
  offset: number,
): number {
  const start = index.nodeStarts.get(container);
  if (start !== undefined) {
    let k = start;
    while (
      k < index.text.length &&
      index.nodes[index.nodeIndices[k]] === container &&
      index.offsets[k] < offset
    ) {
      k++;
    }
    return k;
  }

  // Start from the first text node after the point, in document order.
  let from: Node = container;
  if (container.nodeType !== 3 /* TEXT_NODE */) {
    const child = container.childNodes[offset];
    if (child) {
      const childStart = index.nodeStarts.get(child);
      if (childStart !== undefined) {
        return childStart;
      }
      from = child;
    } else {
      // After the container's last descendant.
      while (from.lastChild) {
        from = from.lastChild;
      }
    }
  }
  const document = root.ownerDocument ?? (root as Document);
  const walker = document.createTreeWalker(root, 4 /* SHOW_TEXT */);
  walker.currentNode = from;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const nodeStart = index.nodeStarts.get(node);
    if (nodeStart !== undefined) {
      return nodeStart;
    }
  }
  return index.text.length;
}

const MIN_NEEDLE = 6;

/**
 * Finds where position `at` of the visible text `from` falls in the visible
 * text `to`, by searching `to` for the text around it. Tries the widest
 * context first and narrows it until something matches; returns every
 * position of the first context that matched, so the caller can pick the one
 * nearest to where it expected it.
 */
export function findCorrespondingOffsets(
  from: string,
  at: number,
  to: string,
  radius: number = 24,
  maxResults: number = 200,
): number[] {
  const half = Math.floor(radius / 2);
  const contexts: Array<[number, number]> = [
    [radius, radius],
    [0, radius],
    [radius, 1],
    [half, half],
    [0, half],
    [half, 1],
  ];
  for (const [before, after] of contexts) {
    const start = Math.max(0, at - before);
    const end = Math.min(from.length, at + after);
    if (end - start < MIN_NEEDLE) {
      continue;
    }
    const needle = from.slice(start, end);
    const results: number[] = [];
    for (
      let k = to.indexOf(needle);
      k !== -1 && results.length < maxResults;
      k = to.indexOf(needle, k + 1)
    ) {
      results.push(k + (at - start));
    }
    if (results.length) {
      return results;
    }
  }
  return [];
}
