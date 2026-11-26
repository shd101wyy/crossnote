import * as fs from 'fs';
import * as path from 'path';
import { BrowserContext, expect, Page, test } from '@playwright/test';
import { escape } from 'html-escaper';
import { buildMermaidExportScript } from '../../src/markdown-engine/mermaid-export';
import { buildPresentationInitScript } from '../../src/markdown-engine/presentation-export';
import {
  getDefaultNotebookConfig,
  NotebookConfig,
} from '../../src/notebook/types';

type ExportWindow = Window &
  typeof globalThis & {
    __crossnoteMermaidExport?: { status: string; message?: string };
    releaseMermaid: () => void;
    /** While the rendering of a diagram is held: what lets it go. */
    __held: Array<() => void>;
    /** How often a diagram was shown in the top layer, where the page counts. */
    __shownInTopLayer?: number;
    /** What was done for a presentation's sake, where the page keeps count. */
    __forPresentation?: string[];
    /** Set by the presentation's script once reveal.js has laid the pages of a PDF export out. */
    __crossnotePrintLayoutReady?: boolean;
    /** What the slides were when each Mermaid rendering began, where a page keeps count. */
    __drawing?: Array<{ pages: number; started: boolean }>;
  };

const bundle = fs.readFileSync(
  path.resolve(__dirname, '../../dependencies/mermaid/mermaid.min.js'),
  'utf8',
);

const REVEAL_DIR = path.resolve(__dirname, '../../dependencies/reveal');

/**
 * Serve `document` as an exported page at `url`, with the vendored Mermaid in
 * place of the CDN. A page is served from the same fake origin as its assets:
 * the browser refuses a request from there to the test server.
 */
async function openExport(
  page: Page,
  url: string,
  document: string,
  delayRendering: boolean = false,
  mermaidUnavailable: boolean = false,
) {
  await page.route(url, (route) =>
    route.fulfill({ contentType: 'text/html', body: document }),
  );
  await page.route('**/mermaid.min.js', (route) =>
    mermaidUnavailable
      ? route.abort()
      : route.fulfill({
          contentType: 'text/javascript',
          body:
            bundle +
            (delayRendering
              ? `
const run = mermaid.run.bind(mermaid);
const ready = new Promise(resolve => { window.releaseMermaid = resolve; });
mermaid.run = async options => { await ready; return run(options); };
`
              : ''),
        }),
  );
  await page.route('https://crossnote.test/reveal/**', (route) => {
    const file = path.resolve(
      REVEAL_DIR,
      new URL(route.request().url()).pathname.slice('/reveal/'.length),
    );
    return route.fulfill({
      contentType: file.endsWith('.css') ? 'text/css' : 'text/javascript',
      body: fs.readFileSync(file, 'utf8'),
    });
  });
  await page.goto(url);
}

async function loadExport(
  page: Page,
  diagrams: string[],
  delayRendering: boolean = false,
) {
  await openExport(
    page,
    'https://crossnote.test/export.html',
    `<!doctype html><html><body>
      ${diagrams.map((diagram) => `<div class="mermaid">${escape(diagram)}</div>`).join('\n')}
      <script src="https://crossnote.test/mermaid.min.js"></script>
      <script type="module">${buildMermaidExportScript(
        getDefaultNotebookConfig(),
        diagrams.some((diagram) => /zenuml/i.test(diagram)),
      )}</script>
    </body></html>`,
    delayRendering,
  );
}

/** Wait until the export script has finished, with `status`. */
async function waitForExport(page: Page, status: 'complete' | 'error') {
  await page.waitForFunction(
    (wanted) =>
      (window as ExportWindow).__crossnoteMermaidExport?.status === wanted,
    status,
  );
}

test('export readiness follows actual Mermaid layout after page load', async ({
  page,
}) => {
  const diagrams = [
    'graph TD\nA[Start] --> B[Finish]',
    'classDiagram\nController --> Service',
    'sequenceDiagram\nClient->>Server: Request\nServer-->>Client: Response',
  ];
  await loadExport(page, diagrams, true);
  expect(await page.evaluate(() => document.readyState)).toBe('complete');
  expect(
    await page.evaluate(
      () => (window as ExportWindow).__crossnoteMermaidExport?.status,
    ),
  ).toBe('pending');
  await expect(page.locator('.mermaid svg')).toHaveCount(0);

  await page.evaluate(() => (window as ExportWindow).releaseMermaid());
  await page.waitForFunction(
    () =>
      (window as ExportWindow).__crossnoteMermaidExport?.status === 'complete',
  );
  const rendered = await page.locator('.mermaid > svg').evaluateAll((nodes) =>
    nodes.map((node) => ({
      viewBox: node.getAttribute('viewBox'),
      text: node.textContent,
    })),
  );
  expect(rendered).toHaveLength(3);
  expect(rendered.every((diagram) => diagram.viewBox)).toBe(true);
  expect(rendered[0].text).toContain('Finish');
  expect(rendered[1].text).toContain('Service');
  expect(rendered[2].text).toContain('Response');
});

test('export reports a real Mermaid syntax failure', async ({ page }) => {
  await loadExport(page, ['not_a_diagram']);
  await page.waitForFunction(
    () => (window as ExportWindow).__crossnoteMermaidExport?.status === 'error',
  );
  const error = await page.evaluate(
    () => (window as ExportWindow).__crossnoteMermaidExport?.message,
  );
  expect(error).toContain('No diagram type detected');
});

