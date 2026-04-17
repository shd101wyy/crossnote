/*
 * modified to support math block
 * check https://github.com/jonschlinkert/remarkable/blob/875554aedb84c9dd190de8d0b86c65d2572eadd5/lib/rules.js
 */

// tslint:disable-next-line no-implicit-dependencies
import { escape } from 'html-escaper';
import MarkdownIt from 'markdown-it';
import Token from 'markdown-it/lib/token';
import { normalizeBlockInfo, parseBlockInfo } from '../lib/block-info';

/**
 * Shared renderer for both backtick-fenced and colon-fenced code blocks.
 * Produces `<pre data-role="codeBlock" ...>` output consumed by the
 * render-enhancer pipeline (fenced-diagrams, fenced-code-chunks, etc.).
 */
export function renderCodeBlockToken(tokens: Token[], idx: number): string {
  const token = tokens[idx];

  // get code info (same line as opening fence)
  const info = token.info.trim();
  const parsedInfo = parseBlockInfo(info);
  const normalizedInfo = normalizeBlockInfo(parsedInfo);

  // get code content
  const content = escape(token.content);

  // Add a trailing newline when the next token closes a list item so that the
  // rendered HTML does not run into the closing </li> tag.
  const finalBreak =
    idx + 1 < tokens.length && tokens[idx + 1].type === 'list_item_close'
      ? '\n'
      : '';

  // NOTE: The actual <code> tag is added in the code-block-styling.ts.
  return `<pre data-role="codeBlock" data-info="${escape(
    info,
  )}" data-parsed-info="${escape(
    JSON.stringify(parsedInfo),
  )}" data-normalized-info="${escape(JSON.stringify(normalizedInfo))}" ${
    'data-source-line' in parsedInfo.attributes
      ? `data-source-line="${parsedInfo.attributes['data-source-line']}"`
      : ''
  }>${content}</pre>${finalBreak}`;
}

export default (md: MarkdownIt) => {
  md.renderer.rules.fence = renderCodeBlockToken;
};
