/**
 * Mermaid ≥ 12.1 (through its bundled chevrotain parser) calls
 * `Object.groupBy`, which first shipped in Chromium 117 — but the oldest
 * supported VS Code (1.82) renders webviews with Electron 25 /
 * Chromium 114, where that call throws. Today the calls sit in
 * chevrotain's grammar-analysis code, which common diagrams don't reach,
 * but which mermaid version calls them from where changes without
 * notice, so the bundle-level guard test treats the API as a runtime
 * risk on the floor webview regardless.
 *
 * The vendored `dependencies/mermaid/mermaid.min.js` must stay
 * byte-identical to the official CDN dist (see `dependencies/README.md`),
 * so the shim is shipped as its own script tag, emitted immediately
 * before the mermaid bundle at every site that loads it (preview,
 * presentation, HTML export / Open in Browser — offline and CDN). It is
 * a no-op wherever `Object.groupBy` already exists.
 */
export const MERMAID_LEGACY_WEBVIEW_POLYFILL = `<script>if(!Object.groupBy){Object.groupBy=function(e,t){var r=Object.create(null);for(var i=0;i<e.length;i++){var k=t(e[i],i);if(typeof k!=="symbol"){k=String(k)}if(!(k in r)){r[k]=[]}r[k].push(e[i])}return r}}</script>`;
