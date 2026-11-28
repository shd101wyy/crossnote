import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import { expect, Page, test } from '@playwright/test';
import {
  buildPresentationInitScript,
  presentationPrintStyle,
} from '../../src/markdown-engine/presentation-export';

const REVEAL_DIR = path.resolve(__dirname, '../../dependencies/reveal');

type PrintWindow = Window &
  typeof globalThis & { __crossnotePrintLayoutReady?: boolean };

/**
 * Print a presentation as a PDF export does, with the white theme, and return
 * how many runs of text each sheet of paper has, in order.
 */
async function printedTextRuns(
  page: Page,
  slides: string[],
  printStyle: string,
): Promise<number[]> {
  await page.route('https://crossnote.test/reveal/**', (route) =>
    route.fulfill({
      contentType: 'text/css',
      body: fs.readFileSync(
        path.resolve(
          REVEAL_DIR,
          new URL(route.request().url()).pathname.slice('/reveal/'.length),
        ),
        'utf8',
      ),
    }),
  );
  await page.route('https://crossnote.test/reveal.js', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: fs.readFileSync(path.resolve(REVEAL_DIR, 'js/reveal.js'), 'utf8'),
    }),
  );
  const document = `<!doctype html><html><head>
      <link rel="stylesheet" href="https://crossnote.test/reveal/css/reveal.css">
      ${printStyle}
      <link rel="stylesheet" href="https://crossnote.test/reveal/css/theme/white.css">
      <script src="https://crossnote.test/reveal.js"></script>
    </head><body>
      <div class="reveal"><div class="slides">
        ${slides.map((slide) => `<section>${slide}</section>`).join('\n')}
      </div></div>
      ${buildPresentationInitScript({ presentationConfig: {}, hasMermaid: false })}
    </body></html>`;
  const url = 'https://crossnote.test/presentation.html?print-pdf';
  await page.route(url, (route) =>
    route.fulfill({ contentType: 'text/html', body: document }),
  );
  await page.goto(url);
  await page.waitForFunction(
    () => (window as PrintWindow).__crossnotePrintLayoutReady === true,
  );

  // Chrome writes the content of every sheet as one compressed stream, in
  // the order of the sheets; each run of text in it begins with `BT`.
  const pdf = await page.pdf({ preferCSSPageSize: true });
  const source = pdf.toString('latin1');
  const runs: number[] = [];
  const start = /stream\r?\n/g;
  let match;
  while ((match = start.exec(source))) {
    const from = match.index + match[0].length;
    let content: string;
    try {
      content = zlib
        .inflateSync(pdf.subarray(from, source.indexOf('endstream', from)))
        .toString('latin1');
    } catch {
      continue; // not compressed content: a font, an image
    }
    const count = (content.match(/\bBT\b/g) ?? []).length;
    if (count > 0) {
      runs.push(count);
    }
  }
  return runs;
}

const items = Array.from({ length: 30 }, (_, i) => `<li>item ${i + 1}</li>`);
const deck = [
  '<h1>One</h1>',
  `<h1>Two</h1><ul>${items.join('')}</ul>`,
  '<h1>Three</h1>',
];

test('a slide taller than one page is printed as reveal.js laid it out: its list starts under its heading, on the same sheet (#595)', async ({
  page,
}) => {
  await page.setViewportSize({ width: 800, height: 600 });
  const runs = await printedTextRuns(page, deck, presentationPrintStyle);

  // One sheet for each short slide, three for the tall one.
  expect(runs).toHaveLength(5);
  // The first sheet of the tall slide has its heading and the first items.
  // Without the print style the list was moved whole to the next sheet, and
  // this one had the heading alone.
  expect(runs[1]).toBeGreaterThan(1);
});