test('a delayed ZenUML import cannot start an untracked load render', async ({
  page,
}) => {
  let releaseImport!: () => void;
  const importReady = new Promise<void>((resolve) => {
    releaseImport = resolve;
  });
  await page.route('**/mermaid-zenuml.esm.min.mjs', async (route) => {
    await importReady;
    await route.fulfill({
      contentType: 'text/javascript',
      headers: { 'access-control-allow-origin': '*' },
      body: `export default { id: 'test-zenuml', detector: () => false, loader: async () => ({}) }`,
    });
  });
  try {
    // The export detects ZenUML case-insensitively anywhere in its HTML.
    await loadExport(page, ['graph TD\nA[ZenUML example] --> B[Finish]']);
    expect(await page.evaluate(() => document.readyState)).toBe('complete');
    expect(await page.locator('.mermaid[data-processed]').count()).toBe(0);
    expect(
      await page.evaluate(
        () => (window as ExportWindow).__crossnoteMermaidExport?.status,
      ),
    ).toBe('pending');
  } finally {
    releaseImport();
  }
  await page.waitForFunction(
    () =>
      (window as ExportWindow).__crossnoteMermaidExport?.status === 'complete',
  );
  await expect(page.locator('.mermaid > svg')).toHaveAttribute(
    'viewBox',
    /\S+/,
  );
  await expect(page.locator('.mermaid > svg')).toContainText('Finish');
});

test('export reports a failed ZenUML module import', async ({ page }) => {
  await page.route('**/mermaid-zenuml.esm.min.mjs', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      headers: { 'access-control-allow-origin': '*' },
      body: 'throw new Error("ZenUML loading failed")',
    }),
  );
  await loadExport(page, ['zenuml\nClient->Server: Request']);
  await page.waitForFunction(
    () => (window as ExportWindow).__crossnoteMermaidExport?.status === 'error',
  );
  expect(
    await page.evaluate(
      () => (window as ExportWindow).__crossnoteMermaidExport?.message,
    ),
  ).toContain('ZenUML loading failed');
});

/**
 * A label long enough to run past the width Mermaid gives a node label, so
 * that it has to wrap.
 */
const LONG_LABEL =
  'A long label that has to wrap inside its node because it runs past the width Mermaid gives a node label';
const WRAPPING_FLOWCHART = `flowchart LR
    A[${LONG_LABEL}] --> B[Finish]`;
// Lays itself out to the width of its element.
const GANTT = `gantt
    title A Gantt Diagram
    dateFormat YYYY-MM-DD
    section Section
    A task :a1, 2024-01-01, 30d
    Another task :after a1, 20d`;
/** Taller than one page of a PDF export, which is 700px high. */
const TALL_FLOWCHART = `flowchart TD
${Array.from({ length: 16 }, (_, i) => `    Step${i} --> Step${i + 1}`).join('\n')}`;
/** Where, in the source of a diagram, the tests that hold a rendering look. */
const HELD = '%% held rendering';
/** A gantt whose rendering waits until the test lets it go. */
const HELD_GANTT = `%% ${HELD}\n${GANTT}`;
/**
 * A deck whose two held gantts are rendered one after the other: the first is
 * on a slide Reveal displays, the second on one it does not display.
 */
const SLOW_DECK = [
  [WRAPPING_FLOWCHART],
  [HELD_GANTT],
  [WRAPPING_FLOWCHART],
  [WRAPPING_FLOWCHART],
  [WRAPPING_FLOWCHART],
  [HELD_GANTT],
  [WRAPPING_FLOWCHART],
];

const diagramDivs = (diagrams: string[], wrap?: string, wrapStyle?: string) =>
  diagrams
    .map((diagram) => {
      const div = `<div class="mermaid">${escape(diagram)}</div>`;
      return wrap
        ? `<div class="${wrap}"${wrapStyle ? ` style="${wrapStyle}"` : ''}>${div}</div>`
        : div;
    })
    .join('\n');

const presentationBody = (
  slides: string[][],
  wrap?: string,
  wrapStyle?: string,
) =>
  `<div class="reveal"><div class="slides">
    ${slides
      .map(
        (diagrams) =>
          `<section>${diagramDivs(diagrams, wrap, wrapStyle)}</section>`,
      )
      .join('\n')}
  </div></div>`;

interface PageOptions {
  /** Further CSS for the page. */
  style?: string;
  /** Further configuration for Mermaid. */
  mermaidConfig?: NotebookConfig['mermaidConfig'];
  /** The export script is on the page twice. */
  twice?: boolean;
  /**
   * The rendering of the diagrams whose source has `HELD` in it waits until
   * the test lets it go.
   */
  held?: boolean;
  /** The engine has no top layer. */
  noTopLayer?: boolean;
  /** Each diagram has an element of this class around it. */
  wrap?: string;
  /** The style of that element. */
  wrapStyle?: string;
  /** A classic script that runs after the Mermaid bundle, before the export script. */
  afterMermaid?: string;
  /** The request for the Mermaid bundle fails. */
  mermaidUnavailable?: boolean;
}

/**
 * The scripts that render the diagrams of a page with Mermaid: the bundle,
 * then the export script, `twice` over if asked.
 */
function mermaidScripts({
  mermaidConfig,
  twice = false,
  held = false,
  afterMermaid = '',
}: PageOptions) {
  const config = getDefaultNotebookConfig();
  const exportScript = `<script type="module">${buildMermaidExportScript(
    mermaidConfig ? { ...config, mermaidConfig } : config,
    false,
  )}</script>`;
  return `<script src="https://crossnote.test/mermaid.min.js"></script>
  ${
    held
      ? `<script>
    const run = mermaid.run.bind(mermaid)
    window.__held = []
    mermaid.run = async options => {
      if (options.nodes.some(node => node.textContent.includes(${JSON.stringify(
        HELD,
      )}))) {
        await new Promise(resolve => window.__held.push(resolve))
      }
      return run(options)
    }
  </script>`
      : ''
  }
  ${
    afterMermaid
      ? `<script>
    ${afterMermaid}
  </script>`
      : ''
  }
  ${exportScript}${twice ? exportScript : ''}`;
}

