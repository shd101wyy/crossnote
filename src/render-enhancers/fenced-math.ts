import { stringifyAttributes } from "../lib/attributes";
import { BlockInfo } from "../lib/block-info";
import { MathRenderingOption } from "../markdown-engine-config";
import parseMath from "../parse-math";

const supportedLanguages = ["math"];

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
): Promise<void> {
  $('[data-role="codeBlock"]').each((i, container) => {
    const $container = $(container);
    if ($container.data("executor")) {
      return;
    }

    const normalizedInfo: BlockInfo = $container.data("normalizedInfo");
    if (
      normalizedInfo.attributes["literate"] === false ||
      normalizedInfo.attributes["cmd"] === false ||
      supportedLanguages.indexOf(normalizedInfo.language) === -1
    ) {
      return;
    }

    $container.data("executor", "math");

    if (normalizedInfo.attributes["literate"] === false) {
      return;
    }

    const code = $container.text();
    const $renderedMath = renderMath(code, normalizedInfo, renderingOption);
    normalizedInfo.attributes["output_first"] === true
      ? $container.before($renderedMath)
      : $container.after($renderedMath);

    if (normalizedInfo.attributes["hide"] !== false) {
      $container.data("hiddenByEnhancer", true);
    }
  });
  return $;
}

const renderMath = (
  code: string,
  normalizedInfo: BlockInfo,
  renderingOption: MathRenderingOption,
): Cheerio => {
  let $output = null;
  try {
    const mathHtml = parseMath({
      closeTag: "",
      content: code,
      displayMode: true,
      openTag: "",
      renderingOption,
    });
    $output = `<p ${stringifyAttributes(
      normalizedInfo.attributes,
    )}>${mathHtml}</p>`;
  } catch (error) {
    $output = `<pre class="language-text">${error.toString()}</pre>`;
  }
  return $output;
};
