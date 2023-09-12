I managed some of the libraries by myself instead of through npm to reduce the overall file size.

**Versions**

```json
{
  "font-awesome": "4.7",
  "katex": "v0.16.8", // Only keep the css and fonts files.
  "mermaid": "10.4.0", // https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js
  "reveal": "4.6.0",
  "vega-embed": "6.22.2", // https://cdn.jsdelivr.net/npm/vega-embed@6.22.2/build/vega-embed.min.js
  "wavedrom": "2.9.1"
}
```

_Attention_: Need to remove `font: inherit;` from `reveal.css`. Otherwise, `KaTeX` and `MathJax` will have trouble rendering. Also don't forget to add the empty file `none.css`.

_Attention_: Don't forget to modify the `dependentLibraryMaterials` variable in `markdown-engine.ts`
