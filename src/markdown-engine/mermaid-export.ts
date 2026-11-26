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
// A page can carry the script twice: the first one renders, and the others
// have nothing to add.
if (!window.__crossnoteMermaidExport) {
  await render()
}

async function render() {
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
  MERMAID_CONFIG.theme = MERMAID_CONFIG.theme || "${config.mermaidTheme}"
}

/**
 * Show the diagram's element in the top layer, for Mermaid to measure in, and
 * return what puts it back.
 *
 * A slide Reveal has not loaded is not displayed; it is displayed, invisibly,
 * for as long as the diagram is rendered in it. Without a top layer the scale
 * of the slides reaches the diagram, as before.
 */
function showInTopLayer(diagram) {
  // Styles are written and removed as attributes, not through the style
  // object of an element: Chromium brings an empty style attribute back where
  // a style written through the style object of an element that had no style
  // attribute is removed.
  const cssText = diagram.getAttribute('style')
  const shown = []
  for (let el = diagram; el && el !== document.body; el = el.parentElement) {
    if (getComputedStyle(el).display === 'none') {
      const styleText = el.getAttribute('style')
      shown.push([el, styleText, el.style.visibility])
      el.setAttribute('style', (styleText ? styleText + '; ' : '') + 'display: block; visibility: hidden')
    }
  }
  const style = getComputedStyle(diagram)
  const width = diagram.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
  diagram.setAttribute('popover', 'manual')
  // The top layer gives the element a border and a padding of its own and no
  // width, and a minimum and maximum in percent of the window: it is as wide
  // as it is in its slide, and not shown.
  const styleText = diagram.getAttribute('style')
  diagram.setAttribute('style', (styleText ? styleText + '; ' : '') + 'border: 0; padding: 0; width: ' + width + 'px; min-width: 0; max-width: none; visibility: hidden')
  let inTopLayer = false
  try {
    diagram.showPopover()
    inTopLayer = diagram.matches(':popover-open')
  } catch (error) {
    // No top layer here.
  }
  if (!inTopLayer) {
    diagram.removeAttribute('popover')
  }
  return function () {
    for (const [el, styleText, visibility] of shown) {
      // reveal.js sets the display of a slide it enters or leaves, and never
      // its visibility. Where it has had the slide since, the display is
      // left to it.
      if (el.style.display === 'block' && !el.classList.contains('present')) {
        if (styleText) {
          el.setAttribute('style', styleText)
        } else {
          el.removeAttribute('style')
        }
      } else {
        el.style.visibility = visibility
      }
    }
    diagram.removeAttribute('popover')
    if (cssText) {
      diagram.setAttribute('style', cssText)
    } else {
      diagram.removeAttribute('style')
    }
  }
}

mermaid.initialize(MERMAID_CONFIG || {})
// Only reveal.js is waited for and laid out again: a page that has something
// else under the name Reveal is not a presentation.
const reveal = typeof Reveal !== 'undefined' && typeof Reveal.isReady === 'function' ? Reveal : null
const slides = reveal ? document.querySelector('.reveal .slides') : null
// Reveal scales the slides it has laid out, and Mermaid measures a diagram in
// its element, so that in that scale no label is wrapped (crossnote#575). In a
// presentation the element of each diagram is shown in the top layer for its
// rendering, where the scale does not reach it, as wide as it is in its slide;
// it is done with once Reveal has laid the slides out.
const inSlides = !!slides
// A PDF export has its diagrams drawn before Reveal starts, and its pages laid
// out around them: the script that starts Reveal waits for
// window.__crossnoteDiagramsDrawn (buildPresentationInitScript). Nothing is
// waited for before the diagrams are drawn then, and the slides are not laid
// out again after.
const beforeReveal = typeof window.__crossnoteDiagramsDrawn === 'function'
if (inSlides && !beforeReveal) {
  await new Promise(function (resolve) {
    if (reveal.isReady()) {
      resolve()
    } else {
      reveal.addEventListener('ready', resolve)
    }
  })
}
const diagrams = Array.from(document.querySelectorAll('div.mermaid'))
// Mermaid gives the diagrams of one run ids that differ. A run per diagram
// would give them all the same id where ids are deterministic, and a diagram
// takes the place of the one that has its id.
const groups = MERMAID_CONFIG && MERMAID_CONFIG.deterministicIds ? [diagrams] : diagrams.map(function (diagram) {
  return [diagram]
})
let failure = null
let rendered = false
try {
  for (const group of groups) {
    const restore = []
    try {
      if (inSlides) {
        for (const diagram of group) {
          restore.push(showInTopLayer(diagram))
        }
      }
      await mermaid.run({ nodes: group })
      rendered = true
    } catch (error) {
      failure = failure || error
    } finally {
      for (const undo of restore) {
        undo()
      }
    }
  }
} finally {
  // Reveal centers a slide from the height of its content, which the diagrams
  // have changed.
  if (inSlides && rendered && !beforeReveal) {
    reveal.layout()
  }
  if (beforeReveal) {
    window.__crossnoteDiagramsDrawn()
  }
}
if (failure) {
  throw failure
}
window.__crossnoteMermaidExport = { status: 'complete' }
} catch (error) {
  window.__crossnoteMermaidExport = {
    status: 'error',
    message: String(error && error.message || error)
  }
  console.error(error)
}
}
`;
}
