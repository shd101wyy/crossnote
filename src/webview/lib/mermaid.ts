import { escape } from 'html-escaper';
import { sanitizeMermaidSvg } from './sanitize';

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
 * Wide enough for the width it measures as to tell zooms that are next to 1
 * in single precision apart, and to pin down the zoom of `<body>` to within
 * one such number. Firefox stops laying widths out beyond 2<sup>30</sup>
 * app units (about 17.9 million CSS pixels), and this width at the largest
 * zoom of the preview is still below that.
 */
const ZOOM_PROBE_WIDTH = 2 ** 21;

/** The distance from 1 to the next number in single precision above it. */
const STEP_ABOVE_ONE = 2 ** -23;

/**
 * `value`, moved by `stepsInSinglePrecision` to the next numbers that can be
 * written in single precision.
 *
 * Mind how things are named in this file: Tailwind scans it for class names,
 * words in comments included, and styles whatever it finds that is a class of
 * its own.
 */
function floatNeighbour(value: number, stepsInSinglePrecision: number): number {
  const view = new DataView(new ArrayBuffer(4));
  view.setFloat32(0, value);
  view.setUint32(0, view.getUint32(0) + stepsInSinglePrecision);
  return view.getFloat32(0);
}

/**
 * How much wider than `ZOOM_PROBE_WIDTH` an element of that width measures in
 * `element`: 0 where a width in CSS pixels measures as that number.
 */
function zoomDeviation(element: HTMLElement): number {
  const probe = document.createElement('div');
  probe.style.width = `${ZOOM_PROBE_WIDTH}px`;
  element.appendChild(probe);
  const deviation = probe.getBoundingClientRect().width - ZOOM_PROBE_WIDTH;
  probe.remove();
  return deviation;
}

/**
 * Render `host` in the top layer, where the transforms of its ancestors do not
 * reach it: the scale Reveal puts on the slides of a presentation, or one set
 * by user styles, would scale what is measured in the host but not what
 * Mermaid compares it with. The styles of the host still come from where it
 * is in the document. Not every engine has a top layer, and showing can be
 * refused; there the transforms apply.
 */
function showInTopLayer(host: HTMLElement): void {
  // `popover` hides an element that is not shown, so it is only kept when the
  // host is in the top layer. An engine without popovers throws, and showing
  // is refused without throwing when a `beforetoggle` listener cancels it.
  try {
    host.setAttribute('popover', 'manual');
    host.showPopover();
    if (host.matches(':popover-open')) {
      return;
    }
  } catch {
    // Not shown in the top layer.
  }
  host.removeAttribute('popover');
}

/**
 * Make widths written in CSS pixels measure as those numbers in `host`, and
 * return the element in it for Mermaid to measure in; `null` when it cannot be
 * done.
 *
 * The preview's zoom is a CSS `zoom` on `<body>`, which the host inherits. In
 * current engines it scales what `getBoundingClientRect()` reports, so a
 * label at its `max-width` of 120px measures as 120 times the zoom: never
 * equal to what Mermaid compares it with, so no label is ever wrapped
 * (crossnote#566). The zoom of the host undoes it, but only at the right
 * number: zooms are single-precision numbers in the engine and are multiplied
 * in single precision, and the product has to be exactly 1. At other products
 * close by Mermaid measures a 120px label as 119.99999px (Chromium four
 * numbers above 1, WebKit one below), so which number does is found by trying
 * the reciprocal of the zoom and its neighbouring single-precision numbers
 * and measuring, not by assuming.
 *
 * The product skips from one step below 1 to one step above it at some zoom
 * levels (1.7, 3.4). A second zoom inside the host, the reciprocal of what
 * the first one came to, makes it exactly 1 then: one zoom cannot be written
 * more precisely than a single-precision number, two can. Whether it makes up
 * for a zoom that user styles put on an ancestor of the node is left to how
 * the numbers fall; where it does not, nothing measures exact and the host
 * ends up under `<body>`.
 *
 * Which number it is depends on the engine; an engine that reports widths
 * unscaled takes the host as it is. That is also what happens on Chromium 114,
 * the engine of VS Code 1.82 to 1.85: there a width this large reports
 * unscaled while a label does not, so labels stay unwrapped at a zoom of the
 * preview there, as before. When nothing measures exact, the zoom of the host
 * is set back and `null` is returned.
 */
function measureExactIn(
  host: HTMLElement,
  bodyZoom: number,
): HTMLElement | null {
  showInTopLayer(host);
  if (zoomDeviation(host) === 0) {
    return host;
  }
  if (!(bodyZoom > 0) || !Number.isFinite(bodyZoom)) {
    return null;
  }
  // The zoom at which the product came out closest above 1, in case no zoom
  // makes it exactly 1.
  let closest: { deviation: number; zoom: string } | undefined;
  const reciprocal = 1 / bodyZoom;
  for (const stepsInSinglePrecision of [0, 1, -1, 2, -2, 3, -3, 4, -4]) {
    const zoom = String(floatNeighbour(reciprocal, stepsInSinglePrecision));
    host.style.zoom = zoom;
    const deviation = zoomDeviation(host);
    if (deviation === 0) {
      return host;
    }
    if (deviation > 0 && (!closest || deviation < closest.deviation)) {
      closest = { deviation, zoom };
    }
  }
  if (!closest) {
    host.style.zoom = '';
    return null;
  }
  host.style.zoom = closest.zoom;

  const stepsAboveOne = Math.round(
    closest.deviation / (ZOOM_PROBE_WIDTH * STEP_ABOVE_ONE),
  );
  const inner = document.createElement('div');
  // The zooms multiply to that many numbers above 1; one that many numbers
  // below 1 makes their product exactly 1.
  inner.style.zoom = String(
    Math.fround(1 / (1 + stepsAboveOne * STEP_ABOVE_ONE)),
  );
  host.appendChild(inner);
  if (zoomDeviation(inner) === 0) {
    return inner;
  }
  inner.remove();
  host.style.zoom = '';
  return null;
}

