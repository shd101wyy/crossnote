// tslint:disable-next-line no-implicit-dependencies
import MarkdownIt from 'markdown-it';
import MarkdownItHtml5Embed from 'markdown-it-html5-embed';
import { MarkdownEngineConfig } from '../markdown-engine/markdown-engine-config';

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

  md.use(MarkdownItHtml5Embed, optionsFromConfig(config));
};
