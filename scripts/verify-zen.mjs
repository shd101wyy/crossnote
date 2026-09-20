/**
 * Ad-hoc end-to-end verification of preview zen mode (not part of the jest
 * suite; run manually):
 *
 *   node scripts/verify-zen.mjs serve <serve-url> <picker-query>
 *   node scripts/verify-zen.mjs wiki <wiki.html> <picker-query>
 *
 * Zen mode must be the *preview's* own state: the context-menu item flips
 * the preview's zen-mode class (a frame reload), while the shell chrome —
 * the title bar — never hides, and Esc is not hijacked.
 */
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';

const mode = process.argv[2];
const target = process.argv[3];
const query = process.argv[4];
if (
  (mode !== 'serve' && mode !== 'wiki') ||
  !target ||
  !query
) {
  console.error(
    'usage: node scripts/verify-zen.mjs serve|wiki <url-or-wiki-file> <picker-query>',
  );
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
page.on('pageerror', (error) => errors.push('pageerror: ' + error.message));

const results = [];
const check = (name, ok, detail = '') => {
  results.push(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) process.exitCode = 1;
};

const openNote = async () => {
  await page.click('.cn-titlebar-open');
  await page.waitForSelector('.cn-picker-input', { timeout: 15000 });
  await page.fill('.cn-picker-input', query);
  await page.waitForTimeout(600);
  await page.click('.cn-picker-item >> nth=0');
  await page.waitForSelector('.cn-frame', { timeout: 30000 });
  const frame = page.frameLocator('.cn-frame >> visible=true');
  await frame.locator('h1').first().waitFor({ timeout: 30000 });
  await page.waitForTimeout(2500);
  return frame;
};

/** The preview's zen state, as the real preview element's class shows it. */
const zenActive = async () => {
  const frame = page.frameLocator('.cn-frame >> visible=true');
  return frame
    .locator('.crossnote[data-for="preview"]')
    .first()
    .evaluate((el) => el.classList.contains('zen-mode'));
};

/** Poll until the zen state is the expected one (the frame reloads). */
const waitForZen = async (expected, timeout = 30000) => {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if ((await zenActive().catch(() => null)) === expected) {
      return true;
    }
    await page.waitForTimeout(500);
  }
  return false;
};

/** Invoke the preview context menu's "Zen Mode" item. */
const clickZenMenuItem = async () => {
  const frame = page.frameLocator('.cn-frame >> visible=true');
  await frame.locator('h1').first().click({ button: 'right' });
  const item = frame
    .getByRole('menuitem', { name: /^Zen Mode$/ })
    .first();
  await item.waitFor({ timeout: 10000 });
  // A mouse-path click can be intercepted by a submenu opened in passing
  // (Edit Markdown / Preview Theme / … sit above the item) — click the DOM
  // node directly.
  await item.evaluate((el) => el.click());
};

await page.goto(mode === 'wiki' ? pathToFileURL(target).href : target);
await page.waitForSelector('.cn-titlebar', { timeout: 30000 });
check('title bar visible at start', await page.isVisible('.cn-titlebar'));

await openNote();
check('preview starts in zen mode (config default)', await zenActive());

// 1. Toggle off: the preview leaves zen mode, the shell chrome stays.
await clickZenMenuItem();
check('zen toggle turns the preview zen mode off', await waitForZen(false));
check(
  'title bar still visible after toggling zen',
  await page.isVisible('.cn-titlebar'),
);

// 2. Wiki: the off state persists across a page reload (localStorage).
if (mode === 'wiki') {
  await page.reload();
  await page.waitForSelector('.cn-titlebar', { timeout: 30000 });
  await openNote();
  const stillOff = await waitForZen(false, 15000).catch(() => false);
  check('wiki zen override survives a reload', stillOff);
}

// 3. Toggle on: the toggle works both ways (it used to only ever enable).
await clickZenMenuItem();
check('zen toggle turns the preview zen mode back on', await waitForZen(true));
check(
  'title bar still visible after toggling back',
  await page.isVisible('.cn-titlebar'),
);

// 4. Esc inside the preview keeps the shell chrome (it toggles the outline,
//    it must not hide anything at the app level).
await page.frameLocator('.cn-frame >> visible=true')
  .locator('h1')
  .first()
  .click();
await page.keyboard.press('Escape');
await page.waitForTimeout(600);
check(
  'Esc in the preview leaves the title bar alone',
  await page.isVisible('.cn-titlebar'),
);

const relevant = errors.filter((e) => !/net::ERR|favicon/.test(e));
check('no page errors', relevant.length === 0, relevant.slice(0, 4).join(' || '));

console.log(results.join('\n'));
await browser.close();
