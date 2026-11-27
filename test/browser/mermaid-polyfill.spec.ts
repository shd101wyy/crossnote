import { expect, Page, test } from '@playwright/test';
import { MERMAID_LEGACY_WEBVIEW_POLYFILL } from '../../src/markdown-engine/mermaid-polyfill';
import { startServer, TestServer } from './server';

/**
 * The shim that is emitted before the mermaid bundle gives the oldest
 * supported webview (VS Code 1.82 / Chromium 114) the globals it lacks.
 * Here they are deleted from the page first, so that the shim is all a
 * diagram has: without it, a link to the web fails the whole diagram.
 */

interface MermaidRenderer {
  initialize(config: { startOnLoad: boolean; securityLevel: string }): void;
  render(id: string, source: string): Promise<{ svg: string }>;
}

const LINK = 'https://example.com/a';

let server: TestServer;

test.beforeAll(async () => {
  server = await startServer();
});

test.afterAll(async () => {
  await server?.close();
});

/**
 * A page that has neither `URL.canParse` nor `Object.groupBy`, with the
 * mermaid bundle on it — after the shim, unless the test is about going
 * without it.
 */
async function openWithMermaid(page: Page, withoutTheShim: boolean = false) {
  await page.addInitScript(() => {
    delete (URL as unknown as { canParse?: unknown }).canParse;
    delete (Object as unknown as { groupBy?: unknown }).groupBy;
  });
  await page.goto(server.url);
  if (!withoutTheShim) {
    await page.addScriptTag({
      content: MERMAID_LEGACY_WEBVIEW_POLYFILL.replace(/^<script>/, '').replace(
        /<\/script>$/,
        '',
      ),
    });
  }
  await page.addScriptTag({ url: `${server.url}/mermaid/mermaid.min.js` });
}

/** Render `source` at a security level; a diagram that cannot be drawn rejects. */
function render(
  page: Page,
  id: string,
  source: string,
  securityLevel: string = 'strict',
): Promise<string> {
  return page.evaluate(
    async ({ id, source, securityLevel }) => {
      const mermaid = (window as unknown as { mermaid: MermaidRenderer })
        .mermaid;
      mermaid.initialize({ startOnLoad: false, securityLevel });
      const { svg } = await mermaid.render(id, source);
      return svg;
    },
    { id, source, securityLevel },
  );
}

test('the shim gives the page the two globals, as the spec makes of them', async ({
  page,
}) => {
  await openWithMermaid(page);
  expect(
    await page.evaluate(() => [
      typeof URL.canParse,
      typeof (Object as unknown as { groupBy?: unknown }).groupBy,
    ]),
  ).toEqual(['function', 'function']);
  expect(
    await page.evaluate(() => [
      URL.canParse('https://example.com/a'),
      URL.canParse('/a'),
      URL.canParse('/a', 'https://example.com/'),
    ]),
  ).toEqual([true, false, true]);
});

test('a flowchart with a click link to the web is drawn where URL.canParse is missing', async ({
  page,
}) => {
  await openWithMermaid(page);
  // The default security level; in `loose` the link is not sanitized and
  // the diagram never reaches the missing global.
  const svg = await render(
    page,
    'shim-flow',
    `flowchart LR
  A[Start] --> B[End]
  click A "${LINK}" "tooltip"`,
  );
  expect(svg).toContain('aria-roledescription="flowchart-v2"');
  expect(svg).toContain(LINK);
});

test('a link that is not a URL is left out through the shim, and the diagram is drawn', async ({
  page,
}) => {
  await openWithMermaid(page);
  // `http://` is not a URL: asked of `URL.canParse`, answered with `false`.
  // What is left of the link then is the sanitizer's decision, not the
  // shim's.
  const svg = await render(
    page,
    'shim-not-a-url',
    `flowchart LR
  A[Start]
  click A "http://" "tooltip"`,
  );
  expect(svg).toContain('aria-roledescription="flowchart-v2"');
  expect(svg).not.toContain('xlink:href');
});

// Every other place mermaid asks its URL sanitizer about an http(s) link:
// where the diagram and the security level together reach it, and whether
// the link is written into the svg.
const OTHER_DIAGRAMS_WITH_A_LINK = [
  [
    'class',
    `classDiagram
  class A
  click A href "${LINK}" "tooltip"`,
    'strict',
    true,
  ],
  [
    'gantt',
    `gantt
  title A gantt
  dateFormat X
  section One
  task :done, a1, 0, 2d
  click a1 href "${LINK}"`,
    'strict',
    false,
  ],
  [
    'sequence-strict',
    `sequenceDiagram
  Alice->>Bob: Hi
  links Alice: {"A": "${LINK}"}`,
    'strict',
    true,
  ],
  [
    'sequence-loose',
    `sequenceDiagram
  Alice->>Bob: Hi
  links Alice: {"A": "${LINK}"}`,
    'loose',
    true,
  ],
] as const;

test('the other diagrams that give a link to the sanitizer are drawn too', async ({
  page,
}) => {
  await openWithMermaid(page);
  for (const [id, source, level, linkInTheSvg] of OTHER_DIAGRAMS_WITH_A_LINK) {
    const svg = await render(page, `shim-${id}`, source, level);
    expect(svg, id).toContain('aria-roledescription');
    expect(svg.includes(LINK), id).toBe(linkInTheSvg);
  }
});

test('without the shim, each of them fails with the missing global', async ({
  page,
}) => {
  await openWithMermaid(page, true);
  const flowchart = `flowchart LR
  A[Start]
  click A "${LINK}" "tooltip"`;
  for (const [id, source, level] of [
    ['flow', flowchart, 'strict'],
    ...OTHER_DIAGRAMS_WITH_A_LINK,
  ] as const) {
    await expect(
      render(page, `no-shim-${id}`, source, level),
      id,
    ).rejects.toThrow(/URL\.canParse is not a function/);
  }
});
