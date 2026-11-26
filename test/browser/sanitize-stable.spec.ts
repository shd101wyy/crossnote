import { BrowserContext, expect, Page, test } from '@playwright/test';
import * as cheerio from 'cheerio';
import { escape } from 'html-escaper';
import {
  sanitizeRenderedHTML,
  sanitizeStableHTML,
} from '../../src/markdown-engine/sanitize';
import {
  LONG_MUTATION,
  MUTATIONS,
  sanitizeOnce,
} from '../fixtures/mutating-markup';
import { startServer, TestServer } from './server';

/**
 * The sanitizer reads markup with cheerio; the page reads it with the
 * browser. A page that the engine has rendered is read once more before it
 * is shown — an HTML export is opened as a document — and the speaker notes
 * of a slide once more after that: what the sanitizer makes of `data-notes`
 * is written into the speaker view by reveal.js, as HTML. So here a real
 * Chromium reads them again, as the page reads them: the export as a
 * document, the notes by themselves, and once through the notes plugin of
 * the vendored reveal.js.
 */

type RevealWindow = Window &
  typeof globalThis & {
    Reveal: {
      initialize(config: unknown): Promise<void>;
      isReady(): boolean;
    };
    RevealNotes: unknown;
  };

/** The notes element of the speaker view. */
const NOTES = '.speaker-controls-notes .value';

let server: TestServer;

test.beforeAll(async () => {
  server = await startServer();
});

test.afterAll(async () => {
  await server?.close();
});

/** What a page finds in markup it reads as the content of an element. */
function readIn(page: Page, html: string): Promise<string[]> {
  return page.evaluate((markup) => {
    const element = document.createElement('div');
    element.innerHTML = markup;
    const threats: string[] = [];
    element.querySelectorAll('*').forEach((el) => {
      if (el.tagName.toLowerCase() === 'script') {
        threats.push('script');
      }
      Array.from(el.attributes).forEach(({ name }) => {
        if (/^on/i.test(name)) {
          threats.push(`${name} on ${el.tagName.toLowerCase()}`);
        }
      });
    });
    return threats;
  }, html);
}

test.describe('markup that a page takes back as HTML', () => {
  test.beforeEach(async ({ page }) => {
    // An image that cannot load runs the handler that one reading leaves.
    page.on('dialog', (dialog) => dialog.dismiss());
    await page.goto(server.url);
  });

  for (const [index, markup] of MUTATIONS.entries()) {
    test(`#${index + 1} is read without an event handler once it is sanitized`, async ({
      page,
    }) => {
      expect(await readIn(page, sanitizeStableHTML(markup))).toEqual([]);
    });

    test(`#${index + 1} is not made safe by one reading`, async ({ page }) => {
      // The reading changes in a browser as it does in cheerio: the page
      // reads an event handler where the sanitizer read text.
      expect(await readIn(page, sanitizeOnce(markup))).not.toEqual([]);
    });
  }

  test('in markup that three readings are not enough for, no MathML and SVG is left', async ({
    page,
  }) => {
    let markup = LONG_MUTATION;
    for (let reading = 0; reading < 3; reading++) {
      markup = sanitizeOnce(markup);
    }
    // In a browser too, three readings are not enough.
    expect(await readIn(page, markup)).not.toEqual([]);

    const sanitized = sanitizeStableHTML(LONG_MUTATION);

    expect(sanitized).not.toMatch(/<math|<svg/);
    expect(await readIn(page, sanitized)).toEqual([]);
  });
});

/**
 * The page as the engine hands it back before it is read again: parsed as a
 * document, sanitized, and written out.
 */
function firstReading(markup: string): string {
  const $ = cheerio.load(
    `<!DOCTYPE html><html><head></head><body><div>${markup}</div></body></html>`,
  );
  sanitizeRenderedHTML($);
  return ($('head').html() ?? '') + ($('body').html() ?? '');
}

/**
 * Open the HTML export of a page and return what the browser found in it:
 * the event handlers in the document, and the dialogs that opened by
 * themselves — or, given a selector, after that element was clicked.
 */
async function openExport(
  context: BrowserContext,
  html: string,
  click?: string,
) {
  await context.route(/\/export\.html$/, (route) =>
    route.fulfill({
      contentType: 'text/html; charset=utf-8',
      body: `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8"></head>
  <body><div class="crossnote">${html}</div></body>
</html>`,
    }),
  );
  const page = await context.newPage();
  const dialogs: string[] = [];
  const opened = new Promise<void>((resolve) => {
    page.on('dialog', (dialog) => {
      dialogs.push(dialog.message());
      dialog.dismiss();
      resolve();
    });
  });
  await page.goto(`${server.url}/export.html`);
  if (click) {
    await page.waitForSelector(click);
    await page.click(click);
  }
  // A dialog is reported a moment after the page runs what opens it, so the
  // page is not closed before it could be.
  await Promise.race([opened, page.waitForTimeout(500)]);
  const handlers = await page.evaluate(() =>
    Array.from(document.querySelectorAll('*')).flatMap((el) =>
      Array.from(el.attributes)
        .filter(({ name }) => /^on/i.test(name))
        .map(({ name }) => name),
    ),
  );
  await page.close();
  return { handlers, dialogs };
}

