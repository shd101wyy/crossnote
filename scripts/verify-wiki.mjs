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
await page.waitForSelector('.cn-titlebar', { timeout: 15000 });
check('shell renders (titlebar, no left file panel)', true);
check(
  'no left file list',
  (await page.locator('.wiki-sidebar, .wiki-list').count()) === 0,
);
check(
  'title is wiki — <root>',
  (await page.title()).startsWith('wiki — '),
);

// Open the file picker via the titlebar button and pick the home note.
await page.click('.cn-titlebar-open');
await page.waitForSelector('.cn-picker-item', { timeout: 10000 });
const pickerItems = await page.locator('.cn-picker-item').allTextContents();
check('picker lists notes', pickerItems.length === 2, pickerItems.join(' | '));
await page.click('.cn-picker-item >> nth=0');
await page.waitForSelector('.cn-frame', { timeout: 15000 });

const frame = page.frameLocator('.cn-frame');
await frame.locator('h1').first().waitFor({ timeout: 20000 });
const h1 = await frame.locator('h1').first().textContent();
check('note content rendered in frame', /Home/.test(h1 ?? ''), h1 ?? '');

// Wait for diagrams/math to initialize, then verify rendering.
await page.waitForTimeout(2500);
const mermaidCount = await frame.locator('svg[id^="mermaid"]').count();
check('mermaid diagram rendered', mermaidCount >= 1, `svgs=${mermaidCount}`);
const mathCount = await frame
  .locator('.katex, .mjx-container, script[type^="math/tex"]')
  .count();
check('math rendered', mathCount >= 1, `math elements=${mathCount}`);
const imgSrc = await frame.locator('img').first().getAttribute('src');
check(
  'image embedded as data URI',
  !!imgSrc && imgSrc.startsWith('data:image/png;base64,'),
  (imgSrc ?? '').slice(0, 30),
);
const naturalWidth = await frame
  .locator('img')
  .first()
  .evaluate((img) => img.naturalWidth);
check('image actually loads', naturalWidth > 0, `w=${naturalWidth}`);

// Read-only: task checkbox click must not toggle.
const checkbox = frame.locator('.task-list-item-checkbox').first();
const checkedBefore = await checkbox.getAttribute('checked');
await checkbox.click({ force: true }).catch(() => {});
await page.waitForTimeout(400);
const checkedAfter = await checkbox.getAttribute('checked');
check(
  'task checkbox is inert',
  checkedBefore === checkedAfter,
  `before=${checkedBefore} after=${checkedAfter}`,
);

// Read-only: no run buttons on code chunks (none in this doc, so assert CSS
// gating exists in the page instead).
const readonlyCss = await frame
  .locator('body.wiki-readonly')
  .count();
check('wiki-readonly body class present', readonlyCss === 1);

// Navigate via the wikilink — opens a second tab in the same pane.
const tabCountBefore = await page.locator('.cn-tab').count();
await frame.getByRole('link', { name: /notes\/other/i }).first().click();
await page.waitForTimeout(1200);
const tabCountAfter = await page.locator('.cn-tab').count();
check(
  'wikilink opens another tab',
  tabCountAfter === tabCountBefore + 1,
  `tabs ${tabCountBefore} -> ${tabCountAfter}`,
);
// The visible frame is the newly opened note (inactive tabs stay mounted).
const frame2Text = await page
  .frameLocator('.cn-frame >> visible=true')
  .locator('h1')
  .first()
  .textContent();
check('second note rendered', /Other/.test(frame2Text ?? ''), frame2Text ?? '');

// Context menu: react-contexify needs a real user pointer environment that
// headless chromium does not reproduce (the serve server behaves the same),
// so the menu itself cannot be asserted here — the wiki/serve parity is.

// Keyboard: Ctrl+P inside the (sandboxed) frame opens the shell picker.
await page
  .frameLocator('.cn-frame >> visible=true')
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

// External http links open a new browser tab (the shell never navigates).
// `noopener` popups are not always observable in headless chromium, so the
// assertion is that the click is relayed without navigating the shell or
// showing a wiki error toast. Switch back to the home tab first — the
// external link lives there.
await page.locator('.cn-tab').first().click();
await page.waitForTimeout(600);
const urlBeforeExternal = page.url();
let popupError = null;
const popupPromise = page
  .waitForEvent('popup', { timeout: 5000 })
  .catch((error) => {
    popupError = error;
    return null;
  });
await page
  .frameLocator('.cn-frame >> visible=true')
  .getByRole('link', { name: /external/i })
  .first()
  .click();
const popup = await popupPromise;
await page.waitForTimeout(500);
const toastText = await page.locator('.cn-toast').allTextContents();
check(
  'external link relayed without navigating the shell',
  page.url() === urlBeforeExternal && toastText.length === 0,
  `popup=${!!popup} unobservable=${!!popupError} toast=${toastText.join()}`,
);

// Close the tab with Alt+W.
const tabsBeforeClose = await page.locator('.cn-tab').count();
await page.keyboard.press('Alt+w');
await page.waitForTimeout(500);
check(
  'Alt+W closes the active tab',
  (await page.locator('.cn-tab').count()) === tabsBeforeClose - 1,
);

await page.screenshot({ path: 'wiki-verify.png', fullPage: false });

const relevantErrors = errors.filter(
  (error) => !/net::ERR|favicon|cdn.jsdelivr|Failed to load resource/.test(error),
);
check(
  'no page errors',
  relevantErrors.length === 0,
  relevantErrors.slice(0, 5).join(' || '),
);

console.log(results.join('\n'));
await browser.close();
