/**
 * Ad-hoc end-to-end verification of a standalone wiki file (not part of the
 * jest suite; run manually):
 *
 *   node scripts/verify-wiki.mjs <path-to-wiki.html>
 *
 * Opens the file with file:// (exactly like double-clicking it), drives the
 * serve-app UI, and asserts the read-only wiki behaviors.
 */
import { pathToFileURL } from 'url';
import { chromium } from '@playwright/test';
import path from 'path';

const wikiPath = process.argv[2];
if (!wikiPath) {
  console.error('usage: node scripts/verify-wiki.mjs <wiki.html>');
  process.exit(1);
}

const url = pathToFileURL(path.resolve(wikiPath)).href;
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
page.on('pageerror', (error) => errors.push('pageerror: ' + error.message));
page.on('console', (message) => {
  if (message.type() === 'error') {
    errors.push('console: ' + message.text());
  }
});

const results = [];
const check = (name, ok, detail = '') => {
  results.push(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) process.exitCode = 1;
};

await page.goto(url);
await page.waitForSelector('.cn-titlebar', { timeout: 60000 });
check('shell renders (titlebar, no left file panel)', true);
check(
  'no left file list',
  (await page.locator('.wiki-sidebar, .wiki-list').count()) === 0,
);

// The welcome card describes the wiki snapshot without absolute paths.
const welcomeText = await page.locator('.cn-welcome').innerText();
check(
  'welcome describes the read-only wiki, not a server',
  !/Markdown preview server/.test(welcomeText) &&
    /read-only snapshot/i.test(welcomeText),
  welcomeText.split('\n')[0].slice(0, 80),
);
check(
  'welcome leaks no absolute paths',
  !/[A-Za-z]:[\\/].*[\\/]/.test(welcomeText),
);

// Open the file picker via the titlebar button and pick a note (an
// optional third argv narrows the picker search, e.g. a note with images).
const pickerQuery = process.argv[3] ?? '';
await page.click('.cn-titlebar-open');
await page.waitForSelector('.cn-picker-input', { timeout: 20000 });
if (pickerQuery) {
  await page.fill('.cn-picker-input', pickerQuery);
  await page.waitForTimeout(600);
}
await page.waitForSelector('.cn-picker-item', { timeout: 20000 });
const pickerItems = await page.locator('.cn-picker-item').allTextContents();
check(
  'picker lists notes with relative paths',
  pickerItems.length >= 1 && !pickerItems.join('').includes(':\\'),
  pickerItems.slice(0, 2).join(' | ').slice(0, 60),
);
await page.click('.cn-picker-item >> nth=0');
await page.waitForSelector('.cn-frame', { timeout: 30000 });

const frame = page.frameLocator('.cn-frame >> visible=true');
await frame.locator('h1').first().waitFor({ timeout: 30000 });
const h1 = await frame.locator('h1').first().textContent();
check('note content rendered in frame', !!h1?.trim(), h1 ?? '');

// Wait for diagrams/math to initialize, then verify rendering.
await page.waitForTimeout(2500);
const mermaidCount = await frame.locator('svg[id^="mermaid"]').count();
if (mermaidCount > 0) {
  check('mermaid diagram rendered', true, `svgs=${mermaidCount}`);
} else {
  results.push('SKIP mermaid (none in this note)');
}
const mathCount = await frame
  .locator('.katex, .mjx-container, script[type^="math/tex"]')
  .count();
if (mathCount > 0) {
  check('math rendered', true, `math elements=${mathCount}`);
} else {
  results.push('SKIP math (none in this note)');
}

// Every <img> in the note is a data URI and actually loads.
const imgInfo = await frame
  .locator('[data-for=preview] img')
  .first()
  .evaluate((img) => ({ w: img.naturalWidth, src: img.src.slice(0, 10) }))
  .catch(() => null);
