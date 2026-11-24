import * as path from 'path';
import { expect, Page, test } from '@playwright/test';
import { escape } from 'html-escaper';
import { build } from 'esbuild';
import { startServer, TestServer } from './server';

/**
 * A presentation in the preview is Reveal's to lay out and to animate, while
 * its Mermaid diagrams are rendered by the preview, one slide at a time
 * (`initPresentationEvent` in src/webview/containers/preview.ts). These tests
 * run the real preview container with the vendored Reveal and the real Mermaid
 * in a document laid out like the one the engine generates
 * (`generateHTMLTemplateForPreview`): `.reveal .slides` at the top of
 * `<body>`, Reveal started by `initRevealPresentation`, and Mermaid configured
 * before the preview loads.
 */

interface RevealApi {
  isReady(): boolean;
  getConfig(): { transition: string; scrollActivationWidth: number | null };
  getIndices(): { h: number; v: number };
  getCurrentSlide(): HTMLElement;
  isScrollView(): boolean;
}

type PresentationWindow = Window & {
  Reveal: RevealApi;
  __hostMessages: Array<{ command?: string; args?: unknown[] }>;
  /** Set when `holdRender` is on: one resolver for each render Mermaid was asked for and is held in. */
  __heldRenders: Array<() => void>;
  /** Set when `holdRender` is on: Mermaid's own `render`, which is not held. */
  __unheldRender: Window['mermaid']['render'];
};

interface DeckState {
  indices: { h: number; v: number };
  transition: string;
  /** For each slide: whether its diagram is in. */
  rendered: boolean[];
  /** For each slide: the width in the `viewBox` of its diagram, when it is in. */
  viewBoxWidths: Array<number | null>;
  /** For each slide: the lines the label of its diagram is on, when it is in. */
  labelLines: Array<number | null>;
  /**
   * For each slide: by how much its `top` is off the one Reveal gives a slide
   * of the content it holds now. Reveal centers a slide from the height of
   * its content, so it has to be laid out again once a diagram is in.
   */
  offCenter: number[];
}

const DIAGRAM = `flowchart LR
    Idea["Collect every idea in one place before deciding what to build next"] --> Decide["Decide"]`;

/** The slides of the deck, each by the line of the source it is written at. */
const LAST_DIAGRAM = DIAGRAM.replace('Decide["Decide"]', 'Decide["Commit"]');
const SLIDES: { line: number; diagram?: string }[] = [
  { line: 3, diagram: DIAGRAM },
  { line: 9, diagram: DIAGRAM },
  { line: 15 },
  { line: 19, diagram: LAST_DIAGRAM },
];
/** The preview opens with the editor cursor on the second slide. */
const OPENED_ON = 1;

let server: TestServer;
let previewHarnessJs: string;

test.beforeAll(async () => {
  server = await startServer();
  const { outputFiles } = await build({
    entryPoints: [path.resolve(__dirname, 'preview-container-harness.tsx')],
    bundle: true,
    format: 'iife',
    platform: 'browser',
    write: false,
  });
  previewHarnessJs = outputFiles[0].text;
});

test.afterAll(async () => {
  await server?.close();
});

/**
 * Open the presentation in the page, the way the engine's template sets it
 * up, with the preview in place of the webview bundle.
 */
