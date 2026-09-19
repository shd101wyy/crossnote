/**
 * Ad-hoc end-to-end verification of the crossnote serve app (not part of
 * the jest suite; run manually):
 *
 *   node scripts/verify-serve.mjs <serve-url> <absolute-note-path>
 *
 * Covers the fixes: images displaying (no <base> hijack), graph view,
 * backlinks, and closing empty panes.
 */
import { chromium } from '@playwright/test';

const base = process.argv[2];
const note = process.argv[3];
if (!base || !note) {
  console.error('usage: node scripts/verify-serve.mjs <url> <note-path>');
  process.exit(1);
}

let browser;
for (const channel of [undefined, 'msedge', 'chrome']) {
  try {
    browser = await chromium.launch(channel ? { channel } : {});
    break;
  } catch (error) {
    if (channel === 'chrome') {
      throw error;
    }
  }
}
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
const failedRequests = [];
page.on('pageerror', (error) => errors.push('pageerror: ' + error.message));
page.on('response', (r) => {
  if (r.status() >= 400) failedRequests.push(r.status() + ' ' + r.url().slice(0, 100));
});

const results = [];
const check = (name, ok, detail = '') => {
  results.push(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) process.exitCode = 1;
};

await page.goto(base);
await page.waitForSelector('.cn-titlebar', { timeout: 30000 });
await page.click('.cn-titlebar-open');
await page.waitForSelector('.cn-picker-input', { timeout: 15000 });
await page.fill('.cn-picker-input', 'README');
await page.waitForTimeout(600);
await page.click('.cn-picker-item >> nth=0');
await page.waitForSelector('.cn-frame', { timeout: 30000 });
const frame = page.frameLocator('.cn-frame >> visible=true');
await frame.locator('h1').first().waitFor({ timeout: 30000 });
await page.waitForTimeout(3000);

// 1. Images display: the note's images load with naturalWidth > 0 and no
//    <base> hijacks relative URLs.
const baseHrefs = await frame
  .locator('base')
  .evaluateAll((bases) => bases.map((b) => b.getAttribute('href')));
const imgStates = await frame
  .locator('[data-for=preview] img')
  .evaluateAll((imgs) =>
    imgs.map((i) => ({
      src: (i.getAttribute('src') || '').slice(0, 40),
      w: i.naturalWidth,
    })),
  );
const localImgs = imgStates.filter((i) => i.src.startsWith('/files/'));
check(
  'no <base> hijack in serve previews',
  baseHrefs.every((href) => !href || !/^[A-Za-z]:[\\/]/.test(href)),
  JSON.stringify(baseHrefs),
);
check(
  'local images display in serve',
  localImgs.length > 0 && localImgs.every((i) => i.w > 0),
  JSON.stringify(imgStates.slice(0, 3)),
);

// 2. Backlinks: toggle in the footer and wait for the panel to resolve
//    (not stuck on the loading indicator).
await frame.locator('.footer [title="Toggle backlinks"]').first().click();
await page.waitForTimeout(500);
const backlinksLoaded = await frame
  .locator('.backlinks .loading')
  .count();
let backlinksResolved = backlinksLoaded === 0;
if (!backlinksResolved) {
  // First toggle walks the vault; give it time.
  await frame
    .locator('.backlinks >> text=/Backlinks/')
    .first()
    .waitFor({ timeout: 120000 })
    .then(() => {
      backlinksResolved = true;
    })
    .catch(() => {});
}
check('backlinks toggle resolves (not stuck loading)', backlinksResolved);

// 3. Graph view: the footer button opens the graph in a PANE beside the
//    active one (like VS Code), not a browser tab. The graph is d3-rendered
//    into a <canvas>; the first vault walk can take a while on large
//    notebooks.
const panesBeforeGraph = await page.locator('.cn-pane').count();
await frame.locator('.footer [title="Open graph view"]').first().click();
await page.waitForTimeout(1000);
const graphTab = page.locator('.cn-tab', { hasText: 'Graph' });
check(
  'graph view opens as a pane with a Graph tab',
  (await graphTab.count()) === 1 &&
    (await page.locator('.cn-pane').count()) > panesBeforeGraph,
);
const graphFrame = page.frameLocator(
  'iframe.cn-frame[title^="__crossnote-graph-view__"]',
);
const graphReady = await graphFrame
  .locator('canvas')
  .first()
  .waitFor({ timeout: 180000 })
  .then(() => true)
  .catch(() => false);
// The d3 simulation paints over its first ticks — poll briefly.
let graphPainted = false;
for (let attempt = 0; attempt < 10 && graphReady && !graphPainted; attempt++) {
  graphPainted = await graphFrame
    .locator('canvas')
    .first()
    .evaluate((canvas) => {
      const context = canvas.getContext('2d');
      if (!context) {
        return false;
      }
      const { width, height } = canvas;
      if (width === 0 || height === 0) {
        return false;
      }
      const data = context.getImageData(0, 0, width, height).data;
      // Any non-transparent pixel means the graph was drawn.
      return data.some((value, index) => index % 4 !== 3 && value !== 0);
    })
    .catch(() => false);
  if (!graphPainted) {
    await page.waitForTimeout(1000);
  }
}
const graphStats = await graphFrame
  .locator('body')
  .innerText()
  .then((t) => t.match(/\d+ notes? · \d+ links?/)?.[0] ?? null)
  .catch(() => null);
check('graph view renders in its pane', graphPainted);
if (graphStats) {
  results.push(`INFO graph stats: ${graphStats}`);
}
// A node click relays back to the app and opens the note in a pane
// (informational — canvas hit-testing is not deterministic here).
const tabsBeforeGraphClick = await page.locator('.cn-tab').count();
await graphFrame
  .locator('canvas')
  .first()
  .click({ position: { x: 600, y: 400 } })
  .catch(() => {});
await page.waitForTimeout(1200);
results.push(
  `INFO graph node click relayed — tabs ${tabsBeforeGraphClick} -> ${await page.locator('.cn-tab').count()}`,
);
// Close the graph tab; the later pane checks expect a clean layout.
await graphTab.locator('.cn-tab-close').click().catch(() => {});
await page.waitForTimeout(400);

// 4. Empty panes can be closed. Normalize to a single tab and no stray
// empty panes first (the graph pane leaves one) — a split only empties the
// source pane when the active tab was its only one.
while ((await page.locator('.cn-tab').count()) > 1) {
  await page.keyboard.press('Alt+w');
  await page.waitForTimeout(400);
}
while ((await page.locator('button[title="Close pane"]').count()) > 0) {
  await page.locator('button[title="Close pane"]').last().click();
  await page.waitForTimeout(400);
}
const panesBefore = await page.locator('.cn-pane').count();
await page.keyboard.press('Control+\\');
await page.waitForTimeout(700);
const panesSplit = await page.locator('.cn-pane').count();
check('split creates a second pane', panesSplit === panesBefore + 1);
await page.locator('button[title="Close pane"]').last().click();
await page.waitForTimeout(500);
check(
  'close pane removes it',
  (await page.locator('.cn-pane').count()) === panesBefore,
);

const relevant = errors.filter(
  (e) => !/net::ERR|favicon|Failed to load resource/.test(e),
);
check(
  'no page errors',
  relevant.length === 0,
  relevant.slice(0, 4).join(' || '),
);
check(
  'no failed requests',
  failedRequests.length === 0,
  failedRequests.slice(0, 4).join(' | '),
);

console.log(results.join('\n'));
await browser.close();
