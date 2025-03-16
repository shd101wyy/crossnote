// tslint:disable-next-line no-implicit-dependencies
import MarkdownIt from 'markdown-it';
import MarkdownItEmoji from 'markdown-it-emoji';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import fullEmoji from 'markdown-it-emoji/lib/data/full.json' with { type: 'json' };
import { Notebook } from '../notebook';
import { fontawesomeObject, isFontawesomebrand } from './fontawesome';

export default (md: MarkdownIt, notebook: Notebook) => {
  md.use(MarkdownItEmoji, {
    defs: { ...fullEmoji, ...fontawesomeObject },
  });

  md.renderer.rules.emoji = (tokens, idx) => {
    const token = tokens[idx];
    if (notebook.config.enableEmojiSyntax) {
      const markup = token.markup;
      if (markup.match('fa-')) {
        // We only support font-awesome 6 for now
        // font-awesome
        // fa: font-awesome 4
        // fas: font-awesome 5 solid
        // fab: font-awesome 5 brands
        // fa-brands: font-awesome 6 brands
        // fa-solid: font-awesome 6 solid

        return `<i class="${
          isFontawesomebrand(markup) ? 'fa-brands' : 'fa-solid'
        } ${markup}" aria-hidden="true"></i>`;
      } else {
        // emoji
        return token.content;
      }
    } else {
      return `:${token.markup}:`;
    }
  };
};
