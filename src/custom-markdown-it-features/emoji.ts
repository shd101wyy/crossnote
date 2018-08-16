// tslint:disable-next-line no-implicit-dependencies
import { MarkdownIt } from "markdown-it";
import { resolve } from "path";
import * as twemoji from "twemoji";
import { MarkdownEngineConfig } from "../markdown-engine-config";
import { extensionDirectoryPath } from "../utility";

export const twemojiParse = (content: string) =>
  twemoji.parse(content, {
    callback: (icon) => {
      return (
        "file://" +
        resolve(__dirname, "../../../node_modules/twemoji/2/svg") +
        "/" +
        icon +
        ".svg"
      );
    },
    attributes: () => {
      return {
        style: "width:1.2em; height: 1.2em;",
      };
    },
  });

export default (md: MarkdownIt, config: MarkdownEngineConfig) => {
  md.use(
    require(resolve(
      extensionDirectoryPath,
      "./dependencies/markdown-it/extensions/markdown-it-emoji.min.js",
    )),
  );

  md.renderer.rules.emoji = (tokens, idx) => {
    const token = tokens[idx];
    if (config.enableEmojiSyntax) {
      const markup = token.markup;
      if (markup.startsWith("fa-")) {
        // font-awesome
        return `<i class="fa ${markup}" aria-hidden="true"></i>`;
      } else {
        // emoji
        return twemojiParse(token.content);
      }
    } else {
      return `:${token.markup}:`;
    }
  };
};
