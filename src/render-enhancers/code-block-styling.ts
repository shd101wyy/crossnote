import { escape } from 'html-escaper';
import { BlockInfo } from '../lib/block-info/index';
import { scopeForLanguageName } from '../markdown-engine/extension-helper';
import defineIeleLanguage from '../prism/iele';
import defineKLanguage from '../prism/k';
import Prism from '../prism/prism';

Prism.hooks.add('wrap', (env) => {
  if (env.type !== 'keyword') {
    return;
  }
  env.classes.push(`keyword-${env.content}`);
});
// loadLanguages(); // Load all languages

// Add K and Iele languages syntax highlighting
defineKLanguage(Prism);
defineIeleLanguage(Prism);

export default async function enhance($: CheerioStatic): Promise<void> {
  // spaced code blocks
  // this is for pandoc parser
  $('pre>code').each((i, codeElement) => {
    const $codeElement = $(codeElement);
    const code = $codeElement.text();
    const $container = $codeElement.parent();
    $codeElement.replaceWith(escape(code));
    $container.addClass('language-text');
  });

  // fenced code blocks
  $('[data-role="codeBlock"]').each((i, container) => {
    const $container = $(container);

    // hide this code block if hide=true in options or if any of previous enhances told so
    const hidden =
      $container.data('hiddenByEnhancer') ||
      ($container.data('normalizedInfo') as BlockInfo).attributes['hide'] ===
        true;
    if (hidden) {
      $container.remove();
      return;
    }

    // extract code text
    const code = $container.text();

    // determine code language
    const info: BlockInfo = $container.data('normalizedInfo');
    const language = guessPrismLanguage(
      scopeForLanguageName(info.language),
      code,
    );

    // try use Prism syntax highlighter
    try {
      const html = Prism.highlight(code, Prism.languages[language], language);
      $container.empty().append($(`<code></code>`).html(html));
    } catch (error) {
      // ...or regarded as plain text on failure
      $container.empty().append($(`<code></code>`).text(code));
    }

    $container.addClass(`language-${language || 'text'}`);
    if (info.attributes['class']) {
      $container.addClass(info.attributes['class']);
      addLineNumbersIfNecessary($container, code);
    }
    // check highlight
    if (info.attributes['highlight']) {
      highlightLines($container, code, info.attributes['highlight']);
    }

    // previously used data is no longer needed, so removing it to reduce output size
    $container.removeAttr('data-parsed-info');
    $container.removeAttr('data-normalized-info');
  });
}

/**
 * helps color special cases (e.g. vega / vega lite json and yaml)
 * @param language
 * @param code
 */
function guessPrismLanguage(language: string, code: string) {
  if (language === 'vega' || language === 'vega-lite') {
    const firstChar = (code.match(/^\s*(.)/) ?? [])[1];
    return firstChar === '{' ? 'json' : 'yaml';
  }
  return language;
}

/**
 * Add line numbers to code block <pre> element
 * @param
 * @param code
 */
function addLineNumbersIfNecessary($container, code: string): void {
  if ($container.hasClass('numberLines')) {
    $container.addClass('line-numbers');
    $container.removeClass('numberLines');
  }

  if ($container.hasClass('line-numbers')) {
    if (!code.trim().length) {
      return;
    }
    const match = code.match(/\n(?!$)/g);
    const lineCount = match ? match.length + 1 : 1;
    let lines = '';
    for (let i = 0; i < lineCount; i++) {
      lines += '<span></span>';
    }
    $container.append(
      `<span aria-hidden="true" class="line-numbers-rows">${lines}</span>`,
    );
  }
}

/**
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
  if (typeof highlight === 'number') {
    highlight = [highlight.toString()];
  } else if (typeof highlight === 'string') {
    highlight = highlight.split(',');
  }
  const match = code.match(/\n(?!$)/g);
  const lineCount = match ? match.length + 1 : 1;
  const highlightElements: string[] = [];
  highlight.forEach((h) => {
    h = h.toString();
    if (h.indexOf('-') > 0) {
      let [start, end] = h.split('-').map((x) => parseInt(x, 10));
      if (isNaN(start) || isNaN(end) || start < 0 || end < 0) {
        return;
      }
      if (start > end) {
        [start, end] = [end, start];
      }
      if (end > lineCount) {
        return;
      }
      let lineBreaks = '';
      for (let i = start; i <= end; i++) {
        lineBreaks += '\n';
      }
      let preLineBreaks = '';
      for (let i = 0; i < start - 1; i++) {
        preLineBreaks += '\n';
      }
      highlightElements.push(
        `<div class="line-highlight-wrapper">${preLineBreaks}<div aria-hidden="true" class="line-highlight" data-range="${start}-${end}" data-start="${start}" data-end="${end}">${lineBreaks}</div></div>`,
      );
    } else {
      let preLineBreaks = '';
      const start = parseInt(h, 10);
      if (isNaN(start) || start < 0 || start > lineCount) {
        return;
      }
      for (let i = 0; i < start - 1; i++) {
        preLineBreaks += '\n';
      }
      highlightElements.push(
        `<div class="line-highlight-wrapper">${preLineBreaks}<div aria-hidden="true" class="line-highlight" data-range="${h}" data-start="${h}">${'\n'}</div></div>`,
      );
    }
  });
  $container.append(highlightElements.join(''));
  $container.attr('data-line', highlight.join(','));
}
