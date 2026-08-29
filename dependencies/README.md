I managed some of the libraries by myself instead of through npm to reduce the overall file size.

**Versions**

```json
{
  "font-awesome": "6.4.2", // Download from here: https://fontawesome.com/download
  // Fontawesome cheatsheet is available here: https://kapeli.com/cheat_sheets/Font_Awesome.docset/Contents/Resources/Documents/index
  "katex": "v0.16.47", // Only keep the css and fonts files.
  "mermaid": "11.17.2", // see "Updating the vendored mermaid bundle" below
  // https://www.jsdelivr.com/package/npm/mermaid
  "reveal": "4.6.0",

  // NOTE: Don't forget to update `dependentLibraryMaterials` in `markdown-engine/index.ts`
  "vega-embed": "6.23.0", // https://cdn.jsdelivr.net/npm/vega-embed@6.23.0/build/vega-embed.min.js
  // HACK: Needs to replace `structuredClone` to `globalThis.structuredClone` in `vega-lite.min.js`
  // HACK: Needs to replace `require("vega")` to `require("../vega/vega.min.js")` in `vega-lite.min.js`
  "vega-lite": "5.16.1", // https://cdn.jsdelivr.net/npm/vega-lite@5.16.1/build/vega-lite.min.js
  "vega": "5.25.0", // https://cdn.jsdelivr.net/npm/vega@5.25.0/build/vega.min.js

  "wavedrom": "3.3.0" // - https://cdn.jsdelivr.net/npm/wavedrom@3.3.0/wavedrom.min.js
}
```

_Attention_: Need to remove `font: inherit;` from `reveal.css`. Otherwise, `KaTeX` and `MathJax` will have trouble rendering. Also don't forget to add the empty file `none.css`.

_Attention_: Don't forget to modify the `dependentLibraryMaterials` variable in `markdown-engine.ts`

_Attention_: NOTE: We have to disable the `_self = window` line in `prism.js` to make it work with VSCode web extension.

## Updating the vendored mermaid bundle

`dependencies/mermaid/mermaid.min.js` is mermaid's **official dist build** downloaded from jsDelivr (e.g. <https://cdn.jsdelivr.net/npm/mermaid@11.17.2/dist/mermaid.min.js>). Do **not** re-bundle mermaid locally with esbuild — the committed file must be byte-identical to the CDN file so the `__esbuild_esm_mermaid_nm` IIFE wrapper and the trailing `globalThis["mermaid"] = ...` assignment match what mermaid ships.

To update mermaid:

1. `pnpm add mermaid@<new-version>` — updates `package.json` + `pnpm-lock.yaml`.
2. `node scripts/update-mermaid-bundle.mjs` — downloads the matching official dist bundle from jsDelivr into `dependencies/mermaid/mermaid.min.js` (uses the version installed in `node_modules`; an explicit version can be passed as an argument). Equivalent to manually downloading `https://cdn.jsdelivr.net/npm/mermaid@<version>/dist/mermaid.min.js` and copying it to `dependencies/mermaid/mermaid.min.js`.
3. Update the mermaid version in the CDN fallback script URL in `src/markdown-engine/index.ts` (`mermaid@<version>/dist/mermaid.min.js`).
4. Update the version list above and add a `CHANGELOG.md` entry.