interface PresentationOptions extends PageOptions {
  /** The diagrams of each slide. */
  slides: string[][];
  /** Further configuration for Reveal. */
  presentationConfig?: Record<string, unknown>;
  /** Reveal is ready only 500ms in, by a plugin of its own. */
  lateReveal?: boolean;
}

/** The width Reveal gives the slides unless the deck says otherwise. */
const DEFAULT_SLIDE_WIDTH = 960;

/**
 * Open an exported presentation, laid out as the export template lays it
 * out: reveal.js, `Reveal.initialize` in a classic script, and the Mermaid
 * module script after it. A slide is 960px wide on the 1280px screen of the
 * test browser, so the slides are scaled, and the margins a theme might give
 * a diagram leave it 880px.
 */
async function openPresentation(
  page: Page,
  {
    slides,
    presentationConfig,
    lateReveal = false,
    ...options
  }: PresentationOptions,
) {
  if (options.noTopLayer) {
    await page.addInitScript(() => {
      (
        HTMLElement.prototype as unknown as { showPopover: unknown }
      ).showPopover = undefined;
    });
  }
  await openExport(
    page,
    'https://crossnote.test/presentation.html',
    `<!doctype html><html><head>
      <link rel="stylesheet" href="https://crossnote.test/reveal/css/reveal.css">
      <style>.mermaid { margin: 0 40px }
      ${options.style ?? ''}</style>
      <script src="https://crossnote.test/reveal/js/reveal.js"></script>
    </head><body>
      ${presentationBody(slides, options.wrap, options.wrapStyle)}
      ${
        lateReveal
          ? `<script>
      window.latePlugin = {
        id: 'late',
        init() { return new Promise(resolve => setTimeout(resolve, 500)) },
      }
    </script>`
          : ''
      }
      <script>Reveal.initialize(${JSON.stringify({
        margin: 0.1,
        ...(lateReveal ? { plugins: ['window.latePlugin'] } : {}),
        ...presentationConfig,
      }).replace(/"window\.latePlugin"/g, 'window.latePlugin')})</script>
      ${mermaidScripts(options)}
    </body></html>`,
  );
}

const slideWidthOf = (options: PresentationOptions) =>
  (options.presentationConfig?.width as number | undefined) ??
  DEFAULT_SLIDE_WIDTH;

/**
 * The same slides with the same CSS, in a page that does not scale them: what
 * the diagrams of the presentation are laid out as.
 */
async function openUnscaled(page: Page, options: PresentationOptions) {
  await openExport(
    page,
    'https://crossnote.test/unscaled.html',
    `<!doctype html><html><head>
      <style>
        .reveal .slides { width: ${slideWidthOf(options)}px }
        .reveal .slides section { width: 100% }
        .mermaid { margin: 0 40px }
        ${options.style ?? ''}
      </style>
    </head><body style="margin: 0">
      ${presentationBody(options.slides, options.wrap, options.wrapStyle)}
      ${mermaidScripts({ ...options, afterMermaid: '' })}
    </body></html>`,
  );
  await waitForExport(page, 'complete');
}

/** How a diagram was laid out: the size it came out with, and how its labels were set. */
function layout(diagram: { viewBox: string | null; labels: string[] }) {
  return [diagram.viewBox, diagram.labels];
}

/** What the page holds: the diagrams, and whether each slide is displayed. */
function readPage(page: Page) {
  return page.evaluate(() => ({
    diagrams: [...document.querySelectorAll('div.mermaid')].map((node) => ({
      inSlides: !!node.closest('.slides'),
      svgs: node.querySelectorAll('svg').length,
      viewBox: node.querySelector('svg')?.getAttribute('viewBox') ?? null,
      // `break-spaces` is how Mermaid sets a label that it wrapped.
      labels: [...node.querySelectorAll('svg foreignObject > div')].map(
        (div) => getComputedStyle(div).whiteSpace,
      ),
      /** Whether the export script is showing it in the top layer. */
      inTopLayer: node.matches(':popover-open'),
      shown: getComputedStyle(node).visibility === 'visible',
      displayed: getComputedStyle(node).display !== 'none',
      /** What a rendering that was not put back leaves on the element: no diagram of these pages comes with a style. */
      leftOver: node.hasAttribute('popover') || node.hasAttribute('style'),
    })),
    slides: [
      ...document.querySelectorAll<HTMLElement>('.slides > section'),
    ].map((slide) => ({
      present: slide.classList.contains('present'),
      display: getComputedStyle(slide).display,
      displayed: getComputedStyle(slide).display !== 'none',
      /** Not only by its own style: the export script hides a slide any way up to it. */
      hidden: getComputedStyle(slide).visibility === 'hidden',
      /** By how far its `top` is off the one Reveal gives a slide of the content it holds now: Reveal centers a slide, 700px high here, from the height of its content. */
      offCenter: Math.abs(
        parseFloat(slide.style.top) -
          Math.max((700 - slide.scrollHeight) / 2, 0),
      ),
    })),
  }));
}

/** Wait until the rendering number `count` of the held diagrams is held. */
const heldSoFar = (page: Page, count: number) =>
  page.waitForFunction(
    (count) => (window as ExportWindow).__held?.length >= count,
    count,
  );

