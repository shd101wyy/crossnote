import { expect, Page, test } from '@playwright/test';
import { build } from 'esbuild';
import * as path from 'path';
import { startServer, TestServer } from './server';

/**
 * The preview renders Mermaid diagrams through `renderMermaidDiagram`
 * (src/webview/lib/mermaid.ts). Mermaid draws into a temporary svg inside the
 * element it is given and sizes the diagram from what it measures there, so
 * these tests run the real helper, bundled for the page, against the real
 * Mermaid.
 */

type MermaidHelper = typeof import('../../src/webview/lib/mermaid');

interface PageGlobals {
  mermaid: Window['mermaid'];
  crossnoteMermaid: MermaidHelper;
}

interface Layout {
  viewBoxWidth: number;
  /** Width and height of every label box, in svg units. */
  labelBoxes: number[][];
}

interface RenderedDiagram extends Layout {
  /** The rendered SVG: the same string whenever the diagram is laid out the same. */
  svg: string;
  bodyWidth: number;
  nodeWidth: number;
  /** The same diagram laid out with Mermaid's element under `<body>`. */
  onBody?: Layout;
  /** By how much each label runs past the bottom of the element that clips it. */
  labelOverflowBottom: number[];
}

const FLOWCHART = `flowchart TB
    Entry["应用与路由入口层 (src/main.tsx · src/app.tsx · src/app.config.ts)"] --> Store["响应式状态矩阵与路由容器 (src/store/matrixStore.tsx)"]
    Entry --> Pages["12 个一级/二级页面视图层 (src/pages/*/index.tsx)"]
    Pages --> Components["无头交互与公共组件层 (src/components/*)"]
    Pages --> Release["Release notes are written after the feature freeze and reviewed by the docs team"]`;

const GANTT = `gantt
    title A Gantt Diagram
    dateFormat YYYY-MM-DD
    section Section
    A task :a1, 2024-01-01, 30d
    Another task :after a1, 20d`;

/**
 * Every zoom level the preview steps through, with the numbers it reaches
 * them by: 0.1 is added to and subtracted from 1 forty times.
 */
const ZOOM_LEVELS: number[] = (() => {
  const levels: number[] = [];
  let up = 1;
  let down = 1;
  for (let step = 0; step < 40; step++) {
    up = Math.min(up + 0.1, 5);
    down = Math.max(down - 0.1, 0.2);
    levels.push(up, down);
  }
  return [...new Set(levels)];
})();

let server: TestServer;

test.beforeAll(async () => {
  server = await startServer();
});

test.afterAll(async () => {
  await server?.close();
});

/** Load Mermaid and the real helper, as `window.crossnoteMermaid`, into the page. */
async function loadMermaid(page: Page): Promise<void> {
  await page.goto(server.url);
  await page.addScriptTag({ url: `${server.url}/mermaid/mermaid.min.js` });
  const { outputFiles } = await build({
    entryPoints: [path.resolve(__dirname, '../../src/webview/lib/mermaid.ts')],
    bundle: true,
    format: 'iife',
    globalName: 'crossnoteMermaid',
    write: false,
  });
  await page.addScriptTag({ content: outputFiles[0].text });
}

/**
 * Render `source` through the helper into a diagram node inside a
 * `.markdown-preview` container, the way the preview does it.
 */
