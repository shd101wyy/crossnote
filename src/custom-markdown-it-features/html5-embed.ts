// tslint:disable-next-line no-implicit-dependencies
import MarkdownIt from 'markdown-it';
import MarkdownItHtml5Embed from 'markdown-it-html5-embed';
import { Notebook } from '../notebook';

const optionsFromConfig = (notebook: Notebook) => ({
  html5embed: {
    useImageSyntax: notebook.config.HTML5EmbedUseImageSyntax,
    useLinkSyntax: notebook.config.HTML5EmbedUseLinkSyntax,
    isAllowedHttp: notebook.config.HTML5EmbedIsAllowedHttp,
    attributes: {
      audio: notebook.config.HTML5EmbedAudioAttributes,
      video: notebook.config.HTML5EmbedVideoAttributes,
    },
  },
});

export default (md: MarkdownIt, notebook: Notebook) => {
  if (!notebook.config.enableHTML5Embed) {
    return;
  }

  md.use(MarkdownItHtml5Embed, optionsFromConfig(notebook));
};
