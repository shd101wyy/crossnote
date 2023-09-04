// tslint:disable-next-line no-implicit-dependencies
import MarkdownIt from 'markdown-it';
import MarkdownItEmoji from 'markdown-it-emoji';
import { NotebookConfig } from '../notebook';

export default (md: MarkdownIt, config: NotebookConfig) => {
  md.use(MarkdownItEmoji);

  md.renderer.rules.emoji = (tokens, idx) => {
    const token = tokens[idx];
    if (config.enableEmojiSyntax) {
      const markup = token.markup;
      if (markup.startsWith('fa-')) {
        // font-awesome
        return `<i class="fa ${markup}" aria-hidden="true"></i>`;
      } else {
        // emoji
        return token.content;
      }
    } else {
      return `:${token.markup}:`;
    }
  };
};
