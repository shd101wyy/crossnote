import { resolve } from "path";
import { scopeForLanguageName } from "../extension-helper";
import { BlockInfo } from "../lib/block-info";
import { escapeString, extensionDirectoryPath } from "../utility";

let Prism;

export default async function enhance($: CheerioStatic): Promise<void> {
  // spaced code blocks
  // this is for pandoc parser
  $("pre>code").each((i, codeElement) => {
    const $codeElement = $(codeElement);
    const code = $codeElement.text();
    const $container = $codeElement.parent();
    $codeElement.replaceWith(escapeString(code));
    $container.addClass("language-text");
  });

  // fenced code blocks
  $('[data-role="codeBlock"]').each((i, container) => {
    const $container = $(container);

    // hide this code block if hide=true in options or if any of previous enhances told so
    const hidden =
      $container.data("hiddenByEnhancer") ||
      ($container.data("normalizedInfo") as BlockInfo).attributes["hide"] ===
        true;
    if (hidden) {
      $container.remove();
      return;
    }

    // extract code text
    const code = $container.text();

    // determine code language
    const info: BlockInfo = $container.data("normalizedInfo");
    const language = guessPrismLanguage(
      scopeForLanguageName(info.language),
      code,
    );

    // try use Prism syntax highlighter
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
      // ...or regarded as plain text on failure
      $container.empty().append($(`<code></code>`).text(code));
    }

    $container.addClass(`language-${language}`);
    if (info.attributes["class"]) {
      $container.addClass(info.attributes["class"]);
      addLineNumbersIfNecessary($container, code);
    }
    // check highlight
    if (info.attributes["highlight"]) {
      highlightLines($container, code, info.attributes["highlight"]);
    }

    // previously used data is no longer needed, so removing it to reduce output size
    $container.removeAttr("data-parsed-info");
    $container.removeAttr("data-normalized-info");
  });
}

/**
 * helps color special cases (e.g. vega / vega lite json and yaml)
 * @param language
 * @param code
 */
function guessPrismLanguage(language: string, code: string) {
  if (language === "vega" || language === "vega-lite") {
    const firstChar = code.match(/^\s*(.)/)[1];
    return firstChar === "{" ? "json" : "yaml";
  }
  return language;
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

/**
 * https://github.com/shd101wyy/mume/issues/97
 * @param $container
 * @param code
 * @param highlight
 */
function highlightLines(
  $container: Cheerio,
  code: string,
  highlight: string | string[] | number,
): void {
  if (!code.trim().length) {
    return;
  }
  if (typeof highlight === "number") {
    highlight = [highlight.toString()];
  } else if (typeof highlight === "string") {
    highlight = highlight.split(",");
  }
  const highlightElements = [];
  highlight.forEach((h) => {
    h = h.toString();
    if (h.indexOf("-") > 0) {
      const [start, end] = h.split("-").map((x) => parseInt(x, 10));
      if (isNaN(start) || isNaN(end)) {
        return;
      }
      let lineBreaks = "";
      for (let i = start; i <= end; i++) {
        lineBreaks += "\n";
      }
      let preLineBreaks = "";
      for (let i = 0; i < start - 1; i++) {
        preLineBreaks += "\n";
      }
      highlightElements.push(
        `<div class="line-highlight-wrapper">${preLineBreaks}<div aria-hidden="true" class="line-highlight" data-range="${start}-${end}" data-start="${start}" data-end="${end}">${lineBreaks}</div></div>`,
      );
    } else {
      let preLineBreaks = "";
      const start = parseInt(h, 10);
      if (isNaN(start)) {
        return;
      }
      for (let i = 0; i < start - 1; i++) {
        preLineBreaks += "\n";
      }
      highlightElements.push(
        `<div class="line-highlight-wrapper">${preLineBreaks}<div aria-hidden="true" class="line-highlight" data-range="${h}" data-start="${h}">${"\n"}</div></div>`,
      );
    }
  });
  $container.append(highlightElements.join(""));
  $container.attr("data-line", highlight.join(","));
}
