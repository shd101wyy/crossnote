import { escape } from 'html-escaper';

/** Give up on a diagram that mermaid has not rendered within this time. */
export const MERMAID_RENDER_TIMEOUT_MS = 30_000;

/** What a diagram that failed to render is replaced with in the preview. */
export function mermaidErrorHtml(error: unknown): string {
  return `<pre class="language-text"><code>${escape(
    String(error),
  )}</code></pre>`;
}

/** Whether an element takes part in layout; a detached or `display: none` element does not. */
function isRendered(element: HTMLElement): boolean {
  return element.isConnected && element.getClientRects().length > 0;
}

/**
 * The element Mermaid lays one diagram out in. Remove it once the diagram has
 * been rendered.
 *
 * Mermaid draws into a temporary `<svg>` inside this element and sizes the
 * diagram from what it measures there, so it has to be a place where the
 * diagram's own styles are in effect and where measurements come in the units
 * Mermaid compares them with:
 *
 * - It hangs off `node`, the diagram's element in the preview, so that styles
 *   scoped to the preview apply while Mermaid measures. Under `<body>` they do
 *   not: the `vue` theme's `.markdown-preview p { line-height: 1.6rem }` makes
 *   a wrapped label taller once the diagram is in place than when it was
 *   measured, and its last line is cut off
 *   (vscode-markdown-preview-enhanced#2454).
 * - It goes under `<body>` instead when the node cannot be measured in: when
 *   it is not being rendered (`display: none`, a closed `<details>` on older
 *   Chromium), or when an ancestor of it is transformed or zoomed, which
 *   scales what is measured in the node but not what Mermaid compares it with.
 * - It is a throwaway child of `node` rather than `node` itself, because
 *   Mermaid empties its container and keeps rendering into it after the call
 *   has timed out, which must not touch what the preview shows in `node`. (It
 *   is detached together with `node`; `renderMermaidDiagram` checks for that.)
 * - It is as wide as `<body>` (by `offsetWidth`), where Mermaid's own element
 *   used to be, because some diagrams (gantt) lay themselves out to the width
 *   of their container.
 */
export function createMermaidMeasureHost(node: HTMLElement): HTMLElement {
  const host = document.createElement('div');

  // A block under <body> is exactly as wide as the element Mermaid measured in
  // before. Its rect is that width in screen pixels.
  const probe = document.body.appendChild(document.createElement('div'));
  const width = probe.offsetWidth;
  const scale = width ? probe.getBoundingClientRect().width / width : 0;
  probe.remove();

  host.style.cssText = `position: fixed; left: 0; top: 0; visibility: hidden; width: ${width}px;`;
  node.appendChild(host);
  const inNodeScale = host.offsetWidth
    ? host.getBoundingClientRect().width / host.offsetWidth
    : 0;
  if (!isRendered(node) || Math.abs(inNodeScale - scale) >= 0.01) {
    document.body.appendChild(host);
  }
  return host;
}

/**
 * Render one parsed Mermaid diagram into `node`.
 *
 * @returns the rendered SVG, or `null` when it must not be used. Rendering
 *          failed or timed out, in which case the error is written into
 *          `node`; or the node was detached or stopped being rendered while
 *          Mermaid measured in it (the preview refreshed meanwhile), in which
 *          case the SVG is not the diagram, and `node` is left as it is for
 *          the next refresh.
 */
export async function renderMermaidDiagram(
  mermaid: Pick<Window['mermaid'], 'render'>,
  node: HTMLElement,
  code: string,
  svgId: string,
): Promise<string | null> {
  let host: HTMLElement | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    host = createMermaidMeasureHost(node);
    const measuredInNode = host.parentElement === node;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error('Mermaid rendering timed out')),
        MERMAID_RENDER_TIMEOUT_MS,
      );
    });
    const { svg } = await Promise.race([
      mermaid.render(svgId, code, host),
      timeout,
    ]);
    if (measuredInNode && !isRendered(node)) {
      return null;
    }
    node.innerHTML = svg;
    return svg;
  } catch (error) {
    node.innerHTML = mermaidErrorHtml(error);
    return null;
  } finally {
    clearTimeout(timer);
    host?.remove();
  }
}
