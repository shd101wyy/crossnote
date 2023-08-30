I managed some of the libraries by myself instead of through npm to reduce the overall file size.

**Versions**

```json
{
  "font-awesome": "4.7",

  // ----------------------------------------------------------
  // Remove the following libraries after migrating the webview
  "jquery-contextmenu": "2.6.3",
  "jquery-modal": "0.8.0",
  "jquery": "v3.2.1",
  // ----------------------------------------------------------

  "katex": "v0.16.8",
  "MathJax": "v2.7.5",
  "mermaid": "10.4.0", // https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js
  "prism": "1.29.0", // https://prismjs.com/download.html Then select all languages
  "reveal": "4.10.0",
  "vega-embed": "6.22.2", // https://cdn.jsdelivr.net/npm/vega-embed@6.22.2/build/vega-embed.min.js
  "vega-lite": "5.14.1", // https://cdn.jsdelivr.net/npm/vega-lite@latest/build/vega-lite.min.js
  "vega": "5.25.0", // https://cdn.jsdelivr.net/npm/vega@latest/build/vega.min.js
  "wavedrom": "2.9.1"
}
```

_Attention_: Need to remove `font: inherit;` from `reveal.css`. Otherwise, `KaTeX` and `MathJax` will have trouble rendering. Also don't forget to add the empty file `none.css`.

_Attention_: To add mhchem support to katex, we have to modify `contrib/mhchem.min.js` and replace `require("katex")` to `require("../katex.min.js")`

_Attention_: Don't forget to modify the `dependentLibraryMaterials` variable in `markdown-engine.ts`
