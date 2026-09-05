import { escape } from 'html-escaper';
// https://github.com/KaTeX/KaTeX/blob/main/contrib/mhchem/README.md
import katex from 'katex';
import 'katex/contrib/mhchem';
import LruCache from '../lib/lru-cache';
import { MathRenderingOption } from '../notebook';

// tslint:disable-next-line interface-over-type-literal
export type ParseMathArgs = {
  content: string;
  openTag: string;
  closeTag: string;
  displayMode?: boolean;
  renderingOption: MathRenderingOption;
  katexConfig: katex.KatexOptions;
};

/**
 * KaTeX output cache. Documents typically repeat the same formulas on every
 * preview update, and KaTeX rendering dominates the update cost for
 * math-heavy notes. The key includes a fingerprint of the KaTeX config, so
 * config changes miss the cache; entries are bounded for predictable memory.
 * Oversized formulas are rendered but not cached.
 */
const KATEX_CACHE_MAX_ENTRIES = 1000;
const KATEX_CACHE_MAX_CONTENT_LENGTH = 16 * 1024;
const katexCache = new LruCache(KATEX_CACHE_MAX_ENTRIES);
// Most calls share one config object, so memoize its JSON fingerprint
// instead of re-stringifying it for every formula.
let lastKatexConfig: katex.KatexOptions | null = null;
let lastKatexConfigFingerprint = '';

function getKatexConfigFingerprint(katexConfig: katex.KatexOptions): string {
  if (katexConfig !== lastKatexConfig) {
    lastKatexConfig = katexConfig;
    // Function-valued options (e.g. a custom `trust` callback) are dropped
    // by plain JSON.stringify, which would collide distinct configs;
    // stringify them by source instead.
    lastKatexConfigFingerprint = JSON.stringify(
      katexConfig,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (_key: string, value: any) =>
        typeof value === 'function' ? value.toString() : value,
    );
  }
  return lastKatexConfigFingerprint;
}

function renderKatexCached(
  content: string,
  displayMode: boolean,
  katexConfig: katex.KatexOptions,
): string {
  const key = `${getKatexConfigFingerprint(katexConfig)}\u0000${displayMode}\u0000${content}`;
  const cached = katexCache.get(key);
  if (cached !== undefined) {
    return cached;
  }
  let html: string;
  try {
    html = katex.renderToString(
      content,
      Object.assign(
        {},
        // NOTE: strucutredClone is necessary here: https://github.com/shd101wyy/vscode-markdown-preview-enhanced/issues/1853
        // it seems like KaTeX will modify the config object,
        // which will cause `JSON.stringify` in `generateHTMLTemplateForPreview` function in `markdown-engine/index.ts` to fail
        structuredClone(katexConfig),
        { displayMode },
      ),
    );
  } catch (error) {
    return `<span style="color: #ee7f49; font-weight: 500;">${String(error)}</span>`;
  }
  if (content.length <= KATEX_CACHE_MAX_CONTENT_LENGTH) {
    katexCache.set(key, html);
  }
  return html;
}

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
  katexConfig,
}: ParseMathArgs) => {
  if (!content) {
    return '';
  }
  if (renderingOption === 'KaTeX') {
    return renderKatexCached(content, displayMode, katexConfig);
  } else if (renderingOption === 'MathJax') {
    const text = (openTag + content + closeTag).replace(/\n/g, ' ');
    const tag = displayMode ? 'div' : 'span';
    return `<${tag} class="mathjax-exps">${escape(text)}</${tag}>`;
  } else {
    return '';
  }
};
