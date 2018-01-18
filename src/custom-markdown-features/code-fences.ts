/*
 * modified to support math block
 * check https://github.com/jonschlinkert/remarkable/blob/875554aedb84c9dd190de8d0b86c65d2572eadd5/lib/rules.js
 */

// tslint:disable-next-line no-implicit-dependencies
import { MarkdownIt } from "markdown-it";
import { MarkdownEngineConfig } from "../markdown-engine-config";
import parseMath from "../parse-math";
import { escapeString, unescapeString } from "../utility";

export default (md: MarkdownIt, config: MarkdownEngineConfig) => {
  md.renderer.rules.fence = (tokens, idx, options, env, instance) => {
    const token = tokens[idx];
    const langName = escapeString(token.info.trim());
    const langClass = ' class="language-' + langName + '" ';

    // get code content
    const content = escapeString(token.content);

    // copied from getBreak function.
    const finalBreak =
      idx < tokens.length && tokens[idx].type === "list_item_close" ? "\n" : "";

    if (langName === "math") {
      const openTag = config.mathBlockDelimiters[0][0] || "$$";
      const closeTag = config.mathBlockDelimiters[0][1] || "$$";
      const mathExp = unescapeString(content).trim();
      if (!mathExp) {
        return "";
      }
      const mathHtml = parseMath({
        closeTag,
        content: mathExp,
        displayMode: true,
        openTag,
        renderingOption: config.mathRenderingOption
      });
      return `<p>${mathHtml}</p>`;
    }
    return (
      "<pre><code" + langClass + ">" + content + "</code></pre>" + finalBreak
    );
  };
};