async function renderDiagram(
  page: Page,
  {
    source,
    containerWidth,
    containerTransform,
    containerZoom,
    containerHidden = false,
    zoom = 1,
    compareOnBody = false,
  }: {
    source: string;
    containerWidth?: string;
    /** A CSS `transform` for the container, as user styles might set. */
    containerTransform?: string;
    /** A CSS `zoom` of the container's own, as user styles might set. */
    containerZoom?: string;
    /** Leave the container out of layout, as a closed `<details>` does. */
    containerHidden?: boolean;
    /** The preview's zoom, a CSS `zoom` on `<body>`. */
    zoom?: number;
    /** Also render with Mermaid's element under `<body>` and report that layout. */
    compareOnBody?: boolean;
  },
): Promise<RenderedDiagram> {
  return page.evaluate(
    async ({
      source,
      containerWidth,
      containerTransform,
      containerZoom,
      containerHidden,
      zoom,
      compareOnBody,
    }) => {
      const globals = window as unknown as PageGlobals;
      document.body.style.zoom = String(zoom);
      if (zoom !== 1) {
        await new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        );
      }
      globals.mermaid.initialize({
        startOnLoad: false,
        cloneCssStyles: false,
      });

      const layoutOf = (root: SVGSVGElement): Layout => ({
        viewBoxWidth: Number(root.getAttribute('viewBox')!.split(/\s+/)[2]),
        labelBoxes: [...root.querySelectorAll('foreignObject')].map((fo) => [
          Number(fo.getAttribute('width')),
          Number(fo.getAttribute('height')),
        ]),
      });

      let onBody: Layout | undefined;
      if (compareOnBody) {
        const { svg } = await globals.mermaid.render('mermaid-on-body', source);
        onBody = layoutOf(
          new DOMParser().parseFromString(svg, 'image/svg+xml')
            .documentElement as unknown as SVGSVGElement,
        );
      }

      const container = document.getElementById('hidden')!;
      container.className = 'markdown-preview';
      container.style.width = containerWidth ?? '';
      container.style.transform = containerTransform ?? '';
      container.style.zoom = containerZoom ?? '';
      container.style.display = containerHidden ? 'none' : '';
      const node = document.createElement('div');
      node.className = 'mermaid';
      node.textContent = source;
      container.replaceChildren(node);

      await globals.crossnoteMermaid.renderMermaidDiagram(
        globals.mermaid,
        node,
        source,
        'mermaid-under-test',
      );

      const svg = node.querySelector('svg')!;
      return {
        ...layoutOf(svg),
        svg: node.innerHTML,
        onBody,
        bodyWidth: document.body.getBoundingClientRect().width,
        nodeWidth: node.getBoundingClientRect().width,
        labelOverflowBottom: [...svg.querySelectorAll('foreignObject')].map(
          (fo) => {
            const label = fo.querySelector('div')!;
            return (
              label.getBoundingClientRect().bottom -
              fo.getBoundingClientRect().bottom
            );
          },
        ),
      };
    },
    {
      source,
      containerWidth,
      containerTransform,
      containerZoom,
      containerHidden,
      zoom,
      compareOnBody,
    },
  );
}

function expectSameLayout(actual: Layout, expected: Layout): void {
  expect(actual.viewBoxWidth).toBeCloseTo(expected.viewBoxWidth, 1);
  expect(actual.labelBoxes).toHaveLength(expected.labelBoxes.length);
  actual.labelBoxes.forEach(([width, height], i) => {
    expect(width).toBeCloseTo(expected.labelBoxes[i][0], 1);
    expect(height).toBeCloseTo(expected.labelBoxes[i][1], 1);
  });
}

test('labels are measured under the styles of the node the diagram is rendered in', async ({
  page,
}) => {
  await loadMermaid(page);
  // A preview-scoped rule that changes how tall a wrapped label is, like the
  // `vue` theme's `.markdown-preview p { line-height: 1.6rem }`. Mermaid
  // clips a label to what it measured, so measuring anywhere else cuts off
  // the last line (shd101wyy/vscode-markdown-preview-enhanced#2454).
  await page.addStyleTag({
    content: '.markdown-preview p { line-height: 2.5; margin: 0; }',
  });
  const { labelOverflowBottom } = await renderDiagram(page, {
    source: FLOWCHART,
  });

  expect(labelOverflowBottom.length).toBeGreaterThan(0);
  for (const overflow of labelOverflowBottom) {
    expect(overflow).toBeLessThanOrEqual(0.5);
  }
});

test("a diagram that lays out to its container's width is laid out as wide as <body>", async ({
  page,
}) => {
  await loadMermaid(page);
  const { bodyWidth, nodeWidth, ...layout } = await renderDiagram(page, {
    source: GANTT,
    containerWidth: '320px',
    compareOnBody: true,
  });

  expect(nodeWidth).toBeLessThan(bodyWidth / 2);
  expectSameLayout(layout, layout.onBody!);
});

test('at every zoom level of the preview a diagram is laid out as it is unzoomed', async ({
  page,
}) => {
  // The zoom of the preview is a CSS `zoom` on <body>. Where the engine
  // scales the widths it reports by it, a label never measures as wide as the
  // width Mermaid wraps labels at, so no label is wrapped (#566).
  await loadMermaid(page);
  const unzoomed = await renderDiagram(page, { source: FLOWCHART });
  // It is labels that wrapping changes: a wrapped one is taller than one line.
  expect(
    Math.max(...unzoomed.labelBoxes.map(([, height]) => height)),
  ).toBeGreaterThan(40);

  for (const zoom of ZOOM_LEVELS) {
    const { svg } = await renderDiagram(page, { source: FLOWCHART, zoom });
    expect(svg, `at zoom ${zoom}`).toBe(unzoomed.svg);
  }
});

