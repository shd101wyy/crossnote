// tslint:disable-next-line no-implicit-dependencies
import MarkdownIt from 'markdown-it';
import { Notebook } from '../notebook';
import parseMath from '../renderers/parse-math';

export default (md: MarkdownIt, notebook: Notebook) => {
  md.inline.ruler.before('escape', 'math', (state, silent) => {
    if (notebook.config.mathRenderingOption === 'None') {
      return false;
    }

    let openTag: string | null = null;
    let closeTag: string | null = null;
    let displayMode = true;
    const {
      mathBlockDelimiters: blockDelimiters,
      mathInlineDelimiters: inlineDelimiters,
    } = notebook.config;

    for (const tagPair of blockDelimiters) {
      if (state.src.startsWith(tagPair[0], state.pos)) {
        [openTag, closeTag] = tagPair;
        break;
      }
    }

    if (!openTag) {
      for (const tagPair of inlineDelimiters) {
        if (state.src.startsWith(tagPair[0], state.pos)) {
          [openTag, closeTag] = tagPair;
          displayMode = false;
          break;
        }
      }
    }

    if (!openTag || !closeTag) {
      return false; // not math
    }

    let content: string | null = null;
    let end = -1;

    let i = state.pos + openTag.length;
    while (i < state.src.length) {
      if (closeTag && state.src.startsWith(closeTag, i)) {
        end = i;
        break;
      } else if (state.src[i] === '\\') {
        i += 1;
      }
      i += 1;
    }

    if (end >= 0) {
      content = state.src.slice(state.pos + openTag.length, end);
    } else {
      return false;
    }

    if (content && !silent) {
      const token = state.push('math', '', 0);
      token.content = content.trim();
      token.meta = token.meta || {};
      token.meta.openTag = openTag;
      token.meta.closeTag = closeTag;
      token.meta.displayMode = displayMode;

      state.pos += content.length + openTag.length + closeTag.length;
      return true;
    } else {
      return false;
    }
  });

  md.renderer.rules.math = (tokens, idx) => {
    const content: string = tokens[idx].content ?? '';
    return parseMath({
      content,
      openTag: tokens[idx].meta.openTag,
      closeTag: tokens[idx].meta.closeTag,
      renderingOption: notebook.config.mathRenderingOption,
      displayMode: tokens[idx].meta.displayMode,
      katexConfig: notebook.config.katexConfig,
    });
  };
};
