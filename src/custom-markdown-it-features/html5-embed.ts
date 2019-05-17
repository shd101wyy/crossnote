// tslint:disable-next-line no-implicit-dependencies
import { MarkdownIt } from "markdown-it";
import { resolve } from "path";
import { MarkdownEngineConfig } from "../markdown-engine-config";
import { extensionDirectoryPath } from "../utility";

const optionsFromConfig = (config: MarkdownEngineConfig) => ({
  html5embed: {
    useImageSyntax: config.HTML5EmbedUseImageSyntax,
    useLinkSyntax: config.HTML5EmbedUseLinkSyntax,
    isAllowedHttp: config.HTML5EmbedIsAllowedHttp,
    attributes: {
      audio: config.HTML5EmbedAudioAttributes,
      video: config.HTML5EmbedVideoAttributes,
    },
  },
});

export default (md: MarkdownIt, config: MarkdownEngineConfig) => {
  if (!config.enableHTML5Embed) {
    return;
  }

  md.use(
    require(resolve(
      extensionDirectoryPath,
      "./dependencies/markdown-it/extensions/markdown-it-html5-embed.js",
    )),
    optionsFromConfig(config),
  );
};