/** Where Mermaid measures one diagram. */
export interface MermaidMeasureHost {
  /** The element to hand to Mermaid as the one it measures in. */
  container: HTMLElement;
  /** Whether that is inside the diagram's own element. */
  inNode: boolean;
  /** Take the host out of the document. */
  remove(): void;
}

/**
 * The place Mermaid lays one diagram out in. Take it out of the document once
 * the diagram has been rendered.
 *
 * Mermaid draws into a temporary `<svg>` inside this place and sizes the
 * diagram from what it measures there, so it has to be one where the
 * diagram's own styles are in effect and where measurements come in the units
 * Mermaid compares them with:
 *
 * - It hangs off `node`, the diagram's element in the preview, so that styles
 *   scoped to the preview apply while Mermaid measures. Under `<body>` they do
 *   not: the `vue` theme's `.markdown-preview p { line-height: 1.6rem }` makes
 *   a wrapped label taller once the diagram is in place than when it was
 *   measured, and its last line is cut off
 *   (vscode-markdown-preview-enhanced#2454).
 * - It is shown in the top layer, where a transform on an ancestor of the
 *   node — the scale Reveal puts on the slides of a presentation, for one —
 *   does not scale what is measured in it, and its zoom undoes the zoom of
 *   the preview (`measureExactIn`).
 * - It goes under `<body>` instead when widths cannot be made to measure
 *   exact in the node: when the node is not being rendered (`display: none`,
 *   a closed `<details>` on older Chromium), when an ancestor of it has a
 *   transform in an engine without a top layer, or when a zoom of its own is
 *   set on an ancestor of it and cannot be undone as the zoom of the preview
 *   is.
 * - It is a throwaway child of `node` rather than `node` itself, because
 *   Mermaid empties its container and keeps rendering into it after the call
 *   has timed out, which must not touch what the preview shows in `node`. (It
 *   is detached together with `node`; `renderMermaidDiagram` checks for that.)
 * - It is as wide as `<body>` (by `offsetWidth`), where Mermaid's own element
 *   used to be, because some diagrams (gantt) lay themselves out to the width
 *   of their container.
 */
export function createMermaidMeasureHost(
  node: HTMLElement,
): MermaidMeasureHost {
  const host = document.createElement('div');

  // A block under <body> is as wide as the element Mermaid measured in before:
  // both widths are read the same way.
  const probe = document.body.appendChild(document.createElement('div'));
  const width = probe.offsetWidth;
  // The zoom of <body> is measured rather than read from its style, which is
  // reported to six digits: too few to undo a zoom of 1.5883388257531164.
  probe.style.width = `${ZOOM_PROBE_WIDTH}px`;
  const bodyZoom = probe.getBoundingClientRect().width / ZOOM_PROBE_WIDTH;
  probe.remove();

  host.style.cssText = `position: fixed; left: 0; top: 0; visibility: hidden; margin: 0; border: 0; padding: 0; overflow: hidden; width: ${width}px;`;

  if (isRendered(node)) {
    node.appendChild(host);
    const container = measureExactIn(host, bodyZoom);
    if (container) {
      return { container, inNode: true, remove: () => host.remove() };
    }
  }
  document.body.appendChild(host);
  return {
    container: measureExactIn(host, bodyZoom) ?? host,
    inNode: false,
    remove: () => host.remove(),
  };
}

/**
 * Render one parsed Mermaid diagram into `node`.
 *
 * @returns the rendered SVG, sanitized as any HTML written into the page
 *          is, or `null` when it must not be used. Rendering
 *          failed or timed out, in which case the error is written into
 *          `node`. Or the diagram could not be measured in `node`: it was
 *          already out of the document before the call, or it was detached or
 *          stopped being rendered while Mermaid measured in it (the preview
 *          refreshed meanwhile). Such an SVG is not the diagram, and `node`
 *          is left as it is.
 */
export async function renderMermaidDiagram(
  mermaid: Pick<Window['mermaid'], 'render'>,
  node: HTMLElement,
  code: string,
  svgId: string,
): Promise<string | null> {
  if (!node.isConnected) {
    return null;
  }
  let measure: MermaidMeasureHost | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    measure = createMermaidMeasureHost(node);
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error('Mermaid rendering timed out')),
        MERMAID_RENDER_TIMEOUT_MS,
      );
    });
    const { svg } = await Promise.race([
      mermaid.render(svgId, code, measure.container),
      timeout,
    ]);
    if (measure.inNode && !isRendered(node)) {
      return null;
    }
    // What is written into the page, and kept to be written again, goes
    // through the sanitizer as any other HTML of the preview does: what
    // Mermaid drew is content of the note.
    const safeSvg = sanitizeMermaidSvg(svg);
    node.innerHTML = safeSvg;
    return safeSvg;
  } catch (error) {
    node.innerHTML = mermaidErrorHtml(error);
    return null;
  } finally {
    clearTimeout(timer);
    measure?.remove();
  }
}
