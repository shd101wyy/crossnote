/**
 * The script that draws the pele diagrams of an exported document — built
 * separately so that a test can run it in a browser.
 *
 * It does what `renderPeleDiagrams` does in the preview
 * (`src/webview/lib/pele.ts`); keep the two in step — `test/browser/pele.spec.ts`
 * draws the same diagrams with both and compares what comes out. Two
 * differences. A document is drawn once, so a diagram's id prefix can follow
 * its position. And there is no sanitizer in an exported document: pele's
 * output is relied on as mermaid's is — it escapes what it draws and lets a
 * link through only as a web or mail address.
 *
 * Pele draws synchronously, so the script runs where it stands in the
 * document, and nothing has to wait for it: a presentation's diagrams are in
 * place before Reveal lays its slides out.
 */
export function buildPeleExportScript(): string {
  return `
window.__crossnotePeleExport = { status: 'pending' }
try {
if (typeof pele === 'undefined') {
  throw new Error('The pele script is not loaded.')
}

// Mark the scheme of the page where the styles look for it, as the preview
// does (<body data-preview-theme>): pele's own colors are for a light page,
// and the stylesheet switches them on a dark one.
function markColorScheme() {
  // The test of the preview: isBackgroundColorLight in
  // src/webview/lib/utility.ts.
  var rgb = getComputedStyle(document.body).backgroundColor.match(/\\d+/g)
  var luminance = rgb ? 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2] : 0
  document.body.setAttribute('data-preview-theme', luminance > 128 ? 'light' : 'dark')
}
markColorScheme()
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').addEventListener) {
  // An exported document may follow the reader's system color scheme
  // (exportColorScheme: 'auto').
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', markColorScheme)
}

var nodes = document.querySelectorAll('div.pele:not([data-processed])')
for (var i = 0; i < nodes.length; i++) {
  var node = nodes[i]
  node.setAttribute('data-processed', 'true')
  var code = (node.textContent || '').trim()
  if (!code) {
    continue
  }
  var style = getComputedStyle(node)
  var fontFamily = style.getPropertyValue('--pele-font').trim() || style.fontFamily.trim()
  var fontFamilyMono = style.getPropertyValue('--pele-font-mono').trim()
  try {
    node.innerHTML = pele.render(code, {
      idPrefix: 'pele-' + i + '-',
      fontFamily: fontFamily || undefined,
      fontFamilyMono: fontFamilyMono || undefined
    }).svg
  } catch (error) {
    node.innerHTML = '<pre class="language-text"><code>' +
      String(error).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') +
      '</code></pre>'
  }
}
window.__crossnotePeleExport = { status: 'complete' }
} catch (error) {
  window.__crossnotePeleExport = {
    status: 'error',
    message: String(error && error.message || error)
  }
  console.error(error)
}
`;
}
