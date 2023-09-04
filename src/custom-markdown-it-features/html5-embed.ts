// tslint:disable-next-line no-implicit-dependencies
import MarkdownIt from 'markdown-it';
import MarkdownItHtml5Embed from 'markdown-it-html5-embed';
import { NotebookConfig } from '../notebook';

const optionsFromConfig = (config: NotebookConfig) => ({
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

export default (md: MarkdownIt, config: NotebookConfig) => {
  if (!config.enableHTML5Embed) {
    return;
  }

  md.use(MarkdownItHtml5Embed, optionsFromConfig(config));
};