test('at zoom levels in between, a diagram is laid out as it is unzoomed', async ({
  page,
}) => {
  await loadMermaid(page);
  const unzoomed = await renderDiagram(page, { source: FLOWCHART });
  // The zoom of <body> and the zoom that undoes it are multiplied in single
  // precision, and their product skips from just below 1 to just above it at
  // 1.7 and 3.4. The zoom is also reported to six digits only, which is too
  // few to undo 1.5883388257531164 with; 1.0000004768371582 is four steps
  // above 1 in single precision, where a 120px label measures 119.99999px;
  // 2.1570750650018455 needs the zoom two steps above the reciprocal.
  for (const zoom of [
    1.7, 3.4, 1.5883388257531164, 1.0000004768371582, 2.1570750650018455,
    0.2012345678, 4.6,
  ]) {
    const { svg } = await renderDiagram(page, { source: FLOWCHART, zoom });
    expect(svg, `at zoom ${zoom}`).toBe(unzoomed.svg);
  }
});

test("at another zoom level, a diagram that lays out to its container's width is as wide as <body> is then", async ({
  page,
}) => {
  // <body> is narrower in CSS pixels at a larger zoom, and a gantt is laid
  // out to that width, as it is where Mermaid's own element is.
  await loadMermaid(page);
  const { onBody, ...layout } = await renderDiagram(page, {
    source: GANTT,
    containerWidth: '320px',
    zoom: 1.5,
    compareOnBody: true,
  });

  expectSameLayout(layout, onBody!);
});

test('a diagram under a scaled ancestor is laid out as it is unscaled, under the styles of the node', async ({
  page,
}) => {
  // A `transform` on a wrapper scales what is measured inside it, but not
  // what Mermaid compares the measurements with. The smaller scale is twice
  // the tolerance of the comparison, so it pins it.
  await loadMermaid(page);
  await page.addStyleTag({
    content: '.markdown-preview p { line-height: 2.5; margin: 0; }',
  });
  const unscaled = await renderDiagram(page, { source: FLOWCHART });

  for (const containerTransform of ['scale(0.5)', 'scale(0.98)']) {
    const { svg, labelOverflowBottom } = await renderDiagram(page, {
      source: FLOWCHART,
      containerTransform,
    });

    expect(svg).toBe(unscaled.svg);
    for (const overflow of labelOverflowBottom) {
      expect(overflow).toBeLessThanOrEqual(0.5);
    }
  }
});

test('a diagram under an ancestor with a zoom of its own is laid out as it is unzoomed', async ({
  page,
}) => {
  await loadMermaid(page);
  const unzoomed = await renderDiagram(page, { source: FLOWCHART });

  for (const containerZoom of ['2', '1.5', '1.7', '0.5']) {
    const { svg } = await renderDiagram(page, {
      source: FLOWCHART,
      containerZoom,
    });

    expect(svg, `under a zoom of ${containerZoom}`).toBe(unzoomed.svg);
  }
});

/**
 * Render under an ancestor that is scaled: Mermaid's element then goes under
 * `<body>`, where the layout is the one Mermaid's own element gives there.
 */
async function expectLaidOutAsOnBodyUnderTransform(page: Page): Promise<void> {
  for (const containerTransform of ['scale(0.5)', 'scale(0.98)']) {
    const { onBody, ...layout } = await renderDiagram(page, {
      source: FLOWCHART,
      containerTransform,
      compareOnBody: true,
    });

    expectSameLayout(layout, onBody!);
  }
}

test("without a top layer, a diagram under a scaled ancestor is laid out as with Mermaid's element under <body>", async ({
  page,
}) => {
  await loadMermaid(page);
  // An engine without popovers has no top layer.
  await page.evaluate(() => {
    (HTMLElement.prototype as { showPopover?: unknown }).showPopover =
      undefined;
  });

  await expectLaidOutAsOnBodyUnderTransform(page);
});

test("where the top layer is refused, a diagram under a scaled ancestor is laid out as with Mermaid's element under <body>", async ({
  page,
}) => {
  await loadMermaid(page);
  // An element is not shown in the top layer when a `beforetoggle` listener
  // cancels it, and `showPopover()` does not say so by throwing. An element
  // that is not shown is kept out of layout by its `popover` attribute, which
  // would have Mermaid measure nothing at all.
  await page.evaluate(() => {
    document.addEventListener(
      'beforetoggle',
      (event) => event.preventDefault(),
      true,
    );
  });

  await expectLaidOutAsOnBodyUnderTransform(page);
});

test("a diagram in a node that is not rendered is laid out as with Mermaid's element under <body>", async ({
  page,
}) => {
  await loadMermaid(page);
  const { onBody, ...layout } = await renderDiagram(page, {
    source: FLOWCHART,
    containerHidden: true,
    compareOnBody: true,
  });

  expectSameLayout(layout, onBody!);
});
