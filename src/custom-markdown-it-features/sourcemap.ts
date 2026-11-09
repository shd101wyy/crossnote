import MarkdownIt from 'markdown-it';
import Renderer from 'markdown-it/lib/renderer';
import Token from 'markdown-it/lib/token';
import { ExtendedMarkdownItOptions } from '../notebook';

/**
 * Add sourcemap to the rendered HTML.
 */
export default (md: MarkdownIt) => {
  const defaultRenderer = md.renderer.renderToken.bind(md.renderer);
  md.renderer.renderToken = function (
    tokens: Token[],
    idx: number,
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

  // Indented code blocks do not go through renderToken, so attach the same
  // source line marker used by fenced blocks for preview block interactions.
  const defaultCodeBlockRenderer = md.renderer.rules.code_block;
  if (defaultCodeBlockRenderer) {
    md.renderer.rules.code_block = function (
      tokens: Token[],
      idx: number,
      options: ExtendedMarkdownItOptions,
      env: unknown,
      self: Renderer,
    ) {
      if (options.sourceMap) {
        const token = tokens[idx];
        if (token.map !== null && token.map[0] !== undefined) {
          token.attrSet('data-source-line', `${token.map[0] + 1}`);
        }
      }
      return defaultCodeBlockRenderer(tokens, idx, options, env, self);
    };
  }
};
