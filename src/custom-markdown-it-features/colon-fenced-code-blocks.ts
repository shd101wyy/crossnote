/**
 * Adds support for two related uses of triple-colon fences:
 *
 *   1. Pandoc-style fenced divs (default):
 *
 *        :::warning
 *        Be careful!
 *        :::
 *
 *      → <div class="warning"><p>Be careful!</p></div>
 *
 *   2. Azure DevOps / GitLab wiki style code-block fences for known
 *      diagram / chart languages:
 *
 *        :::mermaid
 *        graph TD
 *          A --> B
 *        :::
 *
 *      → rendered identically to the equivalent backtick fence so all
 *      diagram render-enhancers (mermaid, plantuml, wavedrom, …) pick
 *      it up without changes.
 *
 * Disambiguation: only info strings that match a small fixed set of
 * known diagram languages enter the code path.  Everything else is
 * treated as a fenced div, restoring the historical Pandoc-compatible
 * behaviour. See vscode-markdown-preview-enhanced #2275.
 */

import MarkdownIt from 'markdown-it';
import { renderCodeBlockToken } from './code-fences';

/**
 * Info strings that should be treated as code/diagram fences instead of
 * fenced divs.  Kept in sync with the cases handled in
 * src/render-enhancers/fenced-diagrams.ts.  Exported so the transformer
 * can apply the same disambiguation when targeting non-markdown-it parsers.
 */
export const COLON_FENCE_CODE_LANGUAGES = new Set([
  'mermaid',
  'wavedrom',
  'puml',
  'plantuml',
  'bitfield',
  'bit-field',
  'graphviz',
  'viz',
  'dot',
  'vega',
  'vega-lite',
  'wsd',
  'd2',
  'tikz',
]);

/**
 * Extract the first whitespace-delimited word from the info string.  The
 * info string may have additional attributes (e.g. `mermaid {theme=dark}`)
 * that we do not want to feed into the language lookup.
 */
