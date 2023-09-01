import { escape } from 'html-escaper';
// https://github.com/KaTeX/KaTeX/blob/main/contrib/mhchem/README.md
import katex from 'katex';
import 'katex/contrib/mhchem';
import { MathRenderingOption } from '../markdown-engine/markdown-engine-config';
import { configs } from '../utility';

// tslint:disable-next-line interface-over-type-literal
export type ParseMathArgs = {
  content: string;
  openTag: string;
  closeTag: string;
  displayMode?: boolean;
  renderingOption: MathRenderingOption;
};

/**
 *
 * @param content the math expression
 * @param openTag the open tag, eg: '\('
 * @param closeTag the close tag, eg: '\)'
 * @param displayMode whether to be rendered in display mode
 * @param renderingOption the math engine to use: KaTeX | MathJax | None
 */
export default ({
  content,
  openTag,
  closeTag,
  displayMode = false,
  renderingOption,
}: ParseMathArgs) => {
  if (!content) {
    return '';
  }
  if (renderingOption === 'KaTeX') {
    try {
      return katex.renderToString(
        content,
        Object.assign({}, configs.katexConfig || {}, { displayMode }),
      );
    } catch (error) {
      return `<span style="color: #ee7f49; font-weight: 500;">${error.toString()}</span>`;
    }
  } else if (renderingOption === 'MathJax') {
    const text = (openTag + content + closeTag).replace(/\n/g, ' ');
    const tag = displayMode ? 'div' : 'span';
    return `<${tag} class="mathjax-exps">${escape(text)}</${tag}>`;
  } else {
    return '';
  }
};
