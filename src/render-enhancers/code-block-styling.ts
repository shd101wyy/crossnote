import { resolve } from "path";
import { scopeForLanguageName } from "../extension-helper";
import { normalizeCodeBlockInfo, parseBlockInfo } from "../lib/block-info";
import { extensionDirectoryPath } from "../utility";

function guessPrismLanguage(lang: string, code: string) {
  if (lang === "vega" || lang === "vega-lite") {
    const firstChar = code.match(/^\s*(.)/)[1];
    return firstChar === "{" ? "json" : "yaml";
  }
  return lang;
}

let Prism;

export default async function enhance($: CheerioStatic): Promise<void> {
  $('[data-role="codeBlock"]').each((i, container) => {
    const $container = $(container);
    const $codeElement: Cheerio = $container.children().first();
    if (!$codeElement.get(0) || $codeElement.get(0).name !== "code") {
      return;
    }
    const code = $codeElement.text();
    const infoAsString = $container.data("info");
    const info = normalizeCodeBlockInfo(parseBlockInfo(infoAsString));

    if (info.hide) {
      $container.remove();
      return;
    }

    const language = guessPrismLanguage(scopeForLanguageName(info.lang), code);
    try {
      if (!Prism) {
        Prism = require(resolve(
          extensionDirectoryPath,
          "./dependencies/prism/prism.js",
        ));
      }
      const html = Prism.highlight(code, Prism.languages[language]);
      $container.html(html);
    } catch (error) {
      // regarded as plain text
      $container.text(code);
    }
    $container.addClass(`language-${language}`);
    if (info.class) {
      $container.addClass(info.class);
      addLineNumbersIfNecessary($container, code);
    }
  });
}

/**
 * Add line numbers to code block <pre> element
 * @param
 * @param code
 */
function addLineNumbersIfNecessary($container, code: string): void {
  if ($container.hasClass("numberLines")) {
    $container.addClass("line-numbers");
    $container.removeClass("numberLines");
  }

  if ($container.hasClass("line-numbers")) {
    if (!code.trim().length) {
      return;
    }
    const match = code.match(/\n(?!$)/g);
    const lineCount = match ? match.length + 1 : 1;
    let lines = "";
    for (let i = 0; i < lineCount; i++) {
      lines += "<span></span>";
    }
    $container.append(
      `<span aria-hidden="true" class="line-numbers-rows">${lines}</span>`,
    );
  }
}
