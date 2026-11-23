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
    zoom = 1,
    compareOnBody = false,
  }: {
    source: string;
    containerWidth?: string;
    /** A CSS `transform` for the container, as user styles might set. */
    containerTransform?: string;
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
      if (containerWidth) {
        container.style.width = containerWidth;
      }
      if (containerTransform) {
        container.style.transform = containerTransform;
      }
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
    { source, containerWidth, containerTransform, zoom, compareOnBody },
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

test("at another zoom level a diagram is laid out as with Mermaid's element under <body>", async ({
  page,
}) => {
  // The measuring element must not change what a zoomed preview gets; how
  // Mermaid copes with the CSS `zoom` of <body> is its own matter (#566).
  await loadMermaid(page);
  for (const source of [FLOWCHART, GANTT]) {
    const { onBody, ...layout } = await renderDiagram(page, {
      source,
      containerWidth: '320px',
      zoom: 1.5,
      compareOnBody: true,
    });

    expectSameLayout(layout, onBody!);
  }
});

test("a diagram under a scaled ancestor is laid out as with Mermaid's element under <body>", async ({
  page,
}) => {
  // A `transform` on a wrapper scales what is measured inside it, but not
  // what Mermaid compares the measurements with. The smaller scale sits just
  // outside the tolerance of the check, so it pins it.
  await loadMermaid(page);
  for (const containerTransform of ['scale(0.5)', 'scale(0.98)']) {
    const { onBody, ...layout } = await renderDiagram(page, {
      source: FLOWCHART,
      containerTransform,
      compareOnBody: true,
    });

    expectSameLayout(layout, onBody!);
  }
});
