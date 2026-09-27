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
 * produced, whether the `__pwned` execution sentinel was tripped, and a scan
 * of the resulting DOM for injected event handlers / dangerous SVG elements
 * (the label-injection XSS vectors).
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
    const onAttrs: string[] = [];
    const dangerousTags: string[] = [];
    hidden.querySelectorAll('*').forEach((el) => {
      // The WaveDrom data container is input, not rendered output.
      if (
        el.tagName.toLowerCase() === 'script' &&
        (el.getAttribute('type') || '').toLowerCase() === 'wavedrom'
      ) {
        return;
      }
      Array.from(el.attributes || []).forEach((a) => {
        if (/^on/i.test(a.name)) {
          onAttrs.push(`${a.name}@${el.tagName}`);
        }
        if (
          ['href', 'xlink:href', 'src', 'srcdoc'].includes(
            a.name.toLowerCase(),
          ) &&
          /javascript:|data:text\/html/i.test(a.value)
        ) {
          onAttrs.push(`${a.name}-url@${el.tagName}`);
        }
      });
      const tag = el.tagName.toLowerCase();
      if (
        [
          'script',
          'iframe',
          'foreignobject',
          'animate',
          'animatemotion',
          'animatetransform',
          'set',
          'embed',
          'object',
        ].includes(tag)
      ) {
        dangerousTags.push(tag);
      }
    });
    return {
      pwned: (window as WindowWithWaveDrom).__pwned === true,
      svgCount: hidden.querySelectorAll('svg').length,
      hasWavedromScript: hidden.querySelectorAll('script[type="WaveDrom" i]')
        .length,
      onAttrs,
      dangerousTags,
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

/**
 * Array-valued WaveDrom labels are interpreted by the client-side renderer as
 * SVG element descriptions (`tspan.parse` passes non-strings through
 * verbatim), so a label like `['image', {href, onerror}]` wires up a real
 * event handler *after* server-side sanitization has finished. Each payload
 * below must render as inert SVG once sanitized.
 */
const LABEL_INJECTION_PAYLOADS: Record<string, string> = {
  'image onerror (reported PoC)':
    '{signal:[{name:["image",{href:"missing.png",onerror:"window.__pwned=true"}],wave:"01"}]}',
  'script label with text payload':
    '{signal:[{name:["script","window.__pwned=true"],wave:"01"}]}',
  'SMIL animate retargeting href':
    '{signal:[{name:["a",{},["animate",{attributeName:"href",to:"javascript:window.__pwned=true"}]],wave:"01"}]}',
  'foreignObject embedding an iframe':
    '{signal:[{name:["foreignobject",{},["iframe",{srcdoc:"<img src=x onerror=window.__pwned=true>"}]],wave:"01"}]}',
};

function wavedromBlock(source: string): string {
  return (
    '<div class="wavedrom"><script type="WaveDrom">' +
    source +
    '</script></div>'
  );
}

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

test('UNSANITIZED label injection wires up a live SVG event handler (demonstrates the bypass)', async ({
  page,
}) => {
  // Pre-fix behavior of the reported XSS: the array-valued `name` becomes a
  // real <image onerror=...> element in the DOM once ProcessAll renders it,
  // and the handler executes when the missing image fails to load.
  const raw = wavedromBlock(
    LABEL_INJECTION_PAYLOADS['image onerror (reported PoC)'],
  );
  const result = await processAll(page, raw);
  expect(result.onAttrs).toContain('onerror@image');
  await page.waitForFunction(
    () => (window as WindowWithWaveDrom).__pwned === true,
    undefined,
    { timeout: 5000 },
  );
});

test('SANITIZED label injection renders inert SVG (image onerror PoC)', async ({
  page,
}) => {
  const safe = sanitize(
    wavedromBlock(LABEL_INJECTION_PAYLOADS['image onerror (reported PoC)']),
  );
  // The handler attribute is stripped from the data before it is embedded.
  expect(safe).not.toContain('onerror');
  const result = await processAll(page, safe);
  expect(result.pwned).toBe(false);
  expect(result.onAttrs).toEqual([]);
  // The diagram (and its benign image label) still renders.
  expect(result.svgCount).toBeGreaterThan(0);
});

for (const [name, source] of Object.entries(LABEL_INJECTION_PAYLOADS)) {
  test(`SANITIZED label injection is inert: ${name}`, async ({ page }) => {
    const safe = sanitize(wavedromBlock(source));
    const result = await processAll(page, safe);
    expect(result.pwned).toBe(false);
    expect(result.onAttrs).toEqual([]);
    expect(result.dangerousTags).toEqual([]);
    expect(result.svgCount).toBeGreaterThan(0);
  });
}

test('SANITIZED benign image label keeps rendering an image element', async ({
  page,
}) => {
  const safe = sanitize(
    wavedromBlock('{signal:[{name:["image",{href:"icon.png"}],wave:"01"}]}'),
  );
  expect(safe).toContain('"href":"icon.png"');
  const result = await processAll(page, safe);
  expect(result.svgCount).toBeGreaterThan(0);
  const hasImage = await page.evaluate(() => {
    const img = document.getElementById('hidden')!.querySelector('svg image');
    return img !== null && img.getAttribute('href') === 'icon.png';
  });
  expect(hasImage).toBe(true);
});
