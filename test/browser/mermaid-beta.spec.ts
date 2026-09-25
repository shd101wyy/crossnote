import { expect, test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { startServer, TestServer } from './server';

interface MermaidGlobal {
  initialize(config: { startOnLoad: boolean }): void;
  render(id: string, source: string): Promise<{ svg: string }>;
}

type WindowWithMermaid = Window &
  typeof globalThis & { mermaid: MermaidGlobal };

const fixture = fs.readFileSync(
  path.resolve(__dirname, 'fixtures/mermaid-beta.md'),
  'utf8',
);
const diagrams = [...fixture.matchAll(/```mermaid\n([\s\S]*?)```/g)].map(
  ([, source]) => source.trim(),
);

let server: TestServer;

test.beforeAll(async () => {
  server = await startServer();
});

test.afterAll(async () => {
  await server?.close();
});

test('Mermaid renders every documented beta diagram family', async ({
  page,
}) => {
  expect(diagrams.length).toBeGreaterThan(0);
  await page.goto(server.url);
  await page.addScriptTag({ url: `${server.url}/mermaid/mermaid.min.js` });
  const result = await page.evaluate(async (sources) => {
    const mermaid = (window as WindowWithMermaid).mermaid;
    mermaid.initialize({ startOnLoad: false });
    try {
      const rendered = await Promise.all(
        sources.map(async (source, index) => {
          const result = await mermaid.render(`mermaid-beta-${index}`, source);
          return result.svg.includes('<svg');
        }),
      );
      return {
        rendered,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : String(error),
        rendered: [],
      };
    }
  }, diagrams);

  expect(result.error).toBeUndefined();
  expect(result.rendered).toHaveLength(diagrams.length);
  for (const rendered of result.rendered) {
    expect(rendered).toBe(true);
  }
});

test('Mermaid exposes the API surface the preview scripts call', async ({
  page,
}) => {
  // crossnote drives mermaid through five entry points: `render` is the
  // webview preview path, `initialize`/`init` come from the preview init
  // script (the latter for the Reveal.js slide helper), `run` from the
  // export/presentation path, and `registerExternalDiagrams` registers
  // ZenUML. A mermaid major bump that renames or drops any of them breaks
  // the preview at runtime — lock them in here.
  await page.goto(server.url);
  await page.addScriptTag({ url: `${server.url}/mermaid/mermaid.min.js` });
  const api = await page.evaluate(() => {
    const mermaid = (window as WindowWithMermaid).mermaid as unknown as Record<
      string,
      unknown
    >;
    return {
      initialize: typeof mermaid.initialize,
      init: typeof mermaid.init,
      run: typeof mermaid.run,
      render: typeof mermaid.render,
      registerExternalDiagrams: typeof mermaid.registerExternalDiagrams,
    };
  });
  expect(api).toEqual({
    initialize: 'function',
    init: 'function',
    run: 'function',
    render: 'function',
    registerExternalDiagrams: 'function',
  });
});
