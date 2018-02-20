import { stringifyAttributes } from "../lib/attributes";
import { BlockInfo } from "../lib/block-info";
import parseMath from "../parse-math";

/**
 * This function resolves image paths and render code blocks
 * @param html the html string that we will analyze
 * @return html
 */
export default async function enhance($): Promise<void> {
  const asyncFunctions = [];
  $('[data-role="codeBlock"]').each((i, container) => {
    const $container = $(container);

    if ($container.data("executor")) {
      return;
    }

    const normalizedInfo: BlockInfo = $container.data("normalizedInfo");
    if (normalizedInfo.language !== "math") {
      return;
    }

    $container.data("executor", "math");

    const code = $container.text();

    $container.after(renderMath(code, normalizedInfo));
    $container.data("hidden", true);
  });
  return $;
}

const renderMath = (code: string, normalizedInfo: BlockInfo): Cheerio => {
  let $output = null;
  try {
    const mathHtml = parseMath({
      closeTag: "",
      content: code,
      displayMode: true,
      openTag: "",
      renderingOption: "KaTeX",
    });
    $output = `<p ${stringifyAttributes(
      normalizedInfo.attributes,
    )}>${mathHtml}</p>`;
  } catch (error) {
    $output = `<pre class="language-text">${error.toString()}</pre>`;
  }
  return $output;
};