const releaseHeld = (page: Page) =>
  page.evaluate(() =>
    (window as ExportWindow).__held.splice(0).forEach((go) => go()),
  );

/** Go to the slide number `index` of the deck, and wait until it is current. */
async function goToSlide(page: Page, index: number) {
  await page.evaluate(
    (index) =>
      (
        window as unknown as { Reveal: { slide(index: number): void } }
      ).Reveal.slide(index),
    index,
  );
  await page.waitForFunction((index) => {
    const slides = document.querySelectorAll<HTMLElement>('.slides > section');
    return slides[index].classList.contains('present');
  }, index);
}

/**
 * The layout of the diagrams of the presentation against that of the same
 * slides where no scale reaches them.
 */
async function expectLaidOutAsUnscaled(
  page: Page,
  context: BrowserContext,
  options: PresentationOptions,
) {
  const unscaled = await context.newPage();
  try {
    await openUnscaled(unscaled, options);
    const expected = (await readPage(unscaled)).diagrams;
    expect((await readPage(page)).diagrams.map(layout)).toEqual(
      expected.map(layout),
    );
  } finally {
    await unscaled.close();
  }
}

test('labels wrap in an exported presentation, on every slide: each diagram is laid out where the scale of the slides does not reach it (#575)', async ({
  page,
  context,
}) => {
  const options: PresentationOptions = {
    slides: [
      [WRAPPING_FLOWCHART],
      [WRAPPING_FLOWCHART, GANTT],
      [],
      [],
      [],
      [],
      [],
      [WRAPPING_FLOWCHART],
    ],
  };
  await openPresentation(page, options);
  await waitForExport(page, 'complete');
  const presentation = await readPage(page);
  expect(
    await page.evaluate(
      () =>
        (document.querySelector('.reveal .slides') as HTMLElement).style
          .transform,
    ),
    'the deck is shown scaled',
  ).toMatch(/scale\(/);

  const unscaled = await context.newPage();
  await openUnscaled(unscaled, options);
  const expected = (await readPage(unscaled)).diagrams;

  expect(presentation.diagrams.map(layout)).toEqual(expected.map(layout));
  expect(presentation.diagrams[0].labels).toEqual(['break-spaces', 'nowrap']);
  // The gantt is as wide as its element is in its slide.
  expect(presentation.diagrams[2].viewBox).toBe('0 0 880 148');

  // Every diagram is in its slide, laid out once, with nothing left on it.
  // Reveal displays the current slide and the two after it (its view
  // distance); the others are not displayed again.
  expect(
    presentation.diagrams.map((diagram) => [
      diagram.inSlides,
      diagram.svgs,
      diagram.leftOver,
    ]),
  ).toEqual(expected.map(() => [true, 1, false]));
  expect(presentation.slides.map((slide) => slide.displayed)).toEqual([
    true,
    true,
    true,
    false,
    false,
    false,
    false,
    false,
  ]);
  expect(presentation.slides.some((slide) => slide.hidden)).toBe(false);
});

test('a diagram is laid out with the width and the styles of its slide', async ({
  page,
  context,
}) => {
  const options: PresentationOptions = {
    slides: [[WRAPPING_FLOWCHART], [GANTT]],
    style: `.reveal .slides section .mermaid { box-sizing: border-box; width: 60%; padding: 12px; border: 2px solid transparent }
      .reveal .slides section .mermaid svg { font-size: 22px !important }`,
  };
  await openPresentation(page, options);
  await waitForExport(page, 'complete');
  await expectLaidOutAsUnscaled(page, context, options);
  const { diagrams } = await readPage(page);
  // Sized by the slide: 60% of its 960px, less the padding and the border
  // the style gives the diagram.
  expect(diagrams[1].viewBox).toBe('0 0 548 148');

  // Without the style of the slide the label is laid out differently: so
  // the style reached the diagram while it was laid out.
  const unstyled = await context.newPage();
  await openUnscaled(unstyled, { slides: options.slides });
  expect(layout((await readPage(unstyled)).diagrams[0])).not.toEqual(
    layout(diagrams[0]),
  );
});

for (const { what, slidesWidth, style, viewBox } of [
  {
    what: 'a minimum width in percent of it',
    slidesWidth: DEFAULT_SLIDE_WIDTH,
    style: 'width: 420px; min-width: 50%',
    // Half of the 960px of the slide, not of the 1280px window, where the top
    // layer would take it.
    viewBox: '0 0 480 148',
  },
  {
    what: 'a maximum width in percent of it, on slides wider than the window',
    slidesWidth: 1400,
    style: 'width: 900px; max-width: 50%',
    // Half of the 1400px of the slide, where the top layer would let 640px.
    viewBox: '0 0 700 148',
  },
]) {
  test(`a diagram keeps the width of its slide under ${what}`, async ({
    page,
    context,
  }) => {
    const options: PresentationOptions = {
      slides: [[WRAPPING_FLOWCHART], [GANTT]],
      presentationConfig: { width: slidesWidth },
      style: `.reveal .slides section .mermaid { ${style} }`,
    };
    await openPresentation(page, options);
    await waitForExport(page, 'complete');
    await expectLaidOutAsUnscaled(page, context, options);
    expect((await readPage(page)).diagrams[1].viewBox).toBe(viewBox);
  });
}

test('a diagram element the page does not display is rendered at the width of its slide, and is not displayed again', async ({
  page,
}) => {
  await openPresentation(page, {
    slides: [[WRAPPING_FLOWCHART], [GANTT]],
    style: '.reveal .slides section:nth-child(2) .mermaid { display: none }',
  });
  await waitForExport(page, 'complete');
  const { diagrams } = await readPage(page);

  // Not collapsed, as a diagram Mermaid measures where nothing is displayed.
  expect(diagrams[1].viewBox).toBe('0 0 880 148');
  expect(
    diagrams.map((diagram) => [diagram.displayed, diagram.leftOver]),
  ).toEqual([
    [true, false],
    [false, false],
  ]);
});

for (const { had, wrapStyle, style, left } of [
  {
    had: 'and had no style of its own',
    wrapStyle: undefined,
    style: '.reveal .slides .away { display: none }',
    left: [null, 'none'],
  },
  {
    // Not as the style object would give it back: the text is put back as it
    // was.
    had: 'and had a style of its own',
    wrapStyle: 'display:none; color: red',
    style: '',
    left: ['display:none; color: red', 'none'],
  },
]) {
  test(`an element around a diagram that the page does not display is shown for the rendering only, and is left as it was, ${had}`, async ({
    page,
  }) => {
    await openPresentation(page, {
      slides: [[WRAPPING_FLOWCHART], [GANTT]],
      wrap: 'away',
      wrapStyle,
      style,
    });
    await waitForExport(page, 'complete');
    const { diagrams } = await readPage(page);

    expect(diagrams.map((diagram) => [diagram.svgs, diagram.leftOver])).toEqual(
      [
        [1, false],
        [1, false],
      ],
    );
    // Not collapsed, as a diagram Mermaid measures where nothing is displayed.
    expect(diagrams[1].viewBox).toBe('0 0 880 148');
    expect(
      await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('.slides .away')].map(
          (node) => [
            node.getAttribute('style'),
            getComputedStyle(node).display,
          ],
        ),
      ),
      'the elements around the diagrams',
    ).toEqual([left, left]);
  });
}

