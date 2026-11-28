/**
 * Helpers for emitting the client-side MathJax configuration.
 *
 * Kept in a dependency-free module so it can be unit-tested (jest) and
 * exercised in a real browser (Playwright) without pulling in the whole
 * markdown engine.
 */
import { jsonForScript } from '../lib/json-for-script';

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
  return `window.MathJax = (${jsonForScript(mathJaxConfig)});
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

/**
 * The configuration MathJax is given for a note: that of the notebook, with
 * the math delimiters, and told to leave the sources of diagrams alone.
 *
 * MathJax typesets the page before the diagrams are drawn, and the source of
 * a diagram is text in the page until then: MathJax takes what stands
 * between two `$` of it for a formula. The diagram is then drawn from a
 * source that is no longer the one written, and a `$$…$$` a mermaid label
 * holds never reaches mermaid's own math. So it leaves alone the elements a
 * mermaid or a pele diagram is drawn from, and those an interactive vega
 * diagram is read from. (MathJax leaves `pre` and `code` alone by itself.)
 *
 * The classes it leaves alone are named in the options of the document
 * (`options.ignoreHtmlClass`) — not in those of the tex input — as one
 * pattern of alternatives. Whatever the configuration names, as a pattern or
 * as a list, is kept; what is named replaces MathJax's own `mathjax_ignore`,
 * which stays when nothing is named.
 */
export function mathJaxConfigOf(
  mathJaxConfig: Record<string, unknown>,
  config: { mathInlineDelimiters: string[][]; mathBlockDelimiters: string[][] },
): Record<string, unknown> {
  const options = mathJaxConfig['options'] as
    | Record<string, unknown>
    | undefined;
  const ignored = options?.['ignoreHtmlClass'];
  const named = (Array.isArray(ignored) ? ignored : [ignored]).filter(Boolean);
  return {
    ...mathJaxConfig,
    tex: {
      ...(mathJaxConfig['tex'] as Record<string, unknown> | undefined),
      inlineMath: config.mathInlineDelimiters,
      displayMath: config.mathBlockDelimiters,
    },
    options: {
      ...options,
      // One pattern of alternatives, with MathJax's own class unless the
      // configuration names others.
      ignoreHtmlClass: [
        ...(named.length > 0 ? named : ['mathjax_ignore']),
        'mermaid',
        'pele',
        'vega',
        'vega-lite',
      ].join('|'),
    },
  };
}
