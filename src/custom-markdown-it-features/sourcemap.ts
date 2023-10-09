import MarkdownIt from 'markdown-it';
import { ExtendedMarkdownItOptions } from '../notebook';

/**
 * Add sourcemap to the rendered HTML.
 */
export default (md: MarkdownIt) => {
  const defaultRenderer = md.renderer.renderToken.bind(md.renderer);
  md.renderer.renderToken = function (
    tokens,
    idx,
    options: ExtendedMarkdownItOptions,
  ) {
    if (!options.sourceMap) {
      return defaultRenderer(tokens, idx, options);
    }

    const token = tokens[idx];
    if (
      token.type.endsWith('_open') &&
      token.map !== null &&
      token.map[0] !== undefined
    ) {
      token.attrSet('data-source-line', `${token.map[0] + 1}`);
    }
    return defaultRenderer(tokens, idx, options);
  };
};