test('a diagram that cannot be rendered does not keep the others back, and the slides are laid out again', async ({
  page,
}) => {
  await openPresentation(page, {
    slides: [[WRAPPING_FLOWCHART], ['not_a_diagram'], [GANTT]],
  });
  await waitForExport(page, 'error');
  const { diagrams, slides } = await readPage(page);

  expect(diagrams.map((diagram) => diagram.inSlides)).toEqual([
    true,
    true,
    true,
  ]);
  expect(diagrams[0].svgs).toBe(1);
  expect(diagrams[2].svgs).toBe(1);
  expect(diagrams[0].labels).toEqual(['break-spaces', 'nowrap']);
  expect(diagrams[2].viewBox).toBe('0 0 880 148');
  expect(diagrams.map((diagram) => diagram.leftOver)).toEqual([
    false,
    false,
    false,
  ]);
  // Reveal's layout at window load ran while the first diagrams were out of
  // their slides: they are centered with the diagrams they hold now.
  expect(slides.map((slide) => slide.offCenter)).toEqual([0, 0, 0]);
});

test('the slides are centered again once their diagrams are in', async ({
  page,
}) => {
  await openPresentation(page, { slides: [[GANTT], [WRAPPING_FLOWCHART]] });
  await waitForExport(page, 'complete');
  const { slides } = await readPage(page);
  expect(slides.map((slide) => slide.offCenter)).toEqual([0, 0]);
});

test('a slow diagram is rendered unseen, on a slide Reveal displays or not, and does not keep the others back', async ({
  page,
}) => {
  // The gantts are held one after the other: the first is on a slide Reveal
  // displays, the second on one it does not.
  await openPresentation(page, { slides: SLOW_DECK, held: true });
  const laidOut = [1, false, true];
  const waiting = [0, false, true];

  // The flowcharts before the first gantt are done. Neither the gantt nor a
  // box of the top layer is shown over the deck.
  await heldSoFar(page, 1);
  const first = await readPage(page);
  expect(
    first.diagrams.map((diagram) => [
      diagram.svgs,
      diagram.inTopLayer,
      diagram.shown,
    ]),
  ).toEqual([
    laidOut,
    [0, true, false],
    waiting,
    waiting,
    waiting,
    waiting,
    waiting,
  ]);
  expect(first.slides.map((slide) => slide.displayed)).toEqual([
    true,
    true,
    true,
    false,
    false,
    false,
    false,
  ]);
  expect(first.slides.some((slide) => slide.hidden)).toBe(false);

  await releaseHeld(page);
  // The slide of the second gantt is beyond the slides Reveal displays: it
  // is displayed, unseen, for as long as the gantt is rendered in it.
  await heldSoFar(page, 1);
  const second = await readPage(page);
  expect(
    second.diagrams.map((diagram) => [
      diagram.svgs,
      diagram.inTopLayer,
      diagram.shown,
    ]),
  ).toEqual([
    laidOut,
    laidOut,
    laidOut,
    laidOut,
    laidOut,
    [0, true, false],
    waiting,
  ]);
  expect(second.slides.map((slide) => [slide.displayed, slide.hidden])).toEqual(
    [
      [true, false],
      [true, false],
      [true, false],
      [false, false],
      [false, false],
      [true, true],
      [false, false],
    ],
  );

  await releaseHeld(page);
  await waitForExport(page, 'complete');
  const { diagrams, slides } = await readPage(page);
  expect(diagrams.map((diagram) => [diagram.svgs, diagram.leftOver])).toEqual(
    diagrams.map(() => [1, false]),
  );
  expect(slides.map((slide) => slide.displayed && !slide.hidden)).toEqual([
    true,
    true,
    true,
    false,
    false,
    false,
    false,
  ]);
});

