import * as fs from 'fs';
import * as path from 'path';
import { expect, Page, test } from '@playwright/test';
import { escape } from 'html-escaper';
import { buildMermaidExportScript } from '../../src/markdown-engine/mermaid-export';
import { getDefaultNotebookConfig } from '../../src/notebook/types';

type ExportWindow = Window &
  typeof globalThis & {
    __crossnoteMermaidExport?: { status: string; message?: string };
    releaseMermaid: () => void;
  };

const bundle = fs.readFileSync(
  path.resolve(__dirname, '../../dependencies/mermaid/mermaid.min.js'),
  'utf8',
);

async function loadExport(
  page: Page,
  diagrams: string[],
  delayRendering: boolean = false,
) {
  const document = `<!doctype html><html><body>
      ${diagrams.map((diagram) => `<div class="mermaid">${escape(diagram)}</div>`).join('\n')}
      <script src="https://crossnote.test/mermaid.min.js"></script>
      <script type="module">${buildMermaidExportScript(
        getDefaultNotebookConfig(),
        diagrams.some((diagram) => /zenuml/i.test(diagram)),
      )}</script>
    </body></html>`;
  await page.route('https://crossnote.test/export.html', (route) =>
    route.fulfill({ contentType: 'text/html', body: document }),
  );
  await page.route('**/mermaid.min.js', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body:
        bundle +
        (delayRendering
          ? `
const run = mermaid.run.bind(mermaid);
const ready = new Promise(resolve => { window.releaseMermaid = resolve; });
mermaid.run = async options => { await ready; return run(options); };
`
          : ''),
    }),
  );
  await page.goto('https://crossnote.test/export.html');
}

test('export readiness follows actual Mermaid layout after page load', async ({
  page,
}) => {
  const diagrams = [
    'graph TD\nA[Start] --> B[Finish]',
    'classDiagram\nController --> Service',
    'sequenceDiagram\nClient->>Server: Request\nServer-->>Client: Response',
  ];
  await loadExport(page, diagrams, true);
  expect(await page.evaluate(() => document.readyState)).toBe('complete');
  expect(
    await page.evaluate(
      () => (window as ExportWindow).__crossnoteMermaidExport?.status,
    ),
  ).toBe('pending');
  await expect(page.locator('.mermaid svg')).toHaveCount(0);

  await page.evaluate(() => (window as ExportWindow).releaseMermaid());
  await page.waitForFunction(
    () =>
      (window as ExportWindow).__crossnoteMermaidExport?.status === 'complete',
  );
  const rendered = await page.locator('.mermaid > svg').evaluateAll((nodes) =>
    nodes.map((node) => ({
      viewBox: node.getAttribute('viewBox'),
      text: node.textContent,
    })),
  );
  expect(rendered).toHaveLength(3);
  expect(rendered.every((diagram) => diagram.viewBox)).toBe(true);
  expect(rendered[0].text).toContain('Finish');
  expect(rendered[1].text).toContain('Service');
  expect(rendered[2].text).toContain('Response');
});

test('Reveal ready events do not race the initial Mermaid render', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.assign(window, {
      Reveal: {
        addEventListener(name: string, listener: (event: object) => void) {
          if (name === 'ready') {
            queueMicrotask(() =>
              listener({ currentSlide: document.body, indexh: 0, indexv: 0 }),
            );
          }
        },
        slide() {},
      },
    });
  });
  await loadExport(page, [
    'graph TD\nA[Start] --> B[Finish]',
    'classDiagram\nController --> Service',
    'sequenceDiagram\nClient->>Server: Request',
  ]);
  // Observe the readiness transition in-page, before queued renders can finish.
  const completeDiagrams = await page.evaluate(async () => {
    while (
      (window as ExportWindow).__crossnoteMermaidExport?.status === 'pending'
    ) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    return [...document.querySelectorAll('.mermaid')].map((node) => ({
      viewBox: node.querySelector('svg')?.getAttribute('viewBox'),
      text: node.querySelector('svg')?.textContent,
    }));
  });
  expect(completeDiagrams).toHaveLength(3);
  expect(completeDiagrams.every((diagram) => diagram.viewBox)).toBe(true);
  expect(completeDiagrams[1].text).toContain('Service');
  expect(completeDiagrams[2].text).toContain('Request');
});

test('export reports a real Mermaid syntax failure', async ({ page }) => {
  await loadExport(page, ['not_a_diagram']);
  await page.waitForFunction(
    () => (window as ExportWindow).__crossnoteMermaidExport?.status === 'error',
  );
  const error = await page.evaluate(
    () => (window as ExportWindow).__crossnoteMermaidExport?.message,
  );
  expect(error).toContain('No diagram type detected');
});

test('a delayed ZenUML import cannot start an untracked load render', async ({
  page,
}) => {
  let releaseImport!: () => void;
  const importReady = new Promise<void>((resolve) => {
    releaseImport = resolve;
  });
  await page.route('**/mermaid-zenuml.esm.min.mjs', async (route) => {
    await importReady;
    await route.fulfill({
      contentType: 'text/javascript',
      headers: { 'access-control-allow-origin': '*' },
      body: `export default { id: 'test-zenuml', detector: () => false, loader: async () => ({}) }`,
    });
  });
  try {
    // The export detects ZenUML case-insensitively anywhere in its HTML.
    await loadExport(page, ['graph TD\nA[ZenUML example] --> B[Finish]']);
    expect(await page.evaluate(() => document.readyState)).toBe('complete');
    expect(await page.locator('.mermaid[data-processed]').count()).toBe(0);
    expect(
      await page.evaluate(
        () => (window as ExportWindow).__crossnoteMermaidExport?.status,
      ),
    ).toBe('pending');
  } finally {
    releaseImport();
  }
  await page.waitForFunction(
    () =>
      (window as ExportWindow).__crossnoteMermaidExport?.status === 'complete',
  );
  await expect(page.locator('.mermaid > svg')).toHaveAttribute(
    'viewBox',
    /\S+/,
  );
  await expect(page.locator('.mermaid > svg')).toContainText('Finish');
});

test('export reports a failed ZenUML module import', async ({ page }) => {
  await page.route('**/mermaid-zenuml.esm.min.mjs', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      headers: { 'access-control-allow-origin': '*' },
      body: 'throw new Error("ZenUML loading failed")',
    }),
  );
  await loadExport(page, ['zenuml\nClient->Server: Request']);
  await page.waitForFunction(
    () => (window as ExportWindow).__crossnoteMermaidExport?.status === 'error',
  );
  expect(
    await page.evaluate(
      () => (window as ExportWindow).__crossnoteMermaidExport?.message,
    ),
  ).toContain('ZenUML loading failed');
});
