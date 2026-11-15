import type { NotebookConfig } from '../notebook/types';

/** Build the async export script separately so its readiness can be tested in Chromium. */
export function buildMermaidExportScript(
  config: Pick<
    NotebookConfig,
    'mermaidConfig' | 'mermaidTheme' | 'jsdelivrCdnHost'
  >,
  hasZenUML: boolean,
): string {
  return `
// Page load and data-processed do not imply that Mermaid's layout is complete.
window.__crossnoteMermaidExport = { status: 'pending' }
try {
// Disable the load listener before an external module can yield control.
mermaid.startOnLoad = false
// TODO: If ZenUML gets integrated into mermaid in the future,
//      we can remove the following lines.
${
  hasZenUML
    ? `const { default: zenuml } = await import('https://${config.jsdelivrCdnHost}/npm/@mermaid-js/mermaid-zenuml@0.1.0/dist/mermaid-zenuml.esm.min.mjs');
await mermaid.registerExternalDiagrams([zenuml])`
    : ``
}

var MERMAID_CONFIG = (${JSON.stringify(config.mermaidConfig)});
if (typeof MERMAID_CONFIG !== 'undefined') {
  MERMAID_CONFIG.startOnLoad = false
  MERMAID_CONFIG.cloneCssStyles = false
  MERMAID_CONFIG.theme = "${config.mermaidTheme}"
}

mermaid.initialize(MERMAID_CONFIG || {})
// Complete the initial pass before Reveal can start separate renders.
await mermaid.run({
  nodes: document.querySelectorAll('div.mermaid')
})
if (typeof(window['Reveal']) !== 'undefined') {
  function mermaidRevealHelper(event) {
    var currentSlide = event.currentSlide
    var diagrams = currentSlide.querySelectorAll('div.mermaid')
    for (var i = 0; i < diagrams.length; i++) {
      var diagram = diagrams[i]
      if (!diagram.hasAttribute('data-processed')) {
        mermaid.init(null, diagram, ()=> {
          Reveal.slide(event.indexh, event.indexv)
        })
      }
    }
  }
  Reveal.addEventListener('slidetransitionend', mermaidRevealHelper)
  Reveal.addEventListener('ready', mermaidRevealHelper)
}
window.__crossnoteMermaidExport = { status: 'complete' }
} catch (error) {
  window.__crossnoteMermaidExport = {
    status: 'error',
    message: String(error && error.message || error)
  }
  console.error(error)
}
`;
}
