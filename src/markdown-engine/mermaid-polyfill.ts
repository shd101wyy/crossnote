/**
 * Two globals that the oldest supported webview (VS Code 1.82, Electron 25 /
 * Chromium 114) lacks and the mermaid bundle calls. Each is defined only
 * where it does not exist.
 *
 * `URL.canParse` (Chromium 120) is the one diagrams with a link meet.
 * Since mermaid 11.0 its URL sanitizer calls it for every `http(s)` link it
 * is asked about: a `click` with a link on a flowchart, a class diagram or a
 * gantt at every security level but `loose`, and `links` in a sequence
 * diagram at every level. Where the global is missing, the diagram throws
 * `TypeError: URL.canParse is not a function` and is not drawn.
 * The shim answers as the spec does: whether `new URL(url, base)` succeeds.
 *
 * `Object.groupBy` (Chromium 117) is the other. Mermaid ≥ 12.1 calls it
 * through its bundled chevrotain parser. Today the calls sit in chevrotain's
 * grammar-analysis code, which common diagrams don't reach, but which
 * mermaid version calls them from where changes without notice, so the
 * bundle-level guard test treats the API as a runtime risk on the floor
 * webview regardless.
 *
 * Scope of that one: the shim accepts arrays only, not the spec's arbitrary
 * iterables — both call sites in the mermaid bundle (chevrotain's
 * duplicate-productions analysis) pass plain arrays. A non-array-like
 * input yields an empty group object rather than the spec's TypeError;
 * nothing in crossnote's pages can reach the shim with such a value.
 *
 * The vendored `dependencies/mermaid/mermaid.min.js` must stay
 * byte-identical to the official CDN dist (see `dependencies/README.md`),
 * so the shim is shipped as its own script tag, emitted immediately
 * before the mermaid bundle at every site that loads it (preview,
 * presentation, HTML export / Open in Browser — offline and CDN). It is
 * a no-op wherever both already exist.
 */
export const MERMAID_LEGACY_WEBVIEW_POLYFILL = `<script>if(!Object.groupBy){Object.groupBy=function(e,t){var r=Object.create(null);for(var i=0;i<e.length;i++){var k=t(e[i],i);if(typeof k!=="symbol"){k=String(k)}if(!(k in r)){r[k]=[]}r[k].push(e[i])}return r}}if(!URL.canParse){URL.canParse=function(e){try{return new URL(e,arguments[1]),!0}catch(t){return!1}}}</script>`;
