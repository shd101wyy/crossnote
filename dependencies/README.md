I managed some of the libraries by myself instead of through npm to reduce the overall file size.

**Versions**

```json
{
  "font-awesome": "6.4.2", // Download from here: https://fontawesome.com/download
  // Fontawesome cheatsheet is available here: https://kapeli.com/cheat_sheets/Font_Awesome.docset/Contents/Resources/Documents/index
  "katex": "v0.19.1", // Only keep the css and fonts files.
  "mermaid": "12.3.0", // see "Updating the vendored mermaid bundle" below
  // https://www.jsdelivr.com/package/npm/mermaid
  "reveal": "6.0.2", // see "Updating the vendored reveal.js" below

  // NOTE: Don't forget to update `dependentLibraryMaterials` in `markdown-engine/index.ts`
  "vega-embed": "6.23.0", // https://cdn.jsdelivr.net/npm/vega-embed@6.23.0/build/vega-embed.min.js
  // HACK: Needs to replace `structuredClone` to `globalThis.structuredClone` in `vega-lite.min.js`
  // HACK: Needs to replace `require("vega")` to `require("../vega/vega.min.js")` in `vega-lite.min.js`
  "vega-lite": "5.16.1", // https://cdn.jsdelivr.net/npm/vega-lite@5.16.1/build/vega-lite.min.js
  "vega": "5.25.0", // https://cdn.jsdelivr.net/npm/vega@5.25.0/build/vega.min.js

  "wavedrom": "3.3.0" // - https://cdn.jsdelivr.net/npm/wavedrom@3.3.0/wavedrom.min.js
}
```

_Attention_: `reveal.css` must not contain a `font: inherit;` rule — it would break `KaTeX`/`MathJax` rendering. reveal.js 6 dist ships without one; keep it that way (guarded by `test/reveal-vendor.test.ts`). Also don't forget the `none.css` theme (a comment-only file — it disables theming).

_Attention_: Don't forget to modify the `dependentLibraryMaterials` variable in `markdown-engine.ts`

_Attention_: NOTE: We have to disable the `_self = window` line in `prism.js` to make it work with VSCode web extension.

## Updating the vendored reveal.js

`dependencies/reveal/` holds reveal.js's **official dist files** downloaded from jsDelivr (<https://cdn.jsdelivr.net/npm/reveal.js@<version>/dist/...>), laid out as:

| Vendored path           | jsDelivr dist path      |
| ----------------------- | ----------------------- |
| `js/reveal.js`          | `dist/reveal.js`        |
| `css/reveal.css`        | `dist/reveal.css`       |
| `css/theme/<name>.css`  | `dist/theme/<name>.css` |
| `plugin/notes/notes.js` | `dist/plugin/notes.js`  |

`css/theme/vscode.css` (maps the deck to VS Code CSS variables) and `css/theme/none.css` are MPE-custom and must be carried over on every update. The dist files are byte-identical to the CDN files — do not reformat them.

To update reveal.js:

1. Download the files above from `https://cdn.jsdelivr.net/npm/reveal.js@<new-version>/dist/...` into place (or extract the matching npm tarball).
2. Update the `reveal` version in the version list above and the two CDN fallback URLs in `src/markdown-engine/index.ts` (`reveal.js@<version>/dist/reveal.js` and `reveal.js@<version>/dist/theme/`).
3. Add a `CHANGELOG.md` entry.
4. Check `test/reveal-vendor.test.ts` — it guards the tree (UMD bundle structure, no `font: inherit` in `reveal.css`, theme files ↔ `RevealJsTheme` union, notes plugin present, CDN version match, and no Chromium-116+ API the oldest supported webview lacks).
5. Run the browser presentation suite (`pnpm test:browser`) — `test/browser/presentation.spec.ts` drives the real preview container against the vendored reveal.js.

## Updating the vendored mermaid bundle

`dependencies/mermaid/mermaid.min.js` is mermaid's **official dist build** downloaded from jsDelivr (e.g. <https://cdn.jsdelivr.net/npm/mermaid@12.3.0/dist/mermaid.min.js>). Do **not** re-bundle mermaid locally with esbuild — the committed file must be byte-identical to the CDN file so the `__esbuild_esm_mermaid_nm` IIFE wrapper and the trailing `globalThis["mermaid"] = ...` assignment match what mermaid ships.

To update mermaid:

1. `pnpm add mermaid@<new-version>` — updates `package.json` + `pnpm-lock.yaml`.
2. `node scripts/update-mermaid-bundle.mjs` — downloads the matching official dist bundle from jsDelivr into `dependencies/mermaid/mermaid.min.js` (uses the version installed in `node_modules`; an explicit version can be passed as an argument). Equivalent to manually downloading `https://cdn.jsdelivr.net/npm/mermaid@<version>/dist/mermaid.min.js` and copying it to `dependencies/mermaid/mermaid.min.js`.
3. Update the mermaid version in the CDN fallback script URL in `src/markdown-engine/index.ts` (`mermaid@<version>/dist/mermaid.min.js`).
4. Update the version list above and add a `CHANGELOG.md` entry.
5. Check `test/mermaid-bundle.test.ts` — it fails the bump if the new bundle calls a Chromium-116+ API the oldest supported webview lacks unless `src/markdown-engine/mermaid-polyfill.ts` defines a shim for it.

Note: the `mermaid` npm package itself declares `engines.node >= 22` (recent lines) while crossnote pins Node 18. That is currently harmless — the package is only used for its types (`MermaidConfig`); it is never imported at runtime, and pnpm does not enforce `engines` on install. Do **not** runtime-import `mermaid` from Node code without re-evaluating the Node-18 support floor first.
