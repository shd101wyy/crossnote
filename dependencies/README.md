I managed many libraries by myself instead of through npm to reduce overall file size.

**Versions**

```json
{
  "crypto-js": "3.9.1-1",
  "font-awesome": "4.7",
  "JavaScript-MD5": "2.7.0",
  "jquery-contextmenu": "2.6.3",
  "jquery-modal": "0.8.0",
  "jquery": "v3.2.1",
  "katex": "v0.16.8",
  "markdown-it": "8.4.2",
  "MathJax": "v2.7.5",
  "mermaid": "10.4.0", // https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js
  "prism": "1.29.0"
  "reveal": "4.10.0",
  "vega-embed": "6.2.1",
  "vega-lite": "4.0.2",
  "vega": "5.9.0",
  "viz": "v2.0.0",
  "wavedrom": "2.9.1",
}
```

_Attention_: Need to remove `font: inherit;` from `reveal.css`. Otherwise `KaTeX` and `MathJax` will have trouble rendering. Also don't forget to add the empty file `none.css`.

_Attention_: Need to append `.mermaid` to all selectors in `mermaid.css`, `mermaid.dark.css`, and `mermaid.forest.css`. Otherwise it will pollute `viz` graph.

_Attention_: To add mhchem support to katex, we have to modify `contrib/mhchem.min.js` and replace `require("katex")` to `require("../katex.min.js")`

_Attention_: Don't forget to modify the `dependentLibraryMaterials` variable in `markdown-engine.ts`