for (const [deck, display] of [
  ['', 'block'],
  [', with its slides shown as flex containers', 'flex'],
] as const) {
  test(`a slide the reader comes to while its diagram is rendered is left as Reveal shows it${deck}`, async ({
    page,
  }) => {
    await openPresentation(page, {
      slides: SLOW_DECK,
      held: true,
      ...(display === 'flex'
        ? { presentationConfig: { display: 'flex' } }
        : {}),
    });
    // The second gantt is being rendered in the fifth slide, which Reveal did
    // not display.
    await heldSoFar(page, 1);
    await releaseHeld(page);
    await heldSoFar(page, 1);
    await goToSlide(page, 5);
    await releaseHeld(page);
    await waitForExport(page, 'complete');
    // reveal.js takes the visibility of a slide through a transition of its
    // own: the slide is shown from the next frame on.
    await page.waitForFunction(
      () =>
        getComputedStyle(
          document.querySelectorAll<HTMLElement>('.slides > section')[5],
        ).visibility === 'visible',
      undefined,
      { timeout: 5000 },
    );
    const { diagrams, slides } = await readPage(page);

    // reveal.js entered the slide meanwhile: it is the one shown, with the
    // display the deck is configured to.
    expect(slides[5]).toMatchObject({
      present: true,
      displayed: true,
      display,
      hidden: false,
    });
    expect(diagrams[5]).toMatchObject({
      svgs: 1,
      viewBox: '0 0 880 148',
      shown: true,
      leftOver: false,
    });
  });
}

test('a slide the reader passes through while its diagram is rendered is shown again when they return', async ({
  page,
}) => {
  await openPresentation(page, { slides: SLOW_DECK, held: true });
  // The second gantt is being rendered in the fifth slide, which Reveal did
  // not display.
  await heldSoFar(page, 1);
  await releaseHeld(page);
  await heldSoFar(page, 1);
  await goToSlide(page, 5);
  await goToSlide(page, 0);
  await releaseHeld(page);
  await waitForExport(page, 'complete');
  // As Reveal left it: not displayed, and not hidden any more.
  expect((await readPage(page)).slides[5]).toMatchObject({
    present: false,
    displayed: false,
    hidden: false,
  });

  await goToSlide(page, 5);
  const { diagrams, slides } = await readPage(page);
  expect(slides[5]).toMatchObject({
    present: true,
    displayed: true,
    hidden: false,
  });
  expect(diagrams[5]).toMatchObject({
    svgs: 1,
    shown: true,
    leftOver: false,
  });
});

test('diagrams are rendered once Reveal has laid the slides out', async ({
  page,
}) => {
  await openPresentation(page, {
    slides: [[WRAPPING_FLOWCHART], [GANTT]],
    lateReveal: true,
  });
  await page.waitForTimeout(100);
  expect(
    await page.evaluate(
      () => (window as ExportWindow).__crossnoteMermaidExport?.status,
    ),
  ).toBe('pending');
  expect(await page.locator('div.mermaid svg').count()).toBe(0);

  await waitForExport(page, 'complete');
  const { diagrams } = await readPage(page);
  expect(diagrams[0].labels).toEqual(['break-spaces', 'nowrap']);
  // Laid out to its slide, not to the wider window Reveal had not scaled yet.
  expect(diagrams[1].viewBox).toBe('0 0 880 148');
});

for (const { when, ready } of [
  { when: 'is ready by then', ready: true },
  { when: 'becomes ready as the export script listens for it', ready: false },
]) {
  test(`the diagrams of a presentation are rendered where Reveal ${when}`, async ({
    page,
  }) => {
    // Reveal is stood in for. Ready, it does not say so again: an export
    // script that only listened for it would wait for what never comes.
    await page.addInitScript((ready) => {
      Object.assign(window, {
        Reveal: {
          isReady: () => ready,
          addEventListener(name: string, listener: (event: object) => void) {
            if (name === 'ready' && !ready) {
              listener({ currentSlide: document.body, indexh: 0, indexv: 0 });
            }
          },
          layout() {},
        },
      });
    }, ready);
    await openExport(
      page,
      'https://crossnote.test/presentation.html',
      `<!doctype html><html><body>
        ${presentationBody([
          [
            'graph TD\nA[Start] --> B[Finish]',
            'classDiagram\nController --> Service',
            'sequenceDiagram\nClient->>Server: Request\nServer-->>Client: Response',
          ],
        ])}
        ${mermaidScripts({})}
      </body></html>`,
    );
    await waitForExport(page, 'complete');
    const rendered = await page
      .locator('div.mermaid > svg')
      .evaluateAll((nodes) =>
        nodes.map((node) => ({
          viewBox: node.getAttribute('viewBox'),
          text: node.textContent,
        })),
      );
    expect(rendered.map((diagram) => !!diagram.viewBox)).toEqual([
      true,
      true,
      true,
    ]);
    expect(rendered[1].text).toContain('Service');
    expect(rendered[2].text).toContain('Response');
  });
}

