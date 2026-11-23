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

interface RenderedDiagram {
  bodyWidth: number;
  nodeWidth: number;
  viewBoxWidth: number;
  /** View box width of the same diagram rendered with Mermaid's element under `<body>`. */
  viewBoxWidthOnBody?: number;
  labels: {
    /** By how much the label runs past the bottom of the element that clips it. */
    overflowBottom: number;
    /** By how much the label's text is wider than the label box. */
    overflowRight: number;
  }[];
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
    zoom = 1,
    compareOnBody = false,
  }: {
    source: string;
    containerWidth?: string;
    zoom?: number;
    /** Also render with Mermaid's element under `<body>` and report its width. */
    compareOnBody?: boolean;
  },
): Promise<RenderedDiagram> {
  return page.evaluate(
    async ({ source, containerWidth, zoom, compareOnBody }) => {
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

      const container = document.getElementById('hidden')!;
      container.className = 'markdown-preview';
      if (containerWidth) {
        container.style.width = containerWidth;
      }
      const node = document.createElement('div');
      node.className = 'mermaid';
      node.textContent = source;
      container.replaceChildren(node);

      const viewBoxWidth = (root: SVGSVGElement) =>
        Number(root.getAttribute('viewBox')!.split(/\s+/)[2]);
      let viewBoxWidthOnBody;
      if (compareOnBody) {
        const { svg } = await globals.mermaid.render('mermaid-on-body', source);
        viewBoxWidthOnBody = viewBoxWidth(
          new DOMParser().parseFromString(svg, 'image/svg+xml')
            .documentElement as unknown as SVGSVGElement,
        );
      }

      await globals.crossnoteMermaid.renderMermaidDiagram(
        globals.mermaid,
        node,
        source,
        'mermaid-under-test',
      );

      return {
        bodyWidth: document.body.getBoundingClientRect().width,
        nodeWidth: node.getBoundingClientRect().width,
        viewBoxWidth: viewBoxWidth(node.querySelector('svg')!),
        viewBoxWidthOnBody,
        labels: [...node.querySelectorAll('foreignObject')].map((fo) => {
          const label = fo.querySelector('div')!;
          return {
            overflowBottom:
              label.getBoundingClientRect().bottom -
              fo.getBoundingClientRect().bottom,
            overflowRight: label.scrollWidth - label.clientWidth,
          };
        }),
      };
    },
    { source, containerWidth, zoom, compareOnBody },
  );
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
  const { labels } = await renderDiagram(page, { source: FLOWCHART });

  expect(labels.length).toBeGreaterThan(0);
  for (const label of labels) {
    expect(label.overflowBottom).toBeLessThanOrEqual(0.5);
  }
});

test("a diagram that lays out to its container's width is laid out as wide as <body>", async ({
  page,
}) => {
  await loadMermaid(page);
  const { bodyWidth, nodeWidth, viewBoxWidth, viewBoxWidthOnBody } =
    await renderDiagram(page, {
      source: GANTT,
      containerWidth: '320px',
      compareOnBody: true,
    });

  expect(nodeWidth).toBeLessThan(bodyWidth / 2);
  expect(viewBoxWidth).toBeCloseTo(viewBoxWidthOnBody!, 1);
});

test("at another zoom level a diagram is laid out as with Mermaid's element under <body>", async ({
  page,
}) => {
  // The measuring element must not change what a zoomed preview gets; how
  // Mermaid copes with the CSS `zoom` of <body> is its own matter (#566).
  await loadMermaid(page);
  for (const source of [FLOWCHART, GANTT]) {
    const { viewBoxWidth, viewBoxWidthOnBody } = await renderDiagram(page, {
      source,
      containerWidth: '320px',
      zoom: 1.5,
      compareOnBody: true,
    });

    expect(viewBoxWidth).toBeCloseTo(viewBoxWidthOnBody!, 1);
  }
});
