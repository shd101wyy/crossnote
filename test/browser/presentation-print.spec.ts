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

/** What Chrome printed: how many sheets, and how many runs of text each sheet that has any holds, in order. */
type Printed = {
  sheets: number;
  runs: number[];
};

/**
 * Print a presentation as a PDF export does, with the white theme.
 */
async function printDeck(
  page: Page,
  {
    slides,
    printStyle,
    presentationConfig = {},
    notes = false,
  }: {
    slides: string[];
    printStyle: string;
    presentationConfig?: Record<string, unknown>;
    /** The page loads the speaker notes plugin. */
    notes?: boolean;
  },
): Promise<Printed> {
  await page.route('https://crossnote.test/reveal/**', (route) => {
    const file = new URL(route.request().url()).pathname.slice(
      '/reveal/'.length,
    );
    route.fulfill({
      contentType: file.endsWith('.js') ? 'text/javascript' : 'text/css',
      body: fs.readFileSync(path.resolve(REVEAL_DIR, file), 'utf8'),
    });
  });
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
      ${
        notes
          ? '<script src="https://crossnote.test/reveal/plugin/notes/notes.js"></script>'
          : ''
      }
    </head><body>
      <div class="reveal"><div class="slides">
        ${slides.map((slide) => `<section>${slide}</section>`).join('\n')}
      </div></div>
      ${buildPresentationInitScript({
        presentationConfig,
        notesPlugin: notes ? 'window.RevealNotes' : undefined,
        hasMermaid: false,
      })}
    </body></html>`;
  const url = 'https://crossnote.test/presentation.html?print-pdf';
  await page.route(url, (route) =>
    route.fulfill({ contentType: 'text/html', body: document }),
  );
  await page.goto(url);
  await page.waitForFunction(
    () => (window as PrintWindow).__crossnotePrintLayoutReady === true,
  );

  const pdf = await page.pdf({ preferCSSPageSize: true });
  const source = pdf.toString('latin1');
  const printed: Printed = {
    sheets: (source.match(/\/Type\s*\/Page\b/g) ?? []).length,
    runs: [],
  };
  // Chrome writes the content of every sheet as one compressed stream, in the
  // order of the sheets; each run of text in it begins with `BT`. The fonts
  // are compressed as well: a font program (it has `/Length1`) is left out,
  // so that its bytes are not taken for text.
  const start = /\bstream\r?\n/g;
  let match;
  while ((match = start.exec(source))) {
    const dictionary = source.slice(
      source.lastIndexOf('<<', match.index),
      match.index,
    );
    if (dictionary.includes('/Length1')) {
      continue;
    }
    const from = match.index + match[0].length;
    let content: string;
    try {
      content = zlib
        .inflateSync(pdf.subarray(from, source.indexOf('endstream', from)))
        .toString('latin1');
    } catch {
      continue; // a stream that is not compressed
    }
    const count = (content.match(/\bBT\b/g) ?? []).length;
    if (count > 0) {
      printed.runs.push(count);
    }
  }
  return printed;
}

const items = Array.from({ length: 30 }, (_, i) => `<li>item ${i + 1}</li>`);
const deck = [
  '<h1>One</h1>',
  `<h1>Two</h1><ul>${items.join('')}</ul>`,
  '<h1>Three</h1>',
];
const deckWithNotes = ['One', 'Two', 'Three'].map(
  (title) => `<h1>${title}</h1><aside class="notes">Notes of ${title}.</aside>`,
);

test('a slide taller than one page is printed as reveal.js laid it out: its list starts under its heading, on the same sheet (#595)', async ({
  page,
}) => {
  await page.setViewportSize({ width: 800, height: 600 });
  const { runs } = await printDeck(page, {
    slides: deck,
    printStyle: presentationPrintStyle,
  });

  // One sheet for each short slide, three for the tall one.
  expect(runs).toHaveLength(5);
  // The first sheet of the tall slide has its heading and the first items.
  // Without the print style the list was moved whole to the next sheet, and
  // this one had the heading alone.
  expect(runs[1]).toBeGreaterThan(1);
});

test('with the speaker notes on sheets of their own, no empty sheet follows the notes of the last slide (#634)', async ({
  page,
}) => {
  await page.setViewportSize({ width: 800, height: 600 });
  const { sheets, runs } = await printDeck(page, {
    slides: deckWithNotes,
    printStyle: presentationPrintStyle,
    presentationConfig: { showNotes: 'separate-page' },
    notes: true,
  });

  // A sheet for each slide and one for its notes. Without the last rule of
  // the print style the notes of the last slide ended the deck on a page
  // break, and Chrome printed one more sheet, which held no text.
  expect(sheets).toBe(6);
  expect(runs).toHaveLength(6);
});
