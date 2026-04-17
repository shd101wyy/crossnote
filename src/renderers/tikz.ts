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
  } catch {
    // Module not available (browser/web environment)
    tex2svg = null;
  }
  return tex2svg;
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
        texPackages: options?.texPackages,
        tikzLibraries: options?.tikzLibraries,
        addToPreamble: options?.addToPreamble,
      });
      return svg;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return `<pre class="language-text"><code>TikZ error: ${escape(msg)}</code></pre>`;
    }
  });
}
