/**
 * inline #tag
 * #tag-name, #parent/child
 */

import MarkdownIt from 'markdown-it';
import { Notebook } from '../notebook';

export default (md: MarkdownIt, notebook: Notebook) => {
  md.inline.ruler.before('autolink', 'tag', (state, silent) => {
    if (
      !notebook.config.enableTagSyntax ||
      state.src.charCodeAt(state.pos) !== 0x23 /* '#' */
    ) {
      return false;
    }

    // Don't match if preceded by a word character, '/' (URL fragment),
    // '&' (HTML entity), or '?' (query param)
    if (state.pos > 0) {
      const prev = state.src.charCodeAt(state.pos - 1);
      if (
        prev === 0x2f /* '/' */ ||
        prev === 0x26 /* '&' */ ||
        prev === 0x3f /* '?' */ ||
        prev === 0x5c /* '\' */ ||
        (prev >= 0x30 && prev <= 0x39) /* '0'-'9' */ ||
        (prev >= 0x41 && prev <= 0x5a) /* 'A'-'Z' */ ||
        (prev >= 0x61 && prev <= 0x7a) /* 'a'-'z' */ ||
        prev === 0x5f /* '_' */ ||
        prev === 0x2d /* '-' */
      ) {
        return false;
      }
    }

    // Don't match #tag inside a `{...}` block-attribute span on the same
    // line (e.g. heading IDs like `# Heading {#myid}` or transformer-injected
    // `{#myid data-source-line="1"}`).  Walk backward; if we find an open `{`
    // before any closing `}` or newline, we're inside an attribute block and
    // must defer to the curly-bracket-attributes core ruler.
    {
      let p = state.pos - 1;
      while (p >= 0) {
        const ch = state.src.charCodeAt(p);
        if (ch === 0x7d /* '}' */) break;
        if (ch === 0x0a /* '\n' */) break;
        if (ch === 0x7b /* '{' */) {
          return false;
        }
        p--;
      }
    }

    // Scan forward: collect tag name characters
    let end = state.pos + 1;
    while (end < state.src.length) {
      const ch = state.src.charCodeAt(end);
      if (
        (ch >= 0x30 && ch <= 0x39) /* '0'-'9' */ ||
        (ch >= 0x41 && ch <= 0x5a) /* 'A'-'Z' */ ||
        (ch >= 0x61 && ch <= 0x7a) /* 'a'-'z' */ ||
        ch === 0x5f /* '_' */ ||
        ch === 0x2d /* '-' */ ||
        ch === 0x2f /* '/' */
      ) {
        end += 1;
      } else {
        break;
      }
    }

    const content = state.src.slice(state.pos + 1, end);
    // Must have at least one word character (not just '#')
    if (!content || !/[a-zA-Z_]/.test(content)) {
      return false;
    }

    if (!silent) {
      const token = state.push('tag', 'span', 0);
      token.content = content;

      state.pos = end;
      return true;
    }

    state.pos = end;
    return true;
  });

  md.renderer.rules.tag = (tokens, idx) => {
    const { content } = tokens[idx];
    if (!content) {
      return '';
    }

    const escaped = md.utils.escapeHtml(content);
    const href = `tag://${encodeURIComponent(content)}`;
    return `<a class="tag" data-tag="${escaped}" href="${href}">#${escaped}</a>`;
  };
};