test('without a top layer, diagrams are rendered where they are', async ({
  page,
}) => {
  await openPresentation(page, {
    slides: [[WRAPPING_FLOWCHART], [GANTT], [], [], [WRAPPING_FLOWCHART]],
    noTopLayer: true,
  });
  await waitForExport(page, 'complete');
  const { diagrams, slides } = await readPage(page);

  expect(
    diagrams.map((diagram) => [
      diagram.inSlides,
      diagram.svgs,
      diagram.leftOver,
    ]),
  ).toEqual([
    [true, 1, false],
    [true, 1, false],
    [true, 1, false],
  ]);
  // As wide as their slides, on the slides reveal.js displays and on the
  // others alike; the scale reaches their labels, as before.
  expect(diagrams[1].viewBox).toBe('0 0 880 148');
  expect(diagrams.map((diagram) => diagram.labels)).toEqual([
    ['nowrap', 'nowrap'],
    [],
    ['nowrap', 'nowrap'],
  ]);
  expect(slides.map((slide) => slide.displayed)).toEqual([
    true,
    true,
    true,
    false,
    false,
  ]);
  expect(slides.some((slide) => slide.hidden)).toBe(false);
});

test('diagrams keep their ids apart where the ids of Mermaid are deterministic', async ({
  page,
}) => {
  // Mermaid gives the diagrams of one rendering ids that differ. Rendered one
  // by one, they would all get the first id, and each would take the place of
  // the one before it.
  await openPresentation(page, {
    slides: [[WRAPPING_FLOWCHART], [GANTT], [WRAPPING_FLOWCHART]],
    mermaidConfig: {
      ...getDefaultNotebookConfig().mermaidConfig,
      deterministicIds: true,
    },
  });
  await waitForExport(page, 'complete');
  const { diagrams } = await readPage(page);
  expect(
    diagrams.map((diagram) => [diagram.svgs, diagram.viewBox !== null]),
  ).toEqual([
    [1, true],
    [1, true],
    [1, true],
  ]);
});

test('the export script, on the page twice, has nothing to add the second time', async ({
  page,
  context,
}) => {
  const options: PresentationOptions = {
    slides: [[WRAPPING_FLOWCHART], [GANTT], [], [], [WRAPPING_FLOWCHART]],
    twice: true,
  };
  // Counts the diagrams shown in the top layer.
  await page.addInitScript(() => {
    const counting = window as unknown as { __shownInTopLayer: number };
    counting.__shownInTopLayer = 0;
    const show = HTMLElement.prototype.showPopover;
    HTMLElement.prototype.showPopover = function (this: HTMLElement) {
      if (this.classList.contains('mermaid')) {
        counting.__shownInTopLayer += 1;
      }
      return show.call(this);
    };
  });
  await openPresentation(page, options);
  await waitForExport(page, 'complete');

  expect(
    await page.evaluate(() => (window as ExportWindow).__shownInTopLayer),
    'each diagram is shown for its rendering once',
  ).toBe(3);
  await expectLaidOutAsUnscaled(page, context, options);
  const { diagrams, slides } = await readPage(page);
  expect(diagrams.map((diagram) => diagram.leftOver)).toEqual([
    false,
    false,
    false,
  ]);
  expect(slides.map((slide) => slide.displayed)).toEqual([
    true,
    true,
    true,
    false,
    false,
  ]);
});

/**
 * What the print layout of reveal.js made of the deck: one slide in each
 * page, and how many pages high each page is (a page is 700px, the height of
 * a slide, and a slide taller than that has a page as many pages high).
 */
function readPrintLayout(page: Page) {
  return page.evaluate(() => {
    const reveal = (
      window as unknown as {
        Reveal: { isPrintView(): boolean; isReady(): boolean };
      }
    ).Reveal;
    const pageHeight = parseFloat(document.body.style.height) - 1;
    return {
      printView: reveal.isPrintView(),
      ready: reveal.isReady(),
      pages: [...document.querySelectorAll<HTMLElement>('.pdf-page')].map(
        (page) => ({
          slides: page.querySelectorAll('section').length,
          diagrams: page.querySelectorAll('div.mermaid svg').length,
          pagesHigh: Math.round(parseFloat(page.style.height) / pageHeight),
        }),
      ),
    };
  });
}

/** The page keeps count of what each Mermaid rendering found when it began. */
const COUNT_THE_SLIDES = `window.__drawing = []
const run = mermaid.run.bind(mermaid)
mermaid.run = async options => {
  window.__drawing.push({ pages: document.querySelectorAll('.pdf-page').length, started: Reveal.isReady() })
  return run(options)
}`;

/**
 * Open an exported presentation as a PDF export through Chrome opens it: in
 * the print view of reveal.js, in the order the export template has — reveal.js,
 * the presentation's script, the Mermaid script — with the real reveal.js.
 */
async function openPrintExport(
  page: Page,
  search: string,
  options: PresentationOptions,
) {
  // The window Chrome prints from is as small as this; a slide is 960px wide
  // on paper whatever the window is.
  await page.setViewportSize({ width: 800, height: 600 });
  await openExport(
    page,
    `https://crossnote.test/presentation.html${search}`,
    `<!doctype html><html><head>
      <link rel="stylesheet" href="https://crossnote.test/reveal/css/reveal.css">
      <style>.mermaid { margin: 0 40px }
      ${options.style ?? ''}</style>
      <script src="https://crossnote.test/reveal/js/reveal.js"></script>
    </head><body>
      ${presentationBody(options.slides, options.wrap, options.wrapStyle)}
      ${buildPresentationInitScript({ presentationConfig: options.presentationConfig ?? {}, hasMermaid: true })}
      ${mermaidScripts(options)}
    </body></html>`,
    false,
    options.mermaidUnavailable,
  );
  await page.waitForFunction(
    () => (window as ExportWindow).__crossnotePrintLayoutReady === true,
  );
}

