/**
 * Pele in Node — for the exports that cannot run scripts in a page: the
 * pandoc ones (docx, epub, …) and the markdown export.
 *
 * The preview and the HTML / PDF exports load
 * `dependencies/pele/pele.global.js` with a `<script>` tag and render there
 * (`src/webview/lib/pele.ts`, `src/markdown-engine/pele-export.ts`). Here the
 * same file is evaluated as a script. That works without a DOM: pele measures
 * label text on a canvas when there is one and from a built-in width table
 * otherwise. The `pele` package itself is ESM-only and declares Node ≥ 20, so
 * it is not a dependency; `test/pele-vendor.test.ts` keeps the vendored build
 * honest about the Node 18 floor.
 */
import * as fs from 'fs';
import { evaluatePeleBundle } from '../lib/pele-bundle';
import type { PeleRenderer } from '../lib/pele';
import * as path from 'path';
import { getCrossnoteBuildDirectory } from '../utility';

export type { PeleRenderer };
export { evaluatePeleBundle };

/** What was loaded, and from which file: the build directory can be set later. */
let loaded: { from: string; pele: PeleRenderer | null } | undefined;

/**
 * The `pele` global of the vendored browser build (`dependencies/pele/pele.global.js`),
 * evaluated once per file, or `null` when the file is missing or does not
 * evaluate.
 */
export function loadPele(): PeleRenderer | null {
  const from = path.resolve(
    getCrossnoteBuildDirectory(),
    'dependencies/pele/pele.global.js',
  );
  if (loaded?.from === from) {
    return loaded.pele;
  }
  let pele: PeleRenderer | null = null;
  try {
    pele = evaluatePeleBundle(fs.readFileSync(from, 'utf8'));
  } catch (error) {
    console.warn(`[crossnote] pele could not be loaded from ${from}:`, error);
  }
  loaded = { from, pele };
  return pele;
}

/**
 * Replace every `var(--x)` and `var(--x, fallback)` in the attribute values of
 * `svg` by a concrete value.
 *
 * Pele themes a diagram with CSS variables. The root `<svg>` declares them in
 * its `style` attribute, each as the fallback of a `--pele-*` variable that
 * the page may set. The rasterizers behind the png exports (librsvg in sharp,
 * ImageMagick) have no CSS variables — they draw an unresolved `var()` as
 * black — so the values are written out first. A `--pele-*` variable takes its
 * value from `variables`, as the page would set it, and is otherwise its
 * fallback: one of pele's defaults, which are made for a light page. Text
 * content is left alone: a label that says `var(--x)` keeps saying it.
 */
export function inlineCssVariables(
  svg: string,
  variables: Record<string, string> = {},
): string {
  const rootStyle = svg.match(/^<svg\b[^>]*\sstyle="([^"]*)"/)?.[1] ?? '';
  const declarations = new Map<string, string>();
  for (const match of rootStyle.matchAll(/(--[\w-]+)\s*:\s*([^;]*);?/g)) {
    declarations.set(match[1], match[2].trim());
  }

  const resolved = new Map<string, string>();
  const substitute = (text: string): string =>
    text.replace(
      /var\(\s*(--[\w-]+)\s*(?:,\s*((?:[^()]|\([^()]*\))*))?\s*\)/g,
      (_whole, name: string, fallback: string | undefined) => {
        // A variable is looked up once: one that refers to itself resolves to
        // nothing instead of recursing.
        if (!resolved.has(name)) {
          resolved.set(name, '');
          const declared =
            name in variables ? variables[name] : declarations.get(name);
          if (declared !== undefined) {
            resolved.set(name, substitute(declared));
          }
        }
        return resolved.get(name) || fallback || '';
      },
    );

  return svg.replace(/<[a-zA-Z][^<>]*>/g, (tag) =>
    tag.replace(/"[^"]*"/g, (attributeValue) => substitute(attributeValue)),
  );
}

/**
 * Draw Mermaid syntax with pele, as an SVG for a rasterizer: its colors made
 * concrete (pele's light defaults), on an opaque white background — the image
 * is shown on whatever the reader's page is. Throws when the diagram cannot be
 * parsed or drawn.
 */
export function renderPele(code: string): string {
  const pele = loadPele();
  if (!pele) {
    throw new Error(
      'pele is missing from the crossnote build directory (dependencies/pele/pele.global.js).',
    );
  }
  const svg = inlineCssVariables(pele.render(code).svg);
  const root = svg.match(/^<svg\b[^>]*>/);
  if (!root) {
    return svg;
  }
  return `${root[0]}<rect width="100%" height="100%" fill="#ffffff"/>${svg.slice(root[0].length)}`;
}