function infoLanguage(info: string): string {
  const match = info.match(/^\s*([^\s{]+)/);
  return match ? match[1].toLowerCase() : '';
}

export default (md: MarkdownIt) => {
  // Block rule: parse :::type ... ::: fences
  md.block.ruler.before('fence', 'colon_fence', colonFenceRule, {
    alt: ['paragraph', 'reference', 'blockquote', 'list'],
  });

  // Code-block path: reuse the same renderer as backtick fences so the
  // existing render-enhancer pipeline picks the block up.
  md.renderer.rules['colon_fence'] = renderCodeBlockToken;

  // Fenced-div path: emit <div class="<lang>"> ... </div>.  The class
  // name is the first whitespace-delimited word of the info string; any
  // trailing `{data-source-line="…"}` injected by the transformer is
  // pulled out as a real HTML attribute below.
  md.renderer.rules['colon_div_open'] = (tokens, idx) => {
    const cls = infoLanguage(tokens[idx].info);
    const sourceLine = tokens[idx].attrGet('data-source-line');
    const sourceLineAttr = sourceLine
      ? ` data-source-line="${sourceLine}"`
      : '';
    return `<div class="${md.utils.escapeHtml(cls)}"${sourceLineAttr}>\n`;
  };
  md.renderer.rules['colon_div_close'] = () => `</div>\n`;
};

const COLON = 0x3a; // ':'

function colonFenceRule(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  state: any,
  startLine: number,
  endLine: number,
  silent: boolean,
): boolean {
  // Indented 4+ spaces → treat as indented code block, not a fence
  if (state.tShift[startLine] - state.blkIndent >= 4) return false;

  let pos = state.bMarks[startLine] + state.tShift[startLine];
  const max = state.eMarks[startLine];

  // Need at least ":::x" (4 characters)
  if (pos + 3 >= max) return false;

  // Must start with :::
  if (
    state.src.charCodeAt(pos) !== COLON ||
    state.src.charCodeAt(pos + 1) !== COLON ||
    state.src.charCodeAt(pos + 2) !== COLON
  ) {
    return false;
  }

  // Count opening colons (minimum 3)
  const markerStart = pos;
  pos = state.skipChars(pos, COLON);
  const markerLen = pos - markerStart;

  // Rest of the opening line is the info string (e.g. "mermaid")
  const info = state.src.slice(pos, max).trim();

  // Reject lines with no info string so that a bare ":::" cannot open a fence
  // (it is only ever a closing marker).
  if (info.length === 0) return false;

  // Validation mode: we found a valid opening marker
  if (silent) return true;

  // Search for the matching closing fence
  let nextLine = startLine;
  let haveEndMarker = false;

  for (;;) {
    nextLine++;
    if (nextLine >= endLine) {
      // Unclosed fence — auto-close at end of document
      break;
    }

    let linePos = state.bMarks[nextLine] + state.tShift[nextLine];
    const lineMax = state.eMarks[nextLine];

    // Non-empty line with indentation less than the fence → stop
    if (linePos < lineMax && state.sCount[nextLine] < state.blkIndent) break;

    // Must start with a colon
    if (state.src.charCodeAt(linePos) !== COLON) continue;

    // Indented 4+ spaces → not a closing fence
    if (state.sCount[nextLine] - state.blkIndent >= 4) continue;

    const closingStart = linePos;
    linePos = state.skipChars(linePos, COLON);

    // Closing marker must be at least as long as the opening marker
    if (linePos - closingStart < markerLen) continue;

    // Closing line must be blank after the colons
    if (state.src.slice(linePos, lineMax).trim().length > 0) continue;

    haveEndMarker = true;
    break;
  }

  const language = infoLanguage(info);
  const isCodeFence = COLON_FENCE_CODE_LANGUAGES.has(language);

  if (isCodeFence) {
    // Code/diagram fence path — emit a single colon_fence token whose
    // content is the inner text (no further markdown parsing).
    const token = state.push('colon_fence', 'code', 0);
    token.info = info;
    token.content = state.getLines(
      startLine + 1,
      nextLine,
      state.blkIndent,
      true,
    );
    token.markup = state.src.slice(
      state.bMarks[startLine] + state.tShift[startLine],
      state.bMarks[startLine] + state.tShift[startLine] + markerLen,
    );
    token.map = [startLine, nextLine + 1];
    token.block = true;
  } else {
    // Fenced-div path — emit open / inner-tokenized children / close.
    const openToken = state.push('colon_div_open', 'div', 1);
    openToken.markup = state.src.slice(markerStart, markerStart + markerLen);
    openToken.block = true;
    openToken.info = info;
    openToken.map = [startLine, startLine + 1];

    // Persist source-line for the renderer (used by preview source-mapping).
    const parsedAttrs = parseColonFenceAttributes(info);
    if (parsedAttrs.dataSourceLine) {
      openToken.attrSet('data-source-line', parsedAttrs.dataSourceLine);
    }

    // Recursively tokenise the inner content as block markdown.  Save and
    // restore the parser state the same way markdown-it's blockquote rule
    // does so unclosed fences can still terminate cleanly.
    const oldParent = state.parentType;
    const oldLineMax = state.lineMax;
    state.parentType = 'colon_div';
    state.lineMax = nextLine;
    state.md.block.tokenize(state, startLine + 1, nextLine);
    state.parentType = oldParent;
    state.lineMax = oldLineMax;

    const closeToken = state.push('colon_div_close', 'div', -1);
    closeToken.markup = state.src.slice(markerStart, markerStart + markerLen);
    closeToken.block = true;
    closeToken.map = [nextLine, nextLine + 1];
  }

  state.line = nextLine + (haveEndMarker ? 1 : 0);
  return true;
}

/**
 * Parse the data-source-line attribute out of a colon-fence info string of
 * the shape `name {data-source-line="N"}` or `name {data-source-line=N}`.
 * The transformer injects this for preview source-mapping.
 */
function parseColonFenceAttributes(info: string): { dataSourceLine?: string } {
  const match = info.match(/data-source-line=["']?(\d+)["']?/);
  return match ? { dataSourceLine: match[1] } : {};
}
