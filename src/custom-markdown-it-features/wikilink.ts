/**
 * inline [[]]
 * [[...]]
 */

import * as caseAnything from 'case-anything';
import MarkdownIt from 'markdown-it';
import path from 'path';
import { Notebook } from '../notebook';

export default (md: MarkdownIt, notebook: Notebook) => {
  md.inline.ruler.before('autolink', 'wikilink', (state, silent) => {
    if (
      !notebook.config.enableWikiLinkSyntax ||
      !state.src.startsWith('[[', state.pos)
    ) {
      return false;
    }

    let content: string | null = null;
    const tag = ']]';
    let end = -1;

    let i = state.pos + tag.length;
    while (i < state.src.length) {
      if (state.src[i] === '\\') {
        i += 1;
      } else if (state.src.startsWith(tag, i)) {
        end = i;
        break;
      }
      i += 1;
    }

    if (end >= 0) {
      // found ]]
      content = state.src.slice(state.pos + tag.length, end);
    } else {
      return false;
    }

    if (content && !silent) {
      const token = state.push('wikilink', 'a', 0);
      token.content = content;

      state.pos += content.length + 2 * tag.length;
      return true;
    } else {
      return false;
    }
  });

  md.renderer.rules.wikilink = (tokens, idx) => {
    const { content } = tokens[idx];
    if (!content) {
      return '';
    }

    const splits = content.split('|');
    let link: string;
    let text: string;
    if (splits.length === 1) {
      text = splits[0].trim();
      link = text;
    } else {
      if (notebook.config.useGitHubStylePipedLink) {
        text = splits[0].trim();
        link = splits[1].trim();
      } else {
        text = splits[1].trim();
        link = splits[0].trim();
      }
    }

    // parse hash from link
    const hashIndex = link.lastIndexOf('#');
    let hash = '';
    if (hashIndex >= 0) {
      hash = link.slice(hashIndex);
      link = link.slice(0, hashIndex);
    }

    // transform file name if needed
    const parsed = path.parse(link);
    let fileName = parsed.name;
    let fileExtension = parsed.ext;

    // NOTE: The approach below might not work well for
    // link like `0.7.4` as `.4` is detected as the file extension.
    if (fileExtension.match(/^\.\d+$/)) {
      fileName += fileExtension;
      fileExtension = '';
    }

    if (
      notebook.config.wikiLinkTargetFileNameChangeCase !== 'none' &&
      notebook.config.wikiLinkTargetFileNameChangeCase in caseAnything
    ) {
      fileName =
        caseAnything[notebook.config.wikiLinkTargetFileNameChangeCase](
          fileName,
        );
    }
    if (!fileExtension) {
      fileExtension = notebook.config.wikiLinkTargetFileExtension;
    }
    link = path.join(parsed.dir, fileName + fileExtension);
    if (hash) {
      link += hash;
    }

    return `<a href="${link}">${text}</a>`;
  };
};
