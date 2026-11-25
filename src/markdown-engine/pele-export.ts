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

// Mark the scheme of the page where the styles look for it (<body
// data-preview-theme>, as the preview marks it): pele's own colors are for a
// light page, and the stylesheet switches them on a dark one. A document is
// shown on a canvas under <html>, and the canvas is white: <body> is read
// where it is painted, else <html>, and a page that paints neither — with
// the none.css preview theme — is a light one, black text on white. The
// preview takes a page that paints nothing for dark instead
// (isBackgroundColorLight in src/webview/lib/utility.ts): it does not sit on
// a canvas but in the app around it, which is dark by default.
function markColorScheme() {
  // A background as [r, g, b, a], whichever form the page wrote it in —
  // rgb(), oklch() or a color-mix() — with a fractional a kept: one pixel of
  // a canvas holds it. Where the engine has no canvas, rgb() and rgba() are
  // read from the text.
  var canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  var context = canvas.getContext && canvas.getContext('2d')
  var rgbaOf = function (color) {
    try {
      if (context) {
        context.clearRect(0, 0, 1, 1)
        context.fillStyle = color
        context.fillRect(0, 0, 1, 1)
        var pixel = context.getImageData(0, 0, 1, 1).data
        return [pixel[0], pixel[1], pixel[2], pixel[3] / 255]
      }
    } catch (error) {
      // Read from the text, as where there is no canvas.
    }
    var numbers = color.match(/-?\\d*\\.?\\d+(?:e[-+]?\\d+)?/gi)
    if (!numbers || numbers.length < 3) {
      return null
    }
    var srgb = /^color\\(srgb/.test(color) ? 255 : 1
    return [
      Number(numbers[0]) * srgb,
      Number(numbers[1]) * srgb,
      Number(numbers[2]) * srgb,
      numbers.length > 3 ? Number(numbers[3]) : 1
    ]
  }
  var schemeOf = function (color) {
    var rgba = rgbaOf(color)
    // Nothing showing of it is not a background.
    if (!rgba || rgba[3] === 0) {
      return null
    }
    // What is not opaque shows the canvas, which is white, through it.
    var a = rgba[3]
    var over = function (channel) { return channel * a + 255 * (1 - a) }
    var luminance = 0.299 * over(rgba[0]) + 0.587 * over(rgba[1]) + 0.114 * over(rgba[2])
    return luminance > 128 ? 'light' : 'dark'
  }
  var scheme = schemeOf(getComputedStyle(document.body).backgroundColor) ||
    schemeOf(getComputedStyle(document.documentElement).backgroundColor) ||
    'light'
  document.body.setAttribute('data-preview-theme', scheme)
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