const imgCount = await frame.locator('[data-for=preview] img').count();
const remoteImgs = await frame
  .locator('[data-for=preview] img[src^="http"]')
  .count();
check(
  'images are embedded data URIs and load',
  imgInfo !== null &&
    imgInfo.w > 0 &&
    imgInfo.src.startsWith('data:') &&
    remoteImgs === 0,
  `imgs=${imgCount} remote=${remoteImgs} first=${JSON.stringify(imgInfo)}`,
);

// No <base> pointing at a local path inside wiki frames.
const baseHref = await frame
  .locator('base')
  .evaluateAll((bases) => bases.map((b) => b.getAttribute('href')));
check(
  'no local <base> injected in wiki frames',
  baseHref.every((href) => !href || !/^[A-Za-z]:/.test(href)),
  JSON.stringify(baseHref),
);

// Read-only: task checkbox click must not toggle (if present).
const checkbox = frame.locator('.task-list-item-checkbox').first();
if ((await checkbox.count()) > 0) {
  const checkedBefore = await checkbox.getAttribute('checked');
  await checkbox.click({ force: true }).catch(() => {});
  await page.waitForTimeout(300);
  const checkedAfter = await checkbox.getAttribute('checked');
  check(
    'task checkbox is inert',
    checkedBefore === checkedAfter,
    `before=${checkedBefore} after=${checkedAfter}`,
  );
} else {
  results.push('SKIP task checkbox (none in first note)');
}
check(
  'wiki-readonly body class present',
  (await frame.locator('body.wiki-readonly').count()) === 1,
);

// Footer: graph view and backlinks buttons are hidden in the wiki.
const footerTitles = await frame
  .locator('.footer [title]')
  .evaluateAll((nodes) => nodes.map((n) => n.getAttribute('title')));
check(
  'graph view and backlinks buttons hidden',
  !footerTitles.includes('Open graph view') &&
    !footerTitles.includes('Toggle backlinks'),
  JSON.stringify(footerTitles),
);

// Navigate via the wikilink — opens a second tab in the same pane.
const tabCountBefore = await page.locator('.cn-tab').count();
const anyLink = frame
  .locator('[data-for=preview] a[href]:not([href^="#"]):not([href^="http"])')
  .first();
if ((await anyLink.count()) > 0) {
  await anyLink.click();
  await page.waitForTimeout(1200);
  const tabCountAfter = await page.locator('.cn-tab').count();
  check(
    'note link opens another tab',
    tabCountAfter === tabCountBefore + 1,
    `tabs ${tabCountBefore} -> ${tabCountAfter}`,
  );
  await page.locator('.cn-tab').first().click();
  await page.waitForTimeout(500);
} else {
  results.push('SKIP note link navigation (none in first note)');
}

// Split into a second pane, then close the empty pane again. Normalize to
// a single tab first — a split only empties the source pane when the
// active tab was its only one.
while ((await page.locator('.cn-tab').count()) > 1) {
  await page.keyboard.press('Alt+w');
  await page.waitForTimeout(400);
}
const panesBefore = await page.locator('.cn-pane').count();
await page.keyboard.press('Control+\\');
await page.waitForTimeout(700);
const panesAfterSplit = await page.locator('.cn-pane').count();
check('split creates a second pane', panesAfterSplit === panesBefore + 1);
const closePaneButton = page.locator(
  '.cn-pane:not(.cn-pane-active) .cn-tabstrip-actions button[title="Close pane"]',
);
const closeButtonVisible =
  (await closePaneButton.count()) === 1 ||
  (await page.locator('button[title="Close pane"]').count()) === 1;
check('empty pane offers a close button', closeButtonVisible);
if (closeButtonVisible) {
  await page.locator('button[title="Close pane"]').last().click();
  await page.waitForTimeout(500);
  check(
    'close pane removes it',
    (await page.locator('.cn-pane').count()) === panesBefore,
  );
}

