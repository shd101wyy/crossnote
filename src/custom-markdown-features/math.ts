// tslint:disable-next-line no-implicit-dependencies
import { MarkdownIt } from "markdown-it";
import { MarkdownEngineConfig } from "../markdown-engine-config";
import parseMath from "../parse-math";

export default (md: MarkdownIt, config: MarkdownEngineConfig) => {
  // @ts-ignore
  md.inline.ruler.before("escape", "math", (state, silent) => {
    if (config.mathRenderingOption === "None") {
      return false;
    }

    let openTag = null;
    let closeTag = null;
    let displayMode = true;
    const {
      mathBlockDelimiters: blockDelimiters,
      mathInlineDelimiters: inlineDelimiters
    } = config;

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

    if (!openTag) {
      return false; // not math
    }

    let content = null;
    let end = -1;

    let i = state.pos + openTag.length;
    while (i < state.src.length) {
      if (state.src.startsWith(closeTag, i)) {
        end = i;
        break;
      } else if (state.src[i] === "\\") {
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
      const token = state.push("math");
      token.content = content.trim();
      token.openTag = openTag;
      token.closeTag = closeTag;
      token.displayMode = displayMode;

      state.pos += content.length + openTag.length + closeTag.length;
      return true;
    } else {
      return false;
    }
  });

  md.renderer.rules.math = (tokens, idx) => {
    const content: string = tokens[idx] ? tokens[idx].content : null;
    return parseMath({ content, renderingOption: config.mathRenderingOption });
  };
};