async function openPresentation(
  page: Page,
  pageErrors: string[],
  {
    transition,
    cursorLine,
    presentationConfig = {},
    holdRender = false,
  }: {
    transition?: string;
    cursorLine: number;
    /** Further configuration for Reveal. */
    presentationConfig?: Record<string, unknown>;
    /** Hold every render Mermaid is asked for until the test releases it. */
    holdRender?: boolean;
  },
): Promise<void> {
  const slides = SLIDES.map(
    (
      { line, diagram },
      h,
    ) => `<section class="slide" data-source-line="${line}" data-h="${h}" data-v="0">
        <h1>Slide ${h + 1}</h1>
        ${
          diagram
            ? `<div class="mermaid">${escape(diagram)}</div>`
            : '<p>No diagram on this slide.</p>'
        }
      </section>`,
  ).join('\n');
  const config = {
    sourceUri: 'file:///tmp/presentation.md',
    cursorLine,
    isVSCode: true,
    enablePreviewContextMenu: false,
  };
  const document = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta id="crossnote-data" data-config="${escape(JSON.stringify(config))}">
    <link rel="stylesheet" href="${server.url}/reveal/css/reveal.css">
    <link rel="stylesheet" href="${server.url}/reveal/css/theme/white.css">
  </head>
  <body class="preview-container" data-presentation-mode>
    <div class="reveal"><div class="slides">${slides}</div></div>
    <script src="${server.url}/reveal/js/reveal.js"></script>
    <script src="${server.url}/mermaid/mermaid.min.js"></script>
    <script>
      mermaid.initialize({ startOnLoad: false, cloneCssStyles: false, theme: 'default' })
      ${
        holdRender
          ? `window.__heldRenders = []
      const render = mermaid.render.bind(mermaid)
      window.__unheldRender = render
      mermaid.render = async (...args) => {
        await new Promise((resolve) => window.__heldRenders.push(resolve))
        return render(...args)
      }`
          : ''
      }
      window.initRevealPresentation = async function () {
        await Reveal.initialize(${JSON.stringify({
          margin: 0.1,
          // The engine's initialize default (markdown-engine/index.ts):
          // without it, reveal.js 5+ turns decks narrower than 435px into
          // its scroll view.
          scrollActivationWidth: null,
          ...presentationConfig,
          ...(transition === undefined ? {} : { transition }),
        })})
        await new Promise((resolve) => setTimeout(resolve, 200))
      }
    </script>
    <script src="${server.url}/webview/preview.js"></script>
  </body>
</html>`;
  await page.route(`${server.url}/presentation.html`, (route) =>
    route.fulfill({
      contentType: 'text/html; charset=utf-8',
      body: document,
    }),
  );
  await page.route(`${server.url}/webview/preview.js`, (route) =>
    route.fulfill({ contentType: 'text/javascript', body: previewHarnessJs }),
  );
  await page.addInitScript(() => {
    const hostWindow = window as unknown as PresentationWindow & {
      acquireVsCodeApi: () => {
        postMessage(message: unknown): void;
        getState(): unknown;
        setState(): undefined;
      };
    };
    hostWindow.__hostMessages = [];
    hostWindow.acquireVsCodeApi = () => ({
      postMessage: (message) => {
        hostWindow.__hostMessages.push(
          message as PresentationWindow['__hostMessages'][number],
        );
      },
      getState: () => null,
      setState: () => undefined,
    });
  });
  page.on('pageerror', (error) => pageErrors.push(String(error)));
  await page.goto(`${server.url}/presentation.html`);
  await page.waitForFunction(() =>
    (window as unknown as PresentationWindow).Reveal.isReady(),
  );
}

/**
 * Wait until slide `h` is the current one and its diagram is in. The diagram
 * is a child of its node; the svg Mermaid measures in while it renders is
 * further down, in the element the preview has it measure in.
 */
async function waitForDiagram(page: Page, h: number): Promise<void> {
  await page.waitForFunction(
    (h) => {
      const { Reveal } = window as unknown as PresentationWindow;
      return (
        Reveal.getIndices().h === h &&
        !!Reveal.getCurrentSlide().querySelector('div.mermaid > svg')
      );
    },
    h,
    { timeout: 10_000 },
  );
}

async function readDeck(page: Page): Promise<DeckState> {
  return page.evaluate(() => {
    const { Reveal } = window as unknown as PresentationWindow;
    const slides = Array.from(
      document.querySelectorAll<HTMLElement>('.slides > section'),
    );
    const slideHeight =
      document.querySelector<HTMLElement>('.slides')!.clientHeight;
    return {
      indices: Reveal.getIndices(),
      transition: Reveal.getConfig().transition,
      rendered: slides.map(
        (slide) => !!slide.querySelector('div.mermaid > svg'),
      ),
      viewBoxWidths: slides.map((slide) => {
        const width = slide
          .querySelector('div.mermaid > svg')
          ?.getAttribute('viewBox')
          ?.split(/\s+/)[2];
        return width === undefined ? null : Number(width);
      }),
      labelLines: slides.map((slide) => {
        const label = slide.querySelector<HTMLElement>(
          'div.mermaid > svg foreignObject div',
        );
        return label
          ? Math.round(
              label.offsetHeight /
                parseFloat(getComputedStyle(label).lineHeight),
            )
          : null;
      }),
      offCenter: slides.map((slide) => {
        const centered = Math.max((slideHeight - slide.scrollHeight) / 2, 0);
        return Math.abs(parseFloat(slide.style.top) - centered);
      }),
    };
  });
}

/** The width in the `viewBox` Mermaid gives the diagram where nothing scales it. */
function unscaledViewBoxWidth(
  page: Page,
  diagram: string = DIAGRAM,
): Promise<number> {
  return page.evaluate(async (diagram) => {
    const globals = window as unknown as PresentationWindow;
    const { svg } = await (globals.__unheldRender ?? globals.mermaid.render)(
      'deck-reference',
      diagram,
    );
    return Number(
      new DOMParser()
        .parseFromString(svg, 'image/svg+xml')
        .documentElement.getAttribute('viewBox')!
        .split(/\s+/)[2],
    );
  }, diagram);
}

/** Wait until Mermaid has been asked for `count` renders it is held in, then let the first go. */
async function releaseHeldRender(page: Page): Promise<void> {
  await page.waitForFunction(
    () => (window as unknown as PresentationWindow).__heldRenders.length > 0,
  );
  await page.evaluate(() => {
    (window as unknown as PresentationWindow).__heldRenders.shift()?.();
  });
}

/** Move the editor cursor, as the host tells the preview of it. */
function moveCursorTo(page: Page, line: number): Promise<void> {
  return page.evaluate((line) => {
    window.dispatchEvent(
      new MessageEvent('message', {
        data: { command: 'changeTextEditorSelection', line: String(line) },
      }),
    );
  }, line);
}

for (const transition of [undefined, 'none', 'fade', 'slide', 'zoom']) {
  const name = transition ?? 'default';

  test(`with the ${name} transition, diagrams are rendered on the slide opened on and on each slide moved to`, async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    await openPresentation(page, pageErrors, {
      transition,
      cursorLine: SLIDES[OPENED_ON].line,
    });
    await waitForDiagram(page, OPENED_ON);
    const opened = await readDeck(page);
    const unscaledWidth = await unscaledViewBoxWidth(page);

    // The transition that was configured is the one in effect: it is only
    // switched off to put the slide the preview opens on in place.
    expect(opened.transition).toBe(transition ?? 'slide');
    // Only the slide in view is rendered so far. Its diagram is laid out in
    // the units of the slide, so that its label wraps: Reveal scales the
    // slide, which must not scale what Mermaid measures.
    expect(opened.rendered).toEqual([false, true, false, false]);
    expect(opened.viewBoxWidths[OPENED_ON]).toBe(unscaledWidth);
    expect(opened.labelLines[OPENED_ON]).toBeGreaterThan(1);
    expect(opened.offCenter[OPENED_ON]).toBeLessThan(1);

    // Two slides on, past the one without a diagram.
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await waitForDiagram(page, 3);
    const moved = await readDeck(page);

    expect(moved.rendered).toEqual([false, true, false, true]);
    expect(moved.viewBoxWidths[3]).toBe(
      await unscaledViewBoxWidth(page, LAST_DIAGRAM),
    );
    expect(moved.labelLines[3]).toBeGreaterThan(1);
    expect(moved.offCenter[3]).toBeLessThan(1);

    // Back on the slide the preview opened on: its diagram is the one
    // rendered then; nothing was rendered twice.
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.waitForFunction(
      (h) =>
        (window as unknown as PresentationWindow).Reveal.getIndices().h === h,
      OPENED_ON,
    );
    expect((await readDeck(page)).rendered).toEqual([false, true, false, true]);
    expect(await page.locator('div.mermaid[data-processed]').count()).toBe(2);
    expect(pageErrors).toEqual([]);
  });
}

test('the slide the editor cursor is moved to has its diagrams rendered, also where nothing animates', async ({
  page,
}) => {
  const pageErrors: string[] = [];
  await openPresentation(page, pageErrors, {
    transition: 'none',
    cursorLine: SLIDES[OPENED_ON].line,
  });
  await waitForDiagram(page, OPENED_ON);

  await moveCursorTo(page, SLIDES[3].line);
  await waitForDiagram(page, 3);
  const moved = await readDeck(page);

  expect(moved.indices.h).toBe(3);
  expect(moved.viewBoxWidths[3]).toBe(
    await unscaledViewBoxWidth(page, LAST_DIAGRAM),
  );
  expect(moved.labelLines[3]).toBeGreaterThan(1);
  expect(moved.offCenter[3]).toBeLessThan(1);
  expect(pageErrors).toEqual([]);
});

test('a slide left before its diagram is rendered has it rendered when it is current again', async ({
  page,
}) => {
  // Reveal takes slides further away than `viewDistance` out of layout, so
  // the diagram of a slide that is left while it renders is measured in a
  // node that is no longer rendered, and nothing is written into the node.
  const pageErrors: string[] = [];
  await openPresentation(page, pageErrors, {
    transition: 'none',
    cursorLine: SLIDES[OPENED_ON].line,
    presentationConfig: { viewDistance: 1 },
    holdRender: true,
  });
  // The diagram of the slide opened on is being rendered.
  await page.waitForFunction(
    () => (window as unknown as PresentationWindow).__heldRenders.length === 1,
  );

  // Two slides on, before it is done.
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction(
    (h) =>
      (window as unknown as PresentationWindow).Reveal.getIndices().h === h,
    3,
  );
  await releaseHeldRender(page);
  // The slide that is current now has its diagram rendered.
  await releaseHeldRender(page);
  await waitForDiagram(page, 3);
  // The slide left is not rendered while it is away: laid out outside its
  // slide, a diagram gets the text styles of the page, not of the slide.
  expect((await readDeck(page)).rendered).toEqual([false, false, false, true]);

  // Back on the slide the preview opened on: now its diagram is rendered.
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await releaseHeldRender(page);
  await waitForDiagram(page, OPENED_ON);
  const back = await readDeck(page);

  expect(back.rendered).toEqual([false, true, false, true]);
  expect(back.viewBoxWidths[OPENED_ON]).toBe(await unscaledViewBoxWidth(page));
  expect(back.labelLines[OPENED_ON]).toBeGreaterThan(1);
  expect(await page.locator('div.mermaid[data-processed]').count()).toBe(2);
  expect(pageErrors).toEqual([]);
});

test('the diagram of the first slide is rendered when the preview opens on it', async ({
  page,
}) => {
  // No slide changes on opening: the first slide's diagrams are rendered by
  // the initialization itself.
  const pageErrors: string[] = [];
  await openPresentation(page, pageErrors, {
    transition: 'none',
    cursorLine: SLIDES[0].line,
  });
  await waitForDiagram(page, 0);
  const opened = await readDeck(page);

  expect(opened.indices.h).toBe(0);
  expect(opened.rendered).toEqual([true, false, false, false]);
  expect(opened.viewBoxWidths[0]).toBe(await unscaledViewBoxWidth(page));
  expect(opened.labelLines[0]).toBeGreaterThan(1);
  expect(opened.offCenter[0]).toBeLessThan(1);
  expect(pageErrors).toEqual([]);
});

test('a deck in a preview pane narrower than the scroll view activation width stays paginated', async ({
  page,
}) => {
  // The engine initializes Reveal with `scrollActivationWidth: null` so
  // that reveal.js 5+ keeps the paginated layout in a narrow preview pane
  // instead of switching to its scroll view (which would change how
  // slides move and how the cursor syncs). The harness mirrors that
  // default; this test pins the behavior it preserves.
  const pageErrors: string[] = [];
  await page.setViewportSize({ width: 400, height: 600 });
  await openPresentation(page, pageErrors, {
    transition: 'none',
    cursorLine: SLIDES[OPENED_ON].line,
  });
  await waitForDiagram(page, OPENED_ON);

  const state = await page.evaluate(() => {
    // The plain-object cast keeps the global `Window` augmentation in
    // `src/webview/global.d.ts` (whose narrower `getConfig` would otherwise
    // win the overload) out of the way.
    const { Reveal } = window as unknown as { Reveal: RevealApi };
    return {
      isScrollView: Reveal.isScrollView(),
      scrollActivationWidth: Reveal.getConfig().scrollActivationWidth,
    };
  });
  expect(state.isScrollView).toBe(false);
  expect(state.scrollActivationWidth).toBeNull();

  // Pagination still moves between slides and renders their diagrams.
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await waitForDiagram(page, 3);
  expect((await readDeck(page)).indices.h).toBe(3);
  expect(pageErrors).toEqual([]);
});

test('a slow diagram on the slide the preview opens on does not keep the deck from being shown', async ({
  page,
}) => {
  // The transition is switched off only while that slide is put in place and
  // its diagrams are waited for, so it says when the preview is done loading.
  const pageErrors: string[] = [];
  await openPresentation(page, pageErrors, {
    transition: 'fade',
    cursorLine: SLIDES[OPENED_ON].line,
    holdRender: true,
  });
  await page.waitForFunction(
    () => (window as unknown as PresentationWindow).__heldRenders.length === 1,
  );
  await page.waitForFunction(
    () =>
      (window as unknown as PresentationWindow).Reveal.getConfig()
        .transition === 'fade',
  );
  // The diagram is still being rendered.
  expect(
    await page.evaluate(
      () => (window as unknown as PresentationWindow).__heldRenders.length,
    ),
  ).toBe(1);

  await releaseHeldRender(page);
  await waitForDiagram(page, OPENED_ON);
  const shown = await readDeck(page);

  expect(shown.viewBoxWidths[OPENED_ON]).toBe(await unscaledViewBoxWidth(page));
  expect(shown.labelLines[OPENED_ON]).toBeGreaterThan(1);
  expect(shown.offCenter[OPENED_ON]).toBeLessThan(1);
  expect(pageErrors).toEqual([]);
});
