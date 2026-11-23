import { escape } from 'html-escaper';

/** Give up on a diagram that mermaid has not rendered within this time. */
export const MERMAID_RENDER_TIMEOUT_MS = 30_000;

/** What a diagram that failed to render is replaced with in the preview. */
export function mermaidErrorHtml(error: unknown): string {
  return `<pre class="language-text"><code>${escape(
    String(error),
  )}</code></pre>`;
}

/**
 * The element Mermaid lays one diagram out in. Remove it once the diagram has
 * been rendered.
 *
 * Mermaid draws into a temporary `<svg>` inside this element and sizes the
 * diagram from what it measures there, so it has to be a place where the
 * diagram's own styles are in effect and nothing else skews the measurement:
 *
 * - It hangs off `node`, the diagram's element in the preview, so that styles
 *   scoped to the preview apply while Mermaid measures. Under `<body>` they do
 *   not: the `vue` theme's `.markdown-preview p { line-height: 1.6rem }` makes
 *   a wrapped label taller once the diagram is in place than when it was
 *   measured, and its last line is cut off
 *   (vscode-markdown-preview-enhanced#2454). A node that is not being rendered
 *   (`display: none`, a closed `<details>` on older Chromium) cannot be
 *   measured in, so for those the element goes under `<body>` after all.
 * - It is a throwaway child of `node` rather than `node` itself, because
 *   Mermaid empties its container, keeps rendering into it after this call has
 *   timed out, and measures wrongly in one that has been detached in the
 *   meantime — as `node` is whenever the preview refreshes.
 * - It is as wide as `<body>`, where Mermaid's own element used to be, because
 *   some diagrams (gantt) lay themselves out to the width of their container.
 */
export function createMermaidMeasureHost(node: HTMLElement): HTMLElement {
  const host = document.createElement('div');

  // A block under <body> is exactly as wide as the element Mermaid measured in
  // before.
  const probe = document.body.appendChild(document.createElement('div'));
  const width = probe.offsetWidth;
  probe.remove();

  host.style.cssText = `position: fixed; left: 0; top: 0; visibility: hidden; width: ${width}px;`;
  (node.getClientRects().length ? node : document.body).appendChild(host);
  return host;
}

/**
 * Render one parsed Mermaid diagram into `node`.
 *
 * @returns the rendered SVG, or `null` when rendering failed or timed out —
 *          the error is then written into `node`. An SVG whose `node` was
 *          detached while rendering (the preview refreshed meanwhile) was
 *          measured in a detached document and must not be cached.
 */
export async function renderMermaidDiagram(
  mermaid: Pick<Window['mermaid'], 'render'>,
  node: HTMLElement,
  code: string,
  svgId: string,
): Promise<string | null> {
  const host = createMermaidMeasureHost(node);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error('Mermaid rendering timed out')),
      MERMAID_RENDER_TIMEOUT_MS,
    );
  });
  try {
    const { svg } = await Promise.race([
      mermaid.render(svgId, code, host),
      timeout,
    ]);
    node.innerHTML = svg;
    return svg;
  } catch (error) {
    node.innerHTML = mermaidErrorHtml(error);
    return null;
  } finally {
    clearTimeout(timer);
    host.remove();
  }
}
