import { escape } from 'html-escaper';
import { KatexOptions } from 'katex';
import { stringifyBlockAttributes } from '../lib/block-attributes';
import { BlockInfo } from '../lib/block-info';
import { MathRenderingOption } from '../notebook';
import parseMath from '../renderers/parse-math';

const supportedLanguages = ['math'];

/**
 * Enhances the document with literate fenced math
 * Attributes supported:
 * - literate [=true] if false, no math rendering happens
 * - hide [=true] if set to false, both code and output are shown
 * - output_first [=false] if true, math output shows before the code block (requires hide=false)
 *
 * @param renderingOption which math engine to use
 * @param $ cheerio element containing the entire document
 */
export default async function enhance(
  $,
  renderingOption: MathRenderingOption,
  mathBlockDelimiters: string[][],
  katexConfig: KatexOptions,
): Promise<void> {
  $('[data-role="codeBlock"]').each((i, container) => {
    const $container = $(container);
    if ($container.data('executor')) {
      return;
    }

    const normalizedInfo: BlockInfo = $container.data('normalizedInfo');
    if (
      normalizedInfo.attributes['literate'] === false ||
      normalizedInfo.attributes['cmd'] === false ||
      supportedLanguages.indexOf(normalizedInfo.language) === -1
    ) {
      return;
    }

    $container.data('executor', 'math');

    if (normalizedInfo.attributes['literate'] === false) {
      return;
    }

    const code = $container.text();
    const $renderedMath = renderMath(
      code,
      normalizedInfo,
      renderingOption,
      mathBlockDelimiters,
      katexConfig,
    );
    normalizedInfo.attributes['output_first'] === true
      ? $container.before($renderedMath)
      : $container.after($renderedMath);

    if (normalizedInfo.attributes['hide'] !== false) {
      $container.data('hiddenByEnhancer', true);
    }
  });
  return $;
}

const renderMath = (
  code: string,
  normalizedInfo: BlockInfo,
  renderingOption: MathRenderingOption,
  mathBlockDelimiters: string[][],
  katexConfig: KatexOptions,
): string => {
  let $output: string | null = null;
  try {
    const mathHtml = parseMath({
      content: code,
      displayMode: true,
      openTag: mathBlockDelimiters.length ? mathBlockDelimiters[0][0] : '',
      closeTag: mathBlockDelimiters.length ? mathBlockDelimiters[0][1] : '',
      renderingOption,
      katexConfig,
    });
    $output = `<p ${stringifyBlockAttributes(
      normalizedInfo.attributes,
    )}>${mathHtml}</p>`;
  } catch (error) {
    $output = `<pre class="language-text"><code>${escape(
      error.toString(),
    )}</code></pre>`;
  }
  return $output;
};
