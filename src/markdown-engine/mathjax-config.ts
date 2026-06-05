/**
 * Helpers for emitting the client-side MathJax configuration.
 *
 * Kept in a dependency-free module so it can be unit-tested (jest) and
 * exercised in a real browser (Playwright) without pulling in the whole
 * markdown engine.
 */

// a11y document options that MathJax 4's combined component resets to their
// defaults during startup. The `startup.ready` hook below re-applies whichever
// of these the user configured onto the live MathDocument.
const A11Y_OPTION_KEYS = [
  'enableEnrichment',
  'enableSpeech',
  'enableBraille',
  'enableComplexity',
  'enableExplorer',
  'enableAssistiveMml',
  'enableMenu',
];

/**
 * Build the inline `window.MathJax = (...)` configuration script.
 *
 * Besides serializing the config, this wraps `startup.ready` so the a11y
 * toggles in `mathjaxConfig.options` (most importantly `enableEnrichment`) are
 * actually honored. MathJax 4's combined `tex-mml-chtml` component resets these
 * flags to their defaults while augmenting the MathDocument at startup, so
 * setting them in the config block alone has no effect — the only reliable
 * place to apply them is on the live document *after* it is built. Disabling
 * enrichment removes the speech-rule-engine work that otherwise dominates every
 * typeset and makes formula-heavy previews slow to refresh
 * (shd101wyy/vscode-markdown-preview-enhanced#2312).
 */
export function buildMathJaxConfigScript(
  mathJaxConfig: Record<string, unknown>,
): string {
  return `window.MathJax = (${JSON.stringify(mathJaxConfig)});
(function () {
  var cfg = window.MathJax;
  cfg.startup = cfg.startup || {};
  // Capture any user-supplied ready hook now; MathJax replaces window.MathJax
  // with its live API during startup, so inside the hook we must reach for the
  // *current* window.MathJax.startup (which has defaultReady/document), not the
  // captured config object.
  var userReady = cfg.startup.ready;
  cfg.startup.ready = function () {
    var startup = window.MathJax.startup;
    if (typeof userReady === 'function') {
      userReady();
    } else {
      startup.defaultReady();
    }
    var doc = startup.document;
    var wanted =
      (window.MathJax.config && window.MathJax.config.options) || {};
    if (doc && doc.options) {
      var keys = ${JSON.stringify(A11Y_OPTION_KEYS)};
      for (var i = 0; i < keys.length; i++) {
        if (Object.prototype.hasOwnProperty.call(wanted, keys[i])) {
          doc.options[keys[i]] = wanted[keys[i]];
        }
      }
    }
  };
})();`;
}
