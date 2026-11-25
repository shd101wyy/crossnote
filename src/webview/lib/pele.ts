import { escape } from 'html-escaper';
import type { PeleRenderer } from '../../lib/pele';
import { sanitizeHtml } from './sanitize';

/**
 * Pele diagrams in the preview: `div.pele` nodes, each holding the Mermaid
 * syntax of a `pele` code block, drawn by the `pele` global of the vendored
 * bundle (`dependencies/pele/pele.global.js`).
 *
 * Unlike Mermaid (`./mermaid.ts`), pele draws synchronously and measures its
 * labels on a canvas rather than in the page: nothing here waits, so a node
 * cannot leave the document halfway through, and a diagram does not depend on
 * the zoom of the preview, on transforms of its ancestors, or on its slide
 * being laid out. It also takes about a millisecond, so nothing is cached.
 */

/** What a diagram that cannot be drawn is replaced with in the preview. */
function peleErrorHtml(error: unknown): string {
  return `<pre class="language-text"><code>${escape(
    String(error),
  )}</code></pre>`;
}

/** Diagrams drawn so far: each gets its own id prefix. */
let drawn = 0;

/**
 * Draw the diagram in `node`, its source being its text, and mark the node
 * drawn. A diagram that cannot be drawn is replaced by its error, as text —
 * pele's errors quote the diagram source.
 */
export function renderPeleDiagram(
  node: HTMLElement,
  pele: PeleRenderer | undefined = window['pele'] as PeleRenderer | undefined,
): void {
  const code = (node.textContent ?? '').trim();
  node.setAttribute('data-processed', 'true');
  if (!code) {
    // Nothing to draw in an empty block.
    node.textContent = '';
    return;
  }
  if (!pele) {
    node.innerHTML = peleErrorHtml(new Error('pele is not loaded.'));
    return;
  }

  // Pele sizes a node from the width it measures the label at, so a label is
  // to be drawn in the font it was measured in: `--pele-font` when the page
  // sets it — pele's own way of choosing a font — and else the font of the
  // page, which is what the label is drawn in otherwise.
  const style = getComputedStyle(node);
  const fontFamily =
    style.getPropertyValue('--pele-font').trim() || style.fontFamily.trim();
  const fontFamilyMono = style.getPropertyValue('--pele-font-mono').trim();

  try {
    const { svg } = pele.render(code, {
      idPrefix: `pele-${++drawn}-`,
      fontFamily: fontFamily || undefined,
      fontFamilyMono: fontFamilyMono || undefined,
    });
    // Pele escapes what it draws, but its output is third-party markup built
    // from untrusted diagram source, so it goes through the sanitizer like
    // every other rendered diagram.
    node.innerHTML = sanitizeHtml(svg);
  } catch (error) {
    node.innerHTML = peleErrorHtml(error);
  }
}

/**
 * Draw the pele diagrams under `root` that were not drawn before: those of
 * the whole preview, or of every slide of a presentation at once.
 */
export function renderPeleDiagrams(
  root: ParentNode,
  pele: PeleRenderer | undefined = window['pele'] as PeleRenderer | undefined,
): void {
  root
    .querySelectorAll<HTMLElement>('div.pele:not([data-processed])')
    .forEach((node) => renderPeleDiagram(node, pele));
}
