import { expect, Page, test } from '@playwright/test';
import { MERMAID_LEGACY_WEBVIEW_POLYFILL } from '../../src/markdown-engine/mermaid-polyfill';
import { build } from 'esbuild';
import * as path from 'path';
import { startServer, TestServer } from './server';

/**
 * The SVG Mermaid drew is written into the preview through the sanitizer, as
 * any other HTML is (`renderMermaidDiagram`). Its labels are HTML inside
 * `<foreignObject>`: a sanitizer that takes the element out, or the HTML in
 * it, leaves a diagram without labels. So real diagrams are drawn here with
 * the real helper and the real Mermaid, and what Mermaid writes at
 * `securityLevel: 'loose'` is looked for in the page.
 */

type MermaidHelper = typeof import('../../src/webview/lib/mermaid');

interface PageGlobals {
  mermaid: Window['mermaid'];
  crossnoteMermaid: MermaidHelper;
}

let server: TestServer;

test.beforeAll(async () => {
  server = await startServer();
});

test.afterAll(async () => {
  await server?.close();
});

/** A page with Mermaid at `securityLevel` and the real helper on it. */
async function open(
  page: Page,
  securityLevel: 'strict' | 'loose' = 'strict',
): Promise<void> {
  await page.goto(server.url);
  // As the preview loads them: the shim, then the bundle.
  await page.addScriptTag({
    content: MERMAID_LEGACY_WEBVIEW_POLYFILL.replace(/^<script>/, '').replace(
      /<\/script>$/,
      '',
    ),
  });
  await page.addScriptTag({ url: `${server.url}/mermaid/mermaid.min.js` });
  const { outputFiles } = await build({
    entryPoints: [path.resolve(__dirname, '../../src/webview/lib/mermaid.ts')],
    bundle: true,
    format: 'iife',
    globalName: 'crossnoteMermaid',
    write: false,
  });
  await page.addScriptTag({ content: outputFiles[0].text });
  await page.evaluate((securityLevel) => {
    (window as unknown as PageGlobals).mermaid.initialize({
      startOnLoad: false,
      securityLevel,
    });
  }, securityLevel);
}

/**
 * Draw `code` through the helper into a node of the page, as the preview
 * does, and return the SVG it wrote there.
 */
function drawn(page: Page, id: string, code: string): Promise<string> {
  return page.evaluate(
    async ({ id, code }) => {
      const node = document.createElement('div');
      node.className = 'mermaid';
      node.style.width = '800px';
      document.body.appendChild(node);
      const { mermaid, crossnoteMermaid } = window as unknown as PageGlobals;
      const svg = await crossnoteMermaid.renderMermaidDiagram(
        mermaid,
        node,
        code,
        id,
      );
      node.remove();
      return svg ?? '';
    },
    { id, code },
  );
}

const LABELS = `flowchart LR
  A[Start] --> B["<b>End</b>"]`;

test('at the default security level a diagram keeps its labels and its links', async ({
  page,
}) => {
  await open(page);
  const svg = await drawn(
    page,
    'clean-strict',
    `${LABELS}
  click B "https://example.com/a" "tooltip"`,
  );
  expect(svg).toContain('<foreignObject');
  expect(svg).toContain('<b>End</b>');
  expect(svg).toContain('href="https://example.com/a"');
});

test('a `click` with a javascript: address is written into the page without it at `loose`', async ({
  page,
}) => {
  await open(page, 'loose');
  const svg = await drawn(
    page,
    'clean-loose',
    `${LABELS}
  click B "javascript:alert(1)"`,
  );
  // The diagram is whole; the address is gone.
  expect(svg).toContain('<b>End</b>');
  expect(svg).not.toContain('javascript:');
});

for (const securityLevel of ['strict', 'loose'] as const) {
  test(`a label with a handler is written without it at ${securityLevel}`, async ({
    page,
  }) => {
    await open(page, securityLevel);
    const svg = await drawn(
      page,
      `handler-${securityLevel}`,
      `flowchart LR
  A["<img src=x onerror=alert(1)> <b>End</b>"]`,
    );
    expect(svg).toContain('<b>End</b>');
    expect(svg).not.toMatch(/onerror|<script/);
  });
}