for (const search of ['?print-pdf', '?view=print']) {
  test(`a PDF export is laid out around its Mermaid diagrams: they are drawn before Reveal starts, and every page is sized from its slide, at ${search} (#582)`, async ({
    page,
    context,
  }) => {
    // The gantt lays itself out to the width of its element: it shows that the
    // slides have the width of the presentation, not of the small window.
    const options: PresentationOptions = {
      slides: [[WRAPPING_FLOWCHART], [TALL_FLOWCHART], [GANTT]],
      afterMermaid: COUNT_THE_SLIDES,
    };
    await openPrintExport(page, search, options);
    await waitForExport(page, 'complete');

    // Each diagram was drawn while there was no page yet and Reveal was not
    // started: in a slide that was not being moved into a page.
    const drawing = await page.evaluate(
      () => (window as ExportWindow).__drawing,
    );
    expect(drawing).toHaveLength(3);
    expect(drawing).toEqual([
      { pages: 0, started: false },
      { pages: 0, started: false },
      { pages: 0, started: false },
    ]);

    // Every diagram is in a page of its own slide, drawn, and the page of the
    // tall slide is two pages high: reveal.js found the diagram in place.
    const layout = await readPrintLayout(page);
    expect([layout.printView, layout.ready]).toEqual([true, true]);
    expect(layout.pages).toEqual([
      { slides: 1, diagrams: 1, pagesHigh: 1 },
      { slides: 1, diagrams: 1, pagesHigh: 2 },
      { slides: 1, diagrams: 1, pagesHigh: 1 },
    ]);
    const { diagrams } = await readPage(page);
    expect(
      diagrams.map((diagram) => [
        diagram.inSlides,
        diagram.svgs,
        diagram.leftOver,
      ]),
    ).toEqual([
      [true, 1, false],
      [true, 1, false],
      [true, 1, false],
    ]);

    // A diagram is laid out as it is where no scale reaches it, and as wide
    // as its slide is on paper.
    await expectLaidOutAsUnscaled(page, context, options);
  });
}

test('a PDF export whose Mermaid bundle did not load still has its presentation started', async ({
  page,
}) => {
  // The script of the diagrams fails where it first uses Mermaid, before it
  // would have told the presentation that its diagrams are drawn. An exported
  // page that is opened in a browser has nobody to fail for: its presentation
  // is started all the same, around the diagrams as they were written.
  await openPrintExport(page, '?print-pdf', {
    slides: [[WRAPPING_FLOWCHART], ['<p>Two</p>']],
    mermaidUnavailable: true,
  });
  await waitForExport(page, 'error');

  const layout = await readPrintLayout(page);
  expect([layout.printView, layout.ready]).toEqual([true, true]);
  expect(layout.pages).toEqual([
    { slides: 1, diagrams: 0, pagesHigh: 1 },
    { slides: 1, diagrams: 0, pagesHigh: 1 },
  ]);
});

test('a PDF export without Mermaid diagrams is laid out by reveal.js at once, and says so', async ({
  page,
}) => {
  await page.setViewportSize({ width: 800, height: 600 });
  await openExport(
    page,
    'https://crossnote.test/presentation.html?print-pdf',
    `<!doctype html><html><head>
      <link rel="stylesheet" href="https://crossnote.test/reveal/css/reveal.css">
      <script src="https://crossnote.test/reveal/js/reveal.js"></script>
    </head><body>
      ${presentationBody([['<p>One</p>'], ['<p>Two</p>']])}
      ${buildPresentationInitScript({ presentationConfig: {}, hasMermaid: false })}
    </body></html>`,
  );
  await page.waitForFunction(
    () => (window as ExportWindow).__crossnotePrintLayoutReady === true,
  );

  const layout = await readPrintLayout(page);
  expect(layout.pages).toEqual([
    { slides: 1, diagrams: 0, pagesHigh: 1 },
    { slides: 1, diagrams: 0, pagesHigh: 1 },
  ]);
});

for (const { how, search, reveal, expected } of [
  {
    how: 'where nothing waits for them, though the address says print',
    search: '?print-pdf',
    reveal: '{ isReady: () => true, isPrintView: () => true }',
    expected: ['shown in the top layer', 'laid out again'],
  },
  {
    how: 'where what calls itself Reveal is not reveal.js',
    search: '?print-pdf',
    reveal: '{}',
    expected: [],
  },
]) {
  test(`a presentation's diagrams are drawn as they are on a page, ${how}`, async ({
    page,
  }) => {
    // Only the script that starts Reveal puts the diagrams of a PDF export
    // first (openPrintExport): it waits for them. Where nothing does, the
    // export script goes by the page as it finds it. Reveal is stood in for.
    await openExport(
      page,
      `https://crossnote.test/print.html${search}`,
      `<!doctype html><html><body>
        <div class="reveal"><div class="slides" style="transform: translate(-50%, -50%) scale(0.5)">
          <section>${diagramDivs([WRAPPING_FLOWCHART])}</section>
        </div></div>
        <script>
          Object.assign(window, { __forPresentation: [], Reveal: ${reveal} })
          Reveal.layout = () => window.__forPresentation.push('laid out again')
          const show = HTMLElement.prototype.showPopover
          HTMLElement.prototype.showPopover = function () {
            if (this.classList.contains('mermaid')) {
              window.__forPresentation.push('shown in the top layer')
            }
            return show.call(this)
          }
        </script>
        ${mermaidScripts({})}
      </body></html>`,
    );
    await waitForExport(page, 'complete');
    const { diagrams } = await readPage(page);

    expect(
      await page.evaluate(() => (window as ExportWindow).__forPresentation),
    ).toEqual(expected);
    expect(
      diagrams.map((diagram) => [
        diagram.inSlides,
        diagram.svgs,
        diagram.leftOver,
      ]),
    ).toEqual([[true, 1, false]]);
  });
}
