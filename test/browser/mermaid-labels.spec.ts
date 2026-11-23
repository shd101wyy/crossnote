import { expect, test } from '@playwright/test';
import { startServer, TestServer } from './server';

/**
 * Mermaid lays a diagram out inside a temporary `<svg>`, measuring every
 * label there and then clipping the label to what it measured. Those
 * measurements are only right when the temporary svg sits where the diagram
 * will be displayed: under `<body>`, styles scoped to the preview do not
 * apply, and a label that gets taller once the diagram is inserted loses its
 * last line (shd101wyy/vscode-markdown-preview-enhanced#2454). The preview
 * therefore renders each diagram in its own node
 * (`renderMermaidDiagram`); this locks in that mermaid honours that container
 * when it measures.
 */

interface MermaidGlobal {
  initialize(config: { startOnLoad: boolean }): void;
  render(
    id: string,
    source: string,
    container?: Element,
  ): Promise<{ svg: string }>;
}

type WindowWithMermaid = Window &
  typeof globalThis & { mermaid: MermaidGlobal };

const DIAGRAM = `flowchart TB
    Entry["应用与路由入口层 (src/main.tsx · src/app.tsx · src/app.config.ts)"] --> Store["响应式状态矩阵与路由容器 (src/store/matrixStore.tsx)"]
    Entry --> Pages["12 个一级/二级页面视图层 (src/pages/*/index.tsx)"]
    Pages --> Components["无头交互与公共组件层 (src/components/*)"]
    Pages --> Release["Release notes are written after the feature freeze and reviewed by the docs team"]`;

let server: TestServer;

test.beforeAll(async () => {
  server = await startServer();
});

test.afterAll(async () => {
  await server?.close();
});

test('labels are measured under the styles of the node the diagram is rendered in', async ({
  page,
}) => {
  await page.goto(server.url);
  // A preview-scoped rule that changes how tall a wrapped label is, like the
  // `vue` theme's `.markdown-preview p { line-height: 1.6rem }`.
  await page.addStyleTag({
    content: '.markdown-preview p { line-height: 2.5; margin: 0; }',
  });
  await page.addScriptTag({ url: `${server.url}/mermaid/mermaid.min.js` });
  const labelBottoms = await page.evaluate(async (source) => {
    const mermaid = (window as WindowWithMermaid).mermaid;
    mermaid.initialize({ startOnLoad: false, cloneCssStyles: false });

    const host = document.getElementById('hidden')!;
    host.className = 'markdown-preview';
    const node = document.createElement('div');
    node.className = 'mermaid';
    host.appendChild(node);

    const { svg } = await mermaid.render('mermaid-labels', source, node);
    node.innerHTML = svg;

    // By how much a label box runs past the bottom of the foreignObject that
    // clips it. Positive means the last line is cut off.
    return [...node.querySelectorAll('foreignObject')].map((fo) => {
      const label = fo.querySelector('div')!;
      return (
        label.getBoundingClientRect().bottom - fo.getBoundingClientRect().bottom
      );
    });
  }, DIAGRAM);

  expect(labelBottoms.length).toBeGreaterThan(0);
  for (const overflow of labelBottoms) {
    expect(overflow).toBeLessThanOrEqual(0.5);
  }
});
