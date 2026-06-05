import { expect, Page, test } from '@playwright/test';
import * as cheerio from 'cheerio';
import { sanitizeRenderedHTML } from '../../src/markdown-engine/sanitize';
import { startServer, TestServer } from './server';

/**
 * Real-browser tests for WaveDrom rendering and the eval-based code-execution
 * fix (shd101wyy/vscode-markdown-preview-enhanced#2315).
 *
 * The bundled WaveDrom renderer (used in presentation mode and HTML export)
 * runs `WaveDrom.ProcessAll()`, which evaluates the body of every
 * `<script type="WaveDrom">` with `eval("(" + innerHTML + ")")`. Our HTML
 * sanitizer defangs this by validating + normalizing that body to inert strict
 * JSON (and dropping it entirely if it isn't valid data), so `eval` can never
 * execute attacker-controlled JavaScript. These tests exercise that exact
 * runtime path in Chromium.
 */

interface WaveDromGlobal {
  ProcessAll: () => void;
}
type WindowWithWaveDrom = Window &
  typeof globalThis & { WaveDrom: WaveDromGlobal; __pwned?: boolean };

let server: TestServer;

test.beforeAll(async () => {
  server = await startServer();
});

test.afterAll(async () => {
  await server?.close();
});

/** Run our real server-side sanitizer over a body HTML fragment. */
function sanitize(html: string): string {
  const $ = cheerio.load(html);
  sanitizeRenderedHTML($);
  return $('body').html() ?? '';
}

/**
 * Load the given body HTML into the page, pull in the vendored WaveDrom
 * scripts (same order the engine emits), and run `WaveDrom.ProcessAll()` —
 * mirroring the presentation/export render path. Returns whether an SVG was
 * produced and whether the `__pwned` execution sentinel was tripped.
 */
async function processAll(page: Page, bodyHtml: string) {
  await page.goto(server.url);
  await page.evaluate((html) => {
    (window as WindowWithWaveDrom).__pwned = false;
    document.getElementById('hidden')!.innerHTML = html;
  }, bodyHtml);
  // Load order matches src/markdown-engine/index.ts: skins, then the library.
  await page.addScriptTag({ url: `${server.url}/wavedrom/skins/default.js` });
  await page.addScriptTag({ url: `${server.url}/wavedrom/skins/narrow.js` });
  await page.addScriptTag({ url: `${server.url}/wavedrom/wavedrom.min.js` });
  return page.evaluate(() => {
    (window as WindowWithWaveDrom).WaveDrom.ProcessAll();
    const hidden = document.getElementById('hidden')!;
    return {
      pwned: (window as WindowWithWaveDrom).__pwned === true,
      svgCount: hidden.querySelectorAll('svg').length,
      hasWavedromScript: hidden.querySelectorAll('script[type="WaveDrom" i]')
        .length,
    };
  });
}

const MALICIOUS =
  '<div class="wavedrom"><script type="WaveDrom">' +
  '(function(){ window.__pwned = true; return { signal: [] }; })()' +
  '</script></div>';

const BENIGN_JSON5 =
  '<div class="wavedrom"><script type="WaveDrom">' +
  "{ signal: [ { name: 'clk', wave: 'p...' }, { name: 'dat', wave: 'x.34' } ] }" +
  '</script></div>';

test('UNSANITIZED malicious WaveDrom executes via ProcessAll (demonstrates the vuln)', async ({
  page,
}) => {
  // This is the pre-fix behavior: ProcessAll's eval runs attacker JS. It
  // guards *why* the sanitizer normalization below is necessary.
  const result = await processAll(page, MALICIOUS);
  expect(result.pwned).toBe(true);
});

test('SANITIZED malicious WaveDrom cannot execute (#2315 fix)', async ({
  page,
}) => {
  // The IIFE is not valid WaveDrom data, so the sanitizer drops the script.
  const safe = sanitize(MALICIOUS);
  expect(safe).not.toContain('__pwned');
  const result = await processAll(page, safe);
  expect(result.pwned).toBe(false);
  expect(result.hasWavedromScript).toBe(0);
});

test('SANITIZED benign WaveDrom still renders an SVG', async ({ page }) => {
  // JSON5 (unquoted keys, single quotes) is normalized to strict JSON and
  // then rendered by ProcessAll's eval — which only ever sees inert data.
  const safe = sanitize(BENIGN_JSON5);
  expect(safe).toContain('"signal"');
  const result = await processAll(page, safe);
  expect(result.pwned).toBe(false);
  expect(result.svgCount).toBeGreaterThan(0);
});
