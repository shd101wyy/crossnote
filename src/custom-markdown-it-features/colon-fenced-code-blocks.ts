/**
 * Adds support for colon-fenced code blocks (Azure DevOps / GitLab wiki style):
 *
 *   :::mermaid
 *   graph TD
 *     A --> B
 *   :::
 *
 * The blocks are rendered identically to backtick-fenced code blocks, so all
 * supported diagram types (mermaid, plantuml, wavedrom, etc.) and syntax
 * highlighting work out of the box without any additional changes to the
 * rendering pipeline.
 */

import { escape } from 'html-escaper';
import MarkdownIt from 'markdown-it';
import { normalizeBlockInfo, parseBlockInfo } from '../lib/block-info';

export default (md: MarkdownIt) => {
  // Block rule: parse :::type ... ::: fences
  md.block.ruler.before('fence', 'colon_fence', colonFenceRule, {
    alt: ['paragraph', 'reference', 'blockquote', 'list'],
  });

  // Renderer: produce the same <pre data-role="codeBlock"> output as
  // code-fences.ts so the existing render-enhancer pipeline (fenced-diagrams,
  // fenced-code-chunks, etc.) picks it up without modification.
  md.renderer.rules['colon_fence'] = (tokens, idx) => {
    const token = tokens[idx];
    const info = token.info.trim();
    const parsedInfo = parseBlockInfo(info);
    const normalizedInfo = normalizeBlockInfo(parsedInfo);
    const content = escape(token.content);
    const finalBreak =
      idx < tokens.length && tokens[idx].type === 'list_item_close' ? '\n' : '';

    return (
      `<pre data-role="codeBlock"` +
      ` data-info="${escape(info)}"` +
      ` data-parsed-info="${escape(JSON.stringify(parsedInfo))}"` +
      ` data-normalized-info="${escape(JSON.stringify(normalizedInfo))}"` +
      ('data-source-line' in parsedInfo.attributes
        ? ` data-source-line="${parsedInfo.attributes['data-source-line']}"`
        : '') +
      `>${content}</pre>${finalBreak}`
    );
  };
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

  // Emit the token
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

  state.line = nextLine + (haveEndMarker ? 1 : 0);
  return true;
}
