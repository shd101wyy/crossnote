/**
 * The webview bundle posts messages through `acquireVsCodeApi()` when it is
 * available. Outside VS Code (serve server, standalone wiki) every preview
 * lives in an iframe, so this shim is injected before `preview.js` loads and
 * forwards messages to the parent, which relays them to the HTTP server or
 * serves them from the embedded wiki payload.
 *
 * @param targetOriginExpression a JS expression evaluated inside the iframe:
 *   `'window.location.origin'` for the serve server (same-origin frames) or
 *   `"'*'"` for the sandboxed, opaque-origin frames of a wiki file.
 */
export function previewHostShimScript(targetOriginExpression: string): string {
  return `<script>
(function () {
  if (window.acquireVsCodeApi) { return; }
  var api = null;
  window.acquireVsCodeApi = function () {
    if (api) { return api; }
    api = {
      postMessage: function (message) {
        window.parent.postMessage(message, ${targetOriginExpression});
      },
      getState: function () {
        try {
          return JSON.parse(localStorage.getItem('crossnote-preview-state') || 'null');
        } catch (error) { return null; }
      },
      setState: function (state) {
        try {
          localStorage.setItem('crossnote-preview-state', JSON.stringify(state));
        } catch (error) { /* storage unavailable */ }
      },
    };
    return api;
  };
  document.addEventListener('keydown', function (event) {
    var key = event.key.toLowerCase();
    var action = null;
    if ((event.metaKey || event.ctrlKey) && !event.altKey && key === 'p') {
      action = 'open-file-picker';
    } else if ((event.metaKey || event.ctrlKey) && !event.altKey && key === '\\\\') {
      action = 'split-pane';
    } else if (event.altKey && key === 'w') {
      action = 'close-tab';
    }
    if (action) {
      event.preventDefault();
      window.parent.postMessage(
        { command: '__serverAppShortcut', args: [action] },
        ${targetOriginExpression}
      );
    }
  }, true);
})();
</script>`;
}
