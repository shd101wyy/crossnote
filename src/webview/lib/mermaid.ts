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
 * Render one parsed Mermaid diagram into the preview node it belongs to.
 *
 * `node` is handed to `mermaid.render` as its container on purpose. Mermaid
 * lays a diagram out inside a temporary `<svg>`, measuring every label there
 * and then clipping the label to what it measured. Without a container that
 * svg hangs off `<body>`, where styles scoped to the preview do not apply —
 * the `vue` theme's `.markdown-preview p { line-height: 1.6rem }` for one —
 * so a wrapped label grows once the diagram is inserted and loses its last
 * line (vscode-markdown-preview-enhanced#2454). Rendering in `node` measures
 * under the styles the diagram is displayed with, exactly as `mermaid.run()`
 * does for the HTML export.
 *
 * Mermaid empties `node` itself before rendering, and leaves its temporary
 * `#d<svgId>` container behind when a render fails midway; either way that
 * container is a child of `node`, so writing the result replaces it.
 *
 * @returns the rendered SVG, or `null` when rendering failed or timed out —
 *          the error is then written into `node`.
 */
export async function renderMermaidDiagram(
  mermaid: Pick<Window['mermaid'], 'render'>,
  node: HTMLElement,
  code: string,
  svgId: string,
): Promise<string | null> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error('Mermaid rendering timed out')),
      MERMAID_RENDER_TIMEOUT_MS,
    ),
  );
  try {
    const { svg } = await Promise.race([
      mermaid.render(svgId, code, node),
      timeout,
    ]);
    node.innerHTML = svg;
    return svg;
  } catch (error) {
    node.innerHTML = mermaidErrorHtml(error);
    return null;
  }
}
