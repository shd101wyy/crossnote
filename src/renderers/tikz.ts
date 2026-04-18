import { escape } from 'html-escaper';
import { Mutex } from 'async-mutex';

export interface TikzRenderOptions {
  /**
   * Additional TeX packages to load.
   * @example { pgfplots: '', amsmath: 'intlimits' }
   */
  texPackages?: Record<string, string>;

  /**
   * Additional TikZ libraries to load.
   * @example 'arrows.meta,calc'
   */
  tikzLibraries?: string;

  /**
   * Additional source code to add to the preamble.
   */
  addToPreamble?: string;

  /**
   * Print the TeX engine console output to stderr. Useful for debugging
   * when a diagram fails to render. Defaults to false.
   */
  showConsole?: boolean;

  /**
   * Embed a font CSS `@import` in the SVG so TeX fonts render correctly.
   * Defaults to true. Set `fontCssUrl` to override the font stylesheet URL.
   */
  embedFontCss?: boolean;

  /**
   * URL for the font CSS stylesheet embedded when `embedFontCss` is true.
   * Defaults to the jsDelivr CDN copy of node-tikzjax's fonts.css.
   */
  fontCssUrl?: string;
}

/**
 * Returned when node-tikzjax is not available (e.g., in browser/web
 * environments). Callers should fall back to client-side rendering.
 */
export const TIKZ_NOT_AVAILABLE = Symbol('TIKZ_NOT_AVAILABLE');

// node-tikzjax warns against running multiple instances simultaneously.
const mutex = new Mutex();

// Lazy-loaded tex2svg function from node-tikzjax.
let tex2svg:
  | ((input: string, options?: TikzRenderOptions) => Promise<string>)
  | null
  | undefined;

async function loadTex2Svg() {
  if (tex2svg !== undefined) return tex2svg;
  try {
    const mod = await import('node-tikzjax');
    // Handle both ESM and CJS interop: the actual tex2svg function
    // may be at mod.default (ESM) or mod.default.default (CJS via dynamic import).
    // At runtime, mod.default can be the module namespace object rather than
    // a function, despite what the .d.ts declares.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const defaultExport: any = mod.default;
    tex2svg =
      typeof defaultExport === 'function'
        ? defaultExport
        : defaultExport?.default;
  } catch (err) {
    // Module not available (browser/web environment) or WASM data files missing.
    // Log to help diagnose silent failures in bundled environments.
    console.error('[crossnote] node-tikzjax failed to load:', err);
    tex2svg = null;
  }
  return tex2svg;
}

/**
 * Base TeX packages that are safe to load for every TikZ render.
 * These are lightweight math/font packages unlikely to conflict.
 */
const BASE_TEX_PACKAGES: Record<string, string> = {
  amsmath: '',
  amstext: '',
  amsfonts: '',
  amssymb: '',
  array: '',
};

/**
 * Mapping of code patterns to the TeX package required to render them.
 * These packages are heavier and only loaded when detected in the source.
 */
const AUTO_DETECT_PACKAGES: Array<{
  pattern: RegExp;
  pkg: string;
  opts?: string;
}> = [
  { pattern: /\\begin\{tikzcd\}/, pkg: 'tikz-cd' },
  {
    pattern:
      /\\begin\{axis\}|\\begin\{semilogxaxis\}|\\begin\{semilogyaxis\}|pgfplots/,
    pkg: 'pgfplots',
  },
  { pattern: /\\begin\{circuitikz\}/, pkg: 'circuitikz' },
  { pattern: /\\chemfig|\\schemestart/, pkg: 'chemfig' },
  { pattern: /\\tdplotsetmaincoords|tdplot_/, pkg: 'tikz-3dplot' },
];

function inferPackages(code: string): Record<string, string> {
  const pkgs: Record<string, string> = {};
  for (const { pattern, pkg, opts } of AUTO_DETECT_PACKAGES) {
    if (pattern.test(code)) {
      pkgs[pkg] = opts ?? '';
    }
  }
  return pkgs;
}

/**
 * Render TikZ source code to SVG using node-tikzjax (Node.js only).
 *
 * Returns `TIKZ_NOT_AVAILABLE` if node-tikzjax cannot be loaded, or an
 * HTML error string if rendering fails.
 */
export async function renderTikz(
  code: string,
  options?: TikzRenderOptions,
): Promise<string | typeof TIKZ_NOT_AVAILABLE> {
  const fn = await loadTex2Svg();
  if (!fn) return TIKZ_NOT_AVAILABLE;

  return mutex.runExclusive(async () => {
    try {
      // node-tikzjax expects \begin{document}...\end{document} wrapping.
      // Wrap automatically if the user didn't include it.
      let input = code;
      if (!input.includes('\\begin{document}')) {
        input = `\\begin{document}\n${input}\n\\end{document}`;
      }
      const svg = await fn(input, {
        // Base packages + auto-detected packages + user-specified packages.
        // User-specified packages take the highest precedence.
        texPackages: {
          ...BASE_TEX_PACKAGES,
          ...inferPackages(input),
          ...options?.texPackages,
        },
        tikzLibraries: options?.tikzLibraries,
        addToPreamble: options?.addToPreamble,
        showConsole: options?.showConsole ?? false,
        // Embed font CSS by default so TeX fonts render correctly in previews.
        embedFontCss: options?.embedFontCss ?? true,
        fontCssUrl: options?.fontCssUrl,
      });
      return svg;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return `<pre class="language-text"><code>TikZ error: ${escape(msg)}</code></pre>`;
    }
  });
}