test.describe('the page a note is rendered to, as an HTML export', () => {
  for (const [index, markup] of MUTATIONS.entries()) {
    test(`#${index + 1} runs nothing when it is opened`, async ({
      context,
    }) => {
      // Read once only, the document runs the handler by itself: an image
      // that cannot load, an input that focuses itself.
      const once = firstReading(markup);
      expect((await openExport(context, once)).dialogs).not.toEqual([]);

      expect(await openExport(context, sanitizeStableHTML(once))).toEqual({
        handlers: [],
        dialogs: [],
      });
    });
  }

  test('a link whose address comes from an animation runs nothing when it is clicked', async ({
    context,
  }) => {
    // The animation gives the link its address once the page is read. The
    // sanitizer used to leave the animation where it was, which is what the
    // page looks like here.
    const link = '<text x="10" y="30" font-size="20" id="link">click me</text>';
    const svg = (animation: string) =>
      `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="50"><a>${link}${animation}</a></svg>`;
    const animation =
      '<animate attributeName="href" values="javascript:alert(1)" dur="indefinite"/>';

    expect(
      (await openExport(context, svg(animation), '#link')).dialogs,
    ).not.toEqual([]);

    expect(
      await openExport(context, firstReading(svg(animation)), '#link'),
    ).toEqual({ handlers: [], dialogs: [] });
  });
});

/**
 * Present a slide — with the given speaker notes, or with an element of the
 * slide that has them — open the speaker view, and return what it finds in
 * the notes, and what they made the pages say.
 *
 * The deck is laid out like an export: the document loads reveal.js and its
 * notes plugin, and starts the presentation. The speaker view previews the
 * slides in iframes that load the deck again, and tells the presentation
 * that it is connected once they have: the deck is answered for every window
 * of the browser context. reveal.js takes the notes of the slide, and of the
 * fragment that is current: a fragment is found by its class, and for a
 * fragment the presentation is moved on first.
 */
async function speakerViewOf(
  context: BrowserContext,
  page: Page,
  notes: string,
  on: 'slide' | 'fragment' | 'current-fragment',
) {
  const element = `<p class="${on}" data-notes="${escape(notes)}">A point</p>`;
  const slide =
    on === 'slide'
      ? `<section class="slide" data-notes="${escape(notes)}"><h1>One</h1></section>`
      : `<section class="slide"><h1>One</h1>${element}</section>`;
  await context.route(/\/deck\.html(\?|$)/, (route) =>
    route.fulfill({
      contentType: 'text/html; charset=utf-8',
      body: `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8"></head>
  <body>
    <div class="reveal"><div class="slides">${slide}</div></div>
    <script src="${server.url}/reveal/js/reveal.js"></script>
    <script src="${server.url}/reveal/plugin/notes/notes.js"></script>
    <script>
      Reveal.initialize({ plugins: [window.RevealNotes] })
    </script>
  </body>
</html>`,
    }),
  );
  await page.goto(`${server.url}/deck.html`);
  await page.waitForFunction(() => (window as RevealWindow).Reveal.isReady());
  if (on === 'fragment') {
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(() =>
      document.querySelector('.current-fragment')?.hasAttribute('data-notes'),
    );
  }

  const dialogs: string[] = [];
  const hear = (dialog: { message(): string; dismiss(): Promise<void> }) => {
    dialogs.push(dialog.message());
    dialog.dismiss();
  };
  context.on('page', (opened) => opened.on('dialog', hear));
  page.on('dialog', hear);
  const opened = page.waitForEvent('popup');
  await page.keyboard.press('s');
  const speakerView = await opened;

  // The presentation tells the speaker view its state once the view is
  // connected.
  await speakerView.waitForFunction(
    (selector) =>
      (document.querySelector(selector)?.innerHTML ?? '').length > 0,
    NOTES,
    { timeout: 10000 },
  );
  const found = await speakerView.evaluate((selector) => {
    const box = document.querySelector(selector)!;
    const handlers = Array.from(box.querySelectorAll('*')).flatMap((el) =>
      Array.from(el.attributes)
        .filter(({ name }) => /^on/i.test(name))
        .map(({ name }) => `${name} on ${el.tagName.toLowerCase()}`),
    );
    return { handlers, html: box.innerHTML };
  }, NOTES);
  await speakerView.close();
  return { ...found, dialogs };
}

test.describe('the speaker view of a presentation', () => {
  for (const [where, on] of [
    ['of a slide', 'slide'],
    ['of a fragment', 'fragment'],
    [
      'of the element a note itself marks as the fragment that is current',
      'current-fragment',
    ],
  ] as const) {
    test(`finds no event handler in the notes ${where}`, async ({
      context,
      page,
    }) => {
      const found = await speakerViewOf(
        context,
        page,
        sanitizeStableHTML(MUTATIONS[0]),
        on,
      );

      expect(found.handlers).toEqual([]);
      expect(found.dialogs).toEqual([]);
      // The notes did reach the speaker view.
      expect(found.html).toContain('<input autofocus="">');
    });

    test(`in the notes ${where}, one reading leaves an event handler`, async ({
      context,
      page,
    }) => {
      // The speaker view reads the notes as reveal.js gives them to it, so
      // what a reading of the sanitizer's output leaves is what it gets.
      const found = await speakerViewOf(
        context,
        page,
        sanitizeOnce(MUTATIONS[0]),
        on,
      );

      expect(found.handlers).not.toEqual([]);
    });
  }
});