// Keyboard: Ctrl+P inside the (sandboxed) frame opens the shell picker.
// Target the active pane's active tab frame — several may be mounted.
const activeTabTitle = await page
  .locator('.cn-pane-active .cn-tab-active')
  .getAttribute('title');
await page
  .frameLocator(`.cn-frame[title="${(activeTabTitle ?? '').replace(/"/g, '\\"')}"]`)
  .locator('body')
  .first()
  .click();
await page.keyboard.press('Control+p');
await page.waitForTimeout(600);
check(
  'Ctrl+P inside frame opens picker',
  (await page.locator('.cn-picker-input').count()) === 1,
);
await page.keyboard.press('Escape');

// Theme picker: a selection stored in localStorage (what the context menu
// writes) re-assembles notes with that stylesheet on the next load.
const wikiStorageKey = await page.evaluate(() => {
  const roots = globalThis.__CROSSNOTE_WIKI__.rootDirectories;
  return `crossnote:wiki:themes:${roots.join('|')}`;
});
const stored = await page.evaluate((key) => localStorage.getItem(key), wikiStorageKey);
await page.evaluate(
  ({ key, value }) => localStorage.setItem(key, value),
  {
    key: wikiStorageKey,
    value: JSON.stringify({
      preview: 'github-dark.css',
      codeBlock: 'auto.css',
      reveal: 'white.css',
    }),
  },
);
await page.reload();
await page.waitForSelector('.cn-titlebar', { timeout: 120000 });
await page.click('.cn-titlebar-open');
await page.waitForSelector('.cn-picker-item', { timeout: 20000 });
await page.click('.cn-picker-item >> nth=0');
await page.waitForSelector('.cn-frame', { timeout: 30000 });
await page
  .frameLocator('.cn-frame >> visible=true')
  .locator('h1')
  .first()
  .waitFor({ timeout: 60000 });
const themeStyle = await page
  .frameLocator('.cn-frame >> visible=true')
  .locator('style[data-crossnote-theme="preview"]')
  .first()
  .textContent()
  .catch(() => null);
check(
  'stored theme selection is applied',
  !!themeStyle && themeStyle.includes('background-color:#24292e'),
  (themeStyle ?? '').slice(0, 60),
);

// Live switch: dispatch the exact message the context menu's theme item
// sends (from inside the frame, so the app's source check passes) and
// watch the selection persist and the open tabs re-assemble with it.
await page
  .frameLocator('.cn-frame >> visible=true')
  .locator('body')
  .first()
  .evaluate(() => {
    globalThis.parent.postMessage(
      { command: 'setPreviewTheme', args: [null, 'one-dark.css'] },
      '*',
    );
  });
await page
  .frameLocator('.cn-frame >> visible=true')
  .locator('h1')
  .first()
  .waitFor({ timeout: 60000 });
await page.waitForTimeout(1500);
const liveStyle = await page
  .frameLocator('.cn-frame >> visible=true')
  .locator('style[data-crossnote-theme="preview"]')
  .first()
  .textContent()
  .catch(() => null);
const persistedSelection = await page.evaluate(
  (key) => localStorage.getItem(key),
  wikiStorageKey,
);
check(
  'context-menu theme switch persists and re-renders',
  !!liveStyle &&
    liveStyle.includes('background-color:#272b33') &&
    !!persistedSelection &&
    persistedSelection.includes('one-dark.css'),
  (liveStyle ?? '').slice(0, 60),
);
// Restore whatever was stored before the probe (usually nothing).
await page.evaluate(({ key, value }) => {
  if (value === null) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, value);
  }
}, { key: wikiStorageKey, value: stored });

const relevantErrors = errors.filter(
  (error) =>
    !/net::ERR|favicon|cdn.jsdelivr|Failed to load resource/.test(error),
);
check(
  'no page errors',
  relevantErrors.length === 0,
  relevantErrors.slice(0, 5).join(' || '),
);

console.log(results.join('\n'));
await browser.close();
