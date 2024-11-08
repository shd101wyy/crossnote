I managed some of the libraries by myself instead of through npm to reduce the overall file size.

**Versions**

```json
{
  "font-awesome": "6.4.2", // Download from here: https://fontawesome.com/download
  // Fontawesome cheatsheet is available here: https://kapeli.com/cheat_sheets/Font_Awesome.docset/Contents/Resources/Documents/index
  "katex": "v0.16.11", // Only keep the css and fonts files.
  "mermaid": "11.4.0", // https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js
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
