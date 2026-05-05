/**
 * inline [[]]
 * [[...]]
 */

import MarkdownIt from 'markdown-it';
import { Notebook } from '../notebook';

export default (md: MarkdownIt, notebook: Notebook) => {
  md.inline.ruler.before('autolink', 'wikilink', (state, silent) => {
    if (
      !notebook.config.enableWikiLinkSyntax ||
      !state.src.startsWith('[[', state.pos)
    ) {
      return false;
    }

    let content: string | null;
    const tag = ']]';
    let end = -1;

    let i = state.pos + tag.length;
    while (i < state.src.length) {
      if (state.src[i] === '\\') {
        i += 1;
      } else if (state.src.startsWith(tag, i)) {
        end = i;
        break;
      }
      i += 1;
    }

    if (end >= 0) {
      // found ]]
      content = state.src.slice(state.pos + tag.length, end);
    } else {
      return false;
    }

    if (content && !silent) {
      const token = state.push('wikilink', 'a', 0);
      token.content = content;

      state.pos += content.length + 2 * tag.length;
      return true;
    } else {
      return false;
    }
  });

  md.renderer.rules.wikilink = (tokens, idx) => {
    const { content } = tokens[idx];
    if (!content) {
      return '';
    }

    const { text, link } = notebook.processWikilink(content);

    // When the user provided an alias (`[[…|Display]]`) processWikilink
    // already gave us the alias as `text`.  When they didn't, `text`
    // equals the raw content (e.g. "README#^abc"), which is ugly.
    // Format it Obsidian-style: "Note > Heading > ^block".
    const displayText = content.includes('|')
      ? text
      : formatWikilinkDisplay(text);

    return `<a href="${md.utils.escapeHtml(link)}">${md.utils.escapeHtml(
      displayText,
    )}</a>`;
  };
};

/**
 * Format a wikilink target like "Note", "Note#Heading", "Note^abc",
 * "Note#Heading^abc", or just "#Heading" / "^abc" into a
 * human-readable display string with " > " separators.
 *
 *   "Note"                  -> "Note"
 *   "Note#Heading"          -> "Note > Heading"
 *   "Note^abc"              -> "Note > ^abc"
 *   "Note#Heading^abc"      -> "Note > Heading > ^abc"
 *   "#Heading"              -> "Heading"  (self-link)
 *   "^abc"                  -> "^abc"     (self-link)
 */
export function formatWikilinkDisplay(raw: string): string {
  const hashIdx = raw.indexOf('#');
  const blockIdx = raw.indexOf('^');

  let parts: string[];
  if (hashIdx === -1 && blockIdx === -1) {
    parts = [raw];
  } else if (hashIdx === -1) {
    // ^block only
    parts = [raw.slice(0, blockIdx), raw.slice(blockIdx)];
  } else if (blockIdx === -1) {
    // # only
    parts = [raw.slice(0, hashIdx), raw.slice(hashIdx + 1)];
  } else if (blockIdx < hashIdx) {
    // Reverse order `Note^abc#Heading` — Obsidian doesn't actually
    // produce this shape, but if a user types it we still split into
    // three readable parts in source order rather than dropping the
    // block ref silently.
    parts = [
      raw.slice(0, blockIdx),
      raw.slice(blockIdx, hashIdx),
      raw.slice(hashIdx + 1),
    ];
  } else {
    // Note#Heading^block
    parts = [
      raw.slice(0, hashIdx),
      raw.slice(hashIdx + 1, blockIdx),
      raw.slice(blockIdx),
    ];
  }

  return parts.filter((p) => p.length > 0).join(' > ');
}
