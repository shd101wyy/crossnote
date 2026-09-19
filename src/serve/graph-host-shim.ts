/**
 * The graph view webview bundle posts messages through
 * `acquireVsCodeApi()`. Outside VS Code the graph view runs as a page of
 * the serve server (fed by `/api/graph`) or inside the standalone wiki
 * (fed by data embedded in the file) — always in an iframe of the app, so
 * this shim answers the protocol itself and relays node clicks to the app,
 * which opens the note in a pane.
 */
export function graphHostShimScript(options: {
  /**
   * `'fetch'` — load the graph from `${dataUrl}?file=<page file>` (serve
   * server). `'embedded'` — read `window.__CROSSNOTE_WIKI_GRAPH__`, which
   * the wiki shell injects before this script (sandboxed frame, opaque
   * origin, so every message uses `'*'`).
   */
  source: 'fetch' | 'embedded';
  /** Serve only: the `/api/graph` URL. */
  dataUrl?: string;
  /** Serve only: the anchor file of the page, from `?file=`. */
  fileExpression?: string;
  /** Wiki only: JS expression yielding the anchor note key. */
  embeddedFileExpression?: string;
}): string {
  const isFetch = options.source === 'fetch';
  const fileExpression = isFetch
    ? (options.fileExpression ?? "''")
    : (options.embeddedFileExpression ?? "''");
  const dataUrl = options.dataUrl ?? '/api/graph';
  const targetOrigin = isFetch ? 'window.location.origin' : "'*'";
  const loadData = isFetch
    ? `fetch(${JSON.stringify(dataUrl)} + '?file=' + encodeURIComponent(FILE))
          .then(function (response) {
            if (!response.ok) { throw new Error('graph request failed'); }
            return response.json();
          })`
    : `Promise.resolve(globalThis.__CROSSNOTE_WIKI_GRAPH__ || null)`;
  return `<script>
(function () {
  if (globalThis.acquireVsCodeApi) { return; }
  var api = null;
  var FILE = ${fileExpression};
  globalThis.acquireVsCodeApi = function () {
    if (api) { return api; }
    api = {
      postMessage: function (message) {
        if (!message || typeof message.command !== 'string') { return; }
        if (message.command === 'graphViewReady') {
          ${loadData}
            .then(function (payload) {
              if (!payload) { throw new Error('no graph data'); }
              globalThis.postMessage({
                command: 'graphData',
                data: payload.data,
                activeFilePath: payload.activeFilePath,
              }, '*');
            })
            .catch(function () {
              globalThis.postMessage({
                command: 'graphData',
                data: { hash: '', nodes: [], links: [] },
                activeFilePath: '',
              }, '*');
            });
          return;
        }
        if (message.command === 'openFile') {
          var rel = message.args && message.args[0];
          if (typeof rel === 'string') {
            globalThis.parent.postMessage(
              {
                command: '__serverAppOpenFile',
                args: [FILE, String(rel).replace(/\\\\/g, '/')],
              },
              ${targetOrigin}
            );
          }
          return;
        }
        if (message.command === 'saveSetting') {
          var setting = message.args && message.args[0];
          if (setting && typeof setting.key === 'string') {
            try {
              localStorage.setItem(
                'crossnote.graphView.' + setting.key,
                JSON.stringify(setting.value === undefined ? null : setting.value)
              );
            } catch (error) { /* storage unavailable */ }
          }
          return;
        }
      },
      getState: function () {
        try {
          return JSON.parse(localStorage.getItem('crossnote.graphView.state') || 'null');
        } catch (error) { return null; }
      },
      setState: function (state) {
        try {
          localStorage.setItem('crossnote.graphView.state', JSON.stringify(state));
        } catch (error) { /* storage unavailable */ }
      },
    };
    return api;
  };
})();
</script>`;
}
