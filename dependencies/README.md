I managed many libraries by myself instead of through npm to reduce overall file size.

**Versions**
```json
{
    "mermaid": "7.0.0",
    "plantuml": "1.2018.1",
    "wavedrom": "1.4.1",
    "reveal": "3.5.0",
    "viz": "v1.8.0",
    "MathJax": "v2.7.1",
    "jquery": "v3.2.1",
    "jquery-contextmenu": "2.6.3",
    "markdown-it": "8.3.2",
    "JavaScript-MD5": "2.7.0",
    "katex": "0.9.0",
    "crypto-js": "3.9.1-1",
    "jquery-modal": "0.8.0",
    "node-html-pdf": "commit 543a918d1c11cefc713b2d38983eb63cc1d347fe",
    "vega": "3.1.0",
    "vega-lite": "2.1.3",
    "ditaa": "0.10",
    "font-awesome": "4.7",
    "flowchart": "1.7.0",
    "raphael.js": "2.2.7",
    "js-sequence-diagrams": "2.0.1",
    "webfont": "1.6.28",
    // "snap.svg": "0.5.1", // <= Doesn't work well in Preview. Use raphael.js instead
    "underscore": "1.8.3",
    "prism": "1.14.0"
}
```  

*Attention*: Need to add `window.WaveSkin = WaveSkin` at the end of **wavedrom/default.js**

*Attention*: Need to remove `font: inherit;` from `reveal.css`. Otherwise `KaTeX` and `MathJax` will have trouble rendering.

**cheerio 0.20.0** has bug rendering subgraph html(). `div` inside `svg` will be self-closed automatically, which is wrong. Therefore I downgrade it to 0.15.0

**cheerio 0.22.0** is buggy, restore to 0.15.0.  

*Attention*: Need to append `.mermaid ` to all selectors in `mermaid.css`, `mermaid.dark.css`, and `mermaid.forest.css`. Otherwise it will pollute `viz` graph.

*Attention*: Need to modify `pdf_a4_portrait.js` file to make it work with *MathJax*.

*Attention*: **mpld3.v0.3.min.js** min version actually has problem, so use not minified version.  

*Attention*: For **node-html-pdf**, I modified the `pdf.js` file so that `phantomjs-prebuilt` will not be required.  