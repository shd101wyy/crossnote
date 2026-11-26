import { jsonForScript } from '../lib/json-for-script';

/**
 * The script that starts the presentation of an exported document — built
 * separately so that a test can run it in a browser.
 *
 * A PDF export is laid out by reveal.js, which moves every slide into a page
 * and sizes and centers the page from the slide as it finds it. A page with
 * Mermaid diagrams is started once they are drawn: the script that draws them
 * ends by calling `window.__crossnoteDiagramsDrawn`. So no diagram is drawn in
 * a slide that is being moved, and every page is laid out around its diagrams.
 * Until Reveal is started, the slides are as wide as the window; they are
 * given the width of the presentation — on paper a slide has it, where it is
 * a number — for a diagram is drawn as wide as its slide.
 */
export function buildPresentationInitScript({
  presentationConfig,
  notesPlugin,
  hasMermaid,
}: {
  /** The `presentation` configuration of the document (its front matter). */
  presentationConfig: Record<string, unknown>;
  /** The global the speaker notes plugin is known by, when the page loads it. */
  notesPlugin?: string;
  /** The page has the script that draws Mermaid diagrams. */
  hasMermaid: boolean;
}): string {
  const initialize = `Reveal.initialize(Object.assign(${jsonForScript({
    margin: 0.1,
    // reveal.js 5+ shows a deck narrower than 435px in its scroll view;
    // an exported presentation stays paginated as before when it is
    // opened in a narrow window (the front matter still opts in).
    scrollActivationWidth: null,
    ...presentationConfig,
  })}, ${notesPlugin ? `{ plugins: [${notesPlugin}] }` : '{}'}))`;

  // reveal.js reports that the pages of a PDF export are laid out. The export
  // through Chrome waits for it.
  const reportPrintLayout = `Reveal.addEventListener('pdf-ready', () => { window.__crossnotePrintLayoutReady = true })`;

  if (!hasMermaid) {
    return `<script>
      ${reportPrintLayout}
      ${initialize}
    </script>`;
  }

  // The print view of reveal.js, as far as it can be told before Reveal is
  // started. reveal.js is in it when the address has `print-pdf` (as a PDF
  // export through Chrome has) or says `view=print`, which overrules the
  // `view` of the presentation. The address is read the way reveal.js reads
  // it, so that the two agree on every address.
  const printView = `(() => {
    const query = {}
    location.search.replace(/[A-Z0-9]+?=([\\w.%-]*)/gi, parameter => {
      const [name, value] = parameter.split('=')
      query[name] = unescape(value)
      return parameter
    })
    const view = 'view' in query ? query.view : ${jsonForScript(presentationConfig['view'])}
    return /print-pdf/gi.test(location.search) || view === 'print'
  })()`;
  const slideWidth = jsonForScript(presentationConfig['width'] ?? 960);

  return `<script type="module">
  if (${printView}) {
    const slides = document.querySelector('.reveal .slides')
    const width = ${slideWidth}
    slides.style.width = typeof width === 'number' ? width + 'px' : width
    await new Promise(resolve => { window.__crossnoteDiagramsDrawn = resolve })
  }
  ${reportPrintLayout}
  ${initialize}
</script>`;
}
