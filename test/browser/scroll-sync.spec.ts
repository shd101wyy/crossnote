import * as path from 'path';
import { expect, Page, test } from '@playwright/test';
import { escape } from 'html-escaper';
import { build } from 'esbuild';
import { startServer, TestServer } from './server';

/**
 * Scroll sync of the real preview container, in a document with a bar above
 * the preview and a padding, so that no position is taken for granted, and
 * with the preview zoomed by a CSS `zoom` on `<body>`, as its zoom buttons do.
 *
 * The zoom scales the preview. From Chromium 128 on, and in current Firefox
 * and Safari, it scales what `getBoundingClientRect()` reports too, so that a
 * rectangle is in the pixels the window scrolls in. Before, it did not: a
 * rectangle stayed in the pixels of the element. Such an engine is had in
 * the tests by making rectangles unzoomed again (`legacyRects`). Scroll sync
 * has to hold at every zoom, on both
 * (vscode-markdown-preview-enhanced#2455).
 */

const SOURCE_URI = 'file:///tmp/scroll-sync.md';
const PARAGRAPHS = 200;
const FILLER =
  'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ';
/** Paragraphs that read the same, so that only where they are in the document tells which one is meant. */
const REPEATED = [40, 65, 100];
/** Two blocks without text (images, diagrams) and a link to a heading come after this paragraph. */
const AFTER_IMAGES = 120;
/** A block hidden by a style comes after this paragraph. */
const AFTER_HIDDEN = 100;
/**
 * The heading the links go to comes before this paragraph. What follows it
 * has to fill more than a window at every zoom, whatever the font, for the
 * heading to reach the top of the window.
 */
const BEFORE_HEADING = 150;
/** A link back up to the heading comes after this paragraph. */
const AFTER_BACK_LINK = 185;
/** Blocks without a source line, after the last block with one. */
const TRAILING_BLOCKS = 5;
/** The ratio from the top of the editor that the extension sends for a line in the middle of it. */
const TOP_RATIO = 0.372;
/** What the preview leaves above a heading it scrolls up to. */
const HEADING_TOP_WHEN_SCROLLING_UP = 32;

const paragraph = (i: number) =>
  `${REPEATED.includes(i) ? 'Repeat after me.' : `Paragraph ${i}.`}${FILLER}${FILLER}${FILLER}`;

/**
 * A long document and its HTML, laid out as the engine lays it out: each
 * block starts at the source line its `data-source-line` (one-based) names.
 */
function createDocument() {
  const source: string[] = [];
  const html: string[] = [];
  const lineOf: Record<string, number> = {};
  /**
   * Add the block that the source line `markdown` starts, given as the
   * element the engine renders it to.
   */
  const add = (name: string, markdown: string, element: string) => {
    const line = source.length;
    lineOf[name] = line;
    source.push(...markdown.split('\n'), '');
    html.push(
      element.replace('>', ` data-line="0" data-source-line="${line + 1}">`),
    );
  };
  for (let i = 0; i < PARAGRAPHS; i++) {
    if (i === AFTER_HIDDEN) {
      add(
        'hidden block',
        '![](hidden.png)',
        '<div class="tall concealed"></div>',
      );
    }
    if (i === AFTER_IMAGES) {
      add('first image', '![](first.png)', '<div class="tall"></div>');
      add('second image', '![](second.png)', '<div class="tall"></div>');
      add(
        'link down',
        '[jump](#chapter)',
        '<p><a class="down" href="#chapter">jump</a></p>',
      );
    }
    if (i === BEFORE_HEADING) {
      add('heading', '## Chapter', '<h2 id="chapter">Chapter</h2>');
    }
    if (i === AFTER_BACK_LINK) {
      add(
        'link up',
        '[back](#chapter)',
        '<p><a class="up" href="#chapter">back</a></p>',
      );
    }
    add(`paragraph ${i}`, paragraph(i), `<p>${escape(paragraph(i))}</p>`);
  }
  // Content the source has no line for, and blank lines after the last block
  // and before the last line.
  const trailing = '<div class="tall"></div>'.repeat(TRAILING_BLOCKS);
  source.push('', '', '');
  lineOf['last block'] = source.length - 5;
  lineOf['after the last block'] = source.length - 2;
  lineOf['last line'] = source.length - 1;
  return {
    markdown: source.join('\n'),
    totalLineCount: source.length,
    html: html.join('\n') + trailing,
    /** How many blocks with a source line the document has. */
    blockCount: html.length,
    lineOf,
  };
}

interface HostMessage {
  command?: string;
  args?: unknown[];
}

/** What the page keeps for the tests. */
interface TestWindow {
  __hostMessages: HostMessage[];
  /** The pixels the window scrolls in per pixel of a rectangle. */
  rectScale(): number;
}

type PageWindow = Window & TestWindow;

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
 * Open the preview zoomed to `zoomLevel`, showing the document. Errors the
 * page throws are collected in `pageErrors`.
 *
 * With `legacyRects`, rectangles are unzoomed by the page, as an engine
 * before Chromium 128 reports them.
 */
async function openPreview(
  page: Page,
  pageErrors: string[],
  zoomLevel: number,
  legacyRects: boolean,
  {
    /**
     * The document is laid out while the preview is first rendered. It is
     * not in a frame that is hidden with `display: none` meanwhile, as a tab
     * of the crossnote server app and the wiki can be.
     */
    laidOutAtFirst = true,
    /** A selection in the preview tells the editor where it is. */
    clickToRevealSource = false,
  }: {
    laidOutAtFirst?: boolean;
    clickToRevealSource?: boolean;
  } = {},
) {
  const doc = createDocument();
  const config = {
    sourceUri: SOURCE_URI,
    cursorLine: 0,
    isVSCode: true,
    scrollSync: true,
    zoomLevel,
    enablePreviewContextMenu: false,
    clickToRevealSource,
  };
  await page.route(`${server.url}/scroll-sync.html`, (route) =>
    route.fulfill({
      contentType: 'text/html; charset=utf-8',
      body: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta id="crossnote-data" data-config="${escape(JSON.stringify(config))}">
    <style>
      html, body { margin: 0; padding: 0; }
      .hidden-preview { display: none; }
      .bar { height: 32px; }
      .markdown-preview { position: relative; box-sizing: border-box; max-width: 800px; margin: 0 auto; padding: 20px 40px; }
      p, h2 { line-height: 24px; margin: 0 0 20px; }
      .tall { height: 600px; }
      .concealed { display: none; }
    </style>
  </head>
  <body class="preview-container">
    <div class="bar"></div>
    <script src="${server.url}/webview/preview.js"></script>
  </body>
</html>`,
    }),
  );
  await page.route(`${server.url}/webview/preview.js`, (route) =>
    route.fulfill({ contentType: 'text/javascript', body: previewHarnessJs }),
  );
  await page.addInitScript((legacyRects) => {
    const hostWindow = window as unknown as PageWindow & {
      acquireVsCodeApi: () => {
        postMessage(message: unknown): void;
        getState(): unknown;
        setState(): undefined;
      };
    };
    hostWindow.__hostMessages = [];
    hostWindow.acquireVsCodeApi = () => ({
      postMessage: (message: unknown) => {
        hostWindow.__hostMessages.push(message as HostMessage);
      },
      getState: () => null,
      setState: () => undefined,
    });

    const elementRect = Element.prototype.getBoundingClientRect;
    const rangeRect = Range.prototype.getBoundingClientRect;
    /** Whether a CSS `zoom` scales what `getBoundingClientRect()` reports. */
    const zoomScalesRects = (() => {
      let found: boolean | undefined;
      return () => {
        if (found === undefined) {
          const plain = document.createElement('div');
          plain.style.cssText =
            'position:absolute;top:0;left:0;width:10px;height:10px;visibility:hidden';
          const zoomed = plain.cloneNode() as HTMLElement;
          zoomed.style.zoom = '2';
          document.body.append(plain, zoomed);
          // Nothing is measured where nothing is laid out.
          const plainWidth = elementRect.call(plain).width;
          if (plainWidth > 0) {
            found = elementRect.call(zoomed).width > plainWidth * 1.5;
          }
          plain.remove();
          zoomed.remove();
        }
        return found;
      };
    })();
    /** The zoom a node, or a range, is under: its own and that of its ancestors. */
    const zoomOf = (node: Node | Range): number => {
      let zoom = 1;
      const start = (node as Range).startContainer ?? node;
      for (
        let el =
          start.nodeType === 1 ? (start as Element) : start.parentElement;
        el;
        el = el.parentElement
      ) {
        zoom *= parseFloat((el as HTMLElement).style.zoom) || 1;
      }
      return zoom;
    };
    if (legacyRects) {
      // Such an engine has no `caretPositionFromPoint`.
      Object.defineProperty(document, 'caretPositionFromPoint', {
        value: undefined,
        configurable: true,
      });
      /** The rectangle as an engine before Chromium 128 reports it. */
      const unzoomed = (box: DOMRect, node: Node | Range): DOMRect => {
        if (!zoomScalesRects()) {
          return box;
        }
        const zoom = zoomOf(node);
        return zoom === 1
          ? box
          : new DOMRect(
              box.x / zoom,
              box.y / zoom,
              box.width / zoom,
              box.height / zoom,
            );
      };
      Element.prototype.getBoundingClientRect = function () {
        return unzoomed(elementRect.call(this), this);
      };
      Range.prototype.getBoundingClientRect = function () {
        return unzoomed(rangeRect.call(this), this);
      };
    }
    hostWindow.rectScale = () =>
      legacyRects || !zoomScalesRects()
        ? parseFloat(document.body.style.zoom) || 1
        : 1;
  }, legacyRects);
  page.on('pageerror', (error) => pageErrors.push(String(error)));
  await page.goto(`${server.url}/scroll-sync.html`);
  if (!laidOutAtFirst) {
    await page.evaluate(() => {
      document.documentElement.style.display = 'none';
    });
  }
  await renderDocument(page, doc);
  // The class is set once the first rendering is through.
  await expect
    .poll(() =>
      page
        .locator(
          '.markdown-preview:not(.hidden-preview).rendered [data-source-line]',
        )
        .count(),
    )
    .toBe(doc.blockCount);
  const lineOf: Record<string, number> = {
    ...doc.lineOf,
    total: doc.totalLineCount,
  };
  return lineOf;
}

/** Send `doc` to the preview as the extension does after an edit. */
function renderDocument(page: Page, doc: ReturnType<typeof createDocument>) {
  return postToPreview(page, {
    command: 'updateHtml',
    html: doc.html,
    id: '',
    class: 'rendered',
    totalLineCount: doc.totalLineCount,
    tocHTML: '',
    sourceUri: SOURCE_URI,
    sourceScheme: 'file',
    markdown: doc.markdown,
  });
}

function clickInPreview(page: Page, selector: string) {
  return page.evaluate(
    (selector) =>
      (
        document.querySelector(`.markdown-preview ${selector}`) as HTMLElement
      ).click(),
    selector,
  );
}

function postToPreview(page: Page, message: object) {
  return page.evaluate((message) => {
    window.postMessage(message, '*');
  }, message);
}

/**
 * Scroll as the extension has the preview when the editor cursor moves to
 * `line`: to the text at its column when the column is known, else to the
 * block the line starts.
 */
function syncToLine(page: Page, line: number, column?: number) {
  return postToPreview(page, {
    command: 'changeTextEditorSelection',
    line,
    ...(column === undefined ? {} : { character: column }),
    topRatio: TOP_RATIO,
  });
}

/** Where the blocks at the source lines are, in the pixels the window scrolls in. */
async function blockTops(
  page: Page,
  lines: number[],
): Promise<Array<{ block: number; text: number; height: number }>> {
  return page.evaluate((lines) => {
    const scale = (window as unknown as PageWindow).rectScale();
    return lines.map((line) => {
      const block = document.querySelector(
        `.markdown-preview:not(.hidden-preview) [data-source-line="${line + 1}"]`,
      ) as HTMLElement;
      const rect = block.getBoundingClientRect();
      const firstText = document
        .createTreeWalker(block, NodeFilter.SHOW_TEXT)
        .nextNode() as Text;
      const range = document.createRange();
      range.setStart(firstText, 0);
      range.setEnd(firstText, 1);
      const textRect = range.getBoundingClientRect();
      return {
        block: rect.top * scale,
        text: (textRect.top + textRect.height / 2) * scale,
        height: rect.height * scale,
      };
    });
  }, lines);
}

/**
 * Where a scroll to the source line `line` has put that line in the window,
 * from the top of the block at `line`: `TOP_RATIO` of the window when it is
 * the block itself.
 */
async function whereTheLineWasPut(
  page: Page,
  line: number,
  height: number,
): Promise<number> {
  const [{ block }] = await blockTops(page, [line]);
  return TOP_RATIO * height - block;
}

/** Document y of the top of the block at source `line`. */
function blockDocumentTop(page: Page, line: number): Promise<number> {
  return blockTops(page, [line]).then(([{ block }]) =>
    page.evaluate((block) => block + document.documentElement.scrollTop, block),
  );
}

/** Document y of the end of the document. */
function documentEnd(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollHeight);
}

/** How far the window is from the end of the document. */
function distanceToEnd(page: Page): Promise<number> {
  return page.evaluate(
    () =>
      document.documentElement.scrollHeight -
      document.documentElement.scrollTop -
      window.innerHeight,
  );
}

/**
 * The arguments of the message the preview has most recently posted by
 * `command`, when it has posted one.
 */
function revealedArgs(
  page: Page,
  command: string,
): Promise<unknown[] | undefined> {
  return page.evaluate((command) => {
    const messages = (window as unknown as PageWindow).__hostMessages;
    return messages
      .filter((message) => message.command === command)
      .map((message) => message.args ?? [])
      .pop();
  }, command);
}

function windowHeight(page: Page): Promise<number> {
  return page.evaluate(() => window.innerHeight);
}

/** The zoom of the preview, as its element has it. */
function previewZoom(page: Page): Promise<number> {
  return page.evaluate(() => parseFloat(document.body.style.zoom));
}

/**
 * Scroll as the extension has the preview scroll to the editor position
 * `line`, and expect the block at `line`, or its first character, to sit
 * `TOP_RATIO` of the way down the window.
 */
async function expectLineAtRatio(
  page: Page,
  line: number,
  by: 'block' | 'text',
  height: number,
  message: string,
) {
  await syncToLine(page, line, by === 'text' ? 0 : undefined);
  // Within a pixel: the scroll map is kept in whole pixels.
  await expect
    .poll(
      async () =>
        Math.abs((await blockTops(page, [line]))[0][by] - TOP_RATIO * height),
      { message },
    )
    .toBeLessThan(1);
}

/**
 * Scroll the window so that the block at source `line` is `y` from the top
 * of the window, and wait until it stays there: the preview may still be
 * scrolling the window to a position of its own.
 */
function putBlockAt(page: Page, line: number, y: number) {
  return page.evaluate(
    ({ line, y }) =>
      new Promise<void>((resolve) => {
        const scale = (window as unknown as PageWindow).rectScale();
        const block = document.querySelector(
          `.markdown-preview:not(.hidden-preview) [data-source-line="${line + 1}"]`,
        ) as HTMLElement;
        const top = () => block.getBoundingClientRect().top * scale;
        const put = () => {
          document.documentElement.scrollTop += top() - y;
        };
        put();
        let stillFrames = 0;
        const check = () => {
          // Within a pixel: the window scrolls in whole ones.
          if (Math.abs(top() - y) > 1) {
            stillFrames = 0;
            put();
          } else if (++stillFrames === 10) {
            return resolve();
          }
          // The preview ignores the scrolls made while it animates one of
          // its own: each frame scrolls by nothing, for an event of its own
          // once that is over.
          const at = document.documentElement.scrollTop;
          document.documentElement.scrollTop = at - 1;
          document.documentElement.scrollTop = at;
          requestAnimationFrame(check);
        };
        requestAnimationFrame(check);
      }),
    { line, y },
  );
}

for (const legacyRects of [false, true]) {
  // At a zoom of 1 the two kinds of engine agree.
  const zooms = legacyRects ? [1.5, 0.5] : [1, 1.5, 0.5];
  const engine = legacyRects ? ', rectangles as before Chromium 128' : '';

  for (const zoomLevel of zooms) {
    test(`the editor position scrolls the preview to its line at zoom ${zoomLevel}${engine}`, async ({
      page,
    }) => {
      const pageErrors: string[] = [];
      const lineOf = await openPreview(
        page,
        pageErrors,
        zoomLevel,
        legacyRects,
      );
      const height = await windowHeight(page);
      // Far down the document, then back up near its top.
      for (const name of ['paragraph 100', 'paragraph 20']) {
        const line = lineOf[name];

        // From elsewhere in the document, to the block the line starts.
        await putBlockAt(page, lineOf['paragraph 150'], height / 2);
        await expectLineAtRatio(
          page,
          line,
          'block',
          height,
          `${name} at zoom ${zoomLevel}, by its block`,
        );

        // With the column, to the text itself.
        await putBlockAt(page, lineOf['paragraph 150'], height / 2);
        await expectLineAtRatio(
          page,
          line,
          'text',
          height,
          `${name} at zoom ${zoomLevel}, by its text`,
        );
      }

      // A block hidden by a style has no position of its own: its line is
      // put between the blocks around it, wherever the window was when the
      // scroll map was built.
      await putBlockAt(page, lineOf['paragraph 150'], height / 2);
      await page.evaluate(() => window.dispatchEvent(new Event('resize')));
      await syncToLine(page, lineOf['hidden block']);
      await expect
        .poll(
          async () => {
            const [before, after] = await blockTops(page, [
              lineOf['paragraph 99'],
              lineOf['paragraph 100'],
            ]);
            const put = await whereTheLineWasPut(
              page,
              lineOf['paragraph 99'],
              height,
            );
            return put > 0 && put < after.block - before.block;
          },
          { message: `the hidden block at zoom ${zoomLevel}` },
        )
        .toBe(true);

      // A line after the last block, but not the last one, is put between
      // the block and the bottom of the preview, at its share of the way.
      await syncToLine(page, lineOf['after the last block']);
      const [lastBlock, lastLine, total] = [
        lineOf['last block'],
        lineOf['last line'],
        lineOf.total,
      ];
      await expect
        .poll(
          async () => {
            const [top, end] = await Promise.all([
              blockDocumentTop(page, lastBlock),
              documentEnd(page),
            ]);
            const share =
              ((end - top) * (lastLine - 1 - lastBlock)) / (total - lastBlock);
            return Math.abs(
              (await whereTheLineWasPut(page, lastBlock, height)) - share,
            );
          },
          { message: `the lines after the last block at zoom ${zoomLevel}` },
        )
        .toBeLessThan(1);

      // The last line scrolls to the end of the document.
      await syncToLine(page, lineOf['last line']);
      await expect
        .poll(() => distanceToEnd(page), {
          message: `the last line at zoom ${zoomLevel}`,
        })
        .toBeLessThan(1);

      expect(pageErrors).toEqual([]);
    });

    test(`the preview scroll reveals the line in view at zoom ${zoomLevel}${engine}`, async ({
      page,
    }) => {
      const pageErrors: string[] = [];
      const lineOf = await openPreview(
        page,
        pageErrors,
        zoomLevel,
        legacyRects,
        {
          clickToRevealSource: true,
        },
      );
      const height = await windowHeight(page);
      // Either end of the repeated paragraphs: the one in view is the one
      // revealed, not the one nearer to where the scroll map is off to.
      for (const name of ['paragraph 40', 'paragraph 100']) {
        await putBlockAt(page, lineOf[name], height / 2);
        await expect
          .poll(
            async () => (await revealedArgs(page, 'revealSourcePosition'))?.[1],
            { message: `${name} at zoom ${zoomLevel}` },
          )
          .toBe(lineOf[name]);
        // The text found is where the editor is told it is: at the middle
        // of the window, a little below it in the first line of the
        // paragraph.
        expect(
          (await revealedArgs(page, 'revealSourcePosition'))?.[3],
          `${name} at zoom ${zoomLevel}, its place in the window`,
        ).toBeCloseTo(
          (await blockTops(page, [lineOf[name]]))[0].text / height,
          5,
        );
      }

      // No text near the middle of the window: the line of the block there.
      await putBlockAt(page, lineOf['second image'], height / 2);
      await expect
        .poll(async () => (await revealedArgs(page, 'revealLine'))?.[1], {
          message: `the text-less block at zoom ${zoomLevel}`,
        })
        .toBe(lineOf['second image']);

      // A selection in the preview tells the editor where it is, in the
      // pixels of the window too.
      const line = lineOf['paragraph 40'];
      await putBlockAt(page, line, height / 2);
      await page.evaluate((line) => {
        const block = document.querySelector(
          `.markdown-preview:not(.hidden-preview) [data-source-line="${line + 1}"]`,
        ) as HTMLElement;
        const first = document
          .createTreeWalker(block, NodeFilter.SHOW_TEXT)
          .nextNode() as Text;
        const range = document.createRange();
        range.setStart(first, 0);
        range.setEnd(first, 5);
        const selection = window.getSelection() as Selection;
        selection.removeAllRanges();
        selection.addRange(range);
      }, line);
      await expect
        .poll(
          async () =>
            Math.abs(
              Number((await revealedArgs(page, 'selectSourceRange'))?.[5]) -
                (await blockTops(page, [line]))[0].text / height,
            ),
          {
            message: `the selection at zoom ${zoomLevel}, its place in the window`,
          },
        )
        .toBeLessThan(2 / height);

      // A link to a heading further down brings the heading to the top.
      await clickInPreview(page, 'a.down');
      await expect
        .poll(
          async () =>
            Math.abs((await blockTops(page, [lineOf['heading']]))[0].block),
          { message: `the link down at zoom ${zoomLevel}` },
        )
        .toBeLessThan(1);

      // A link back up to the heading brings it a little below the top,
      // with its whole height: the window was below it.
      await putBlockAt(page, lineOf['link up'], 100);
      await clickInPreview(page, 'a.up');
      await expect
        .poll(
          async () => {
            const [heading] = await blockTops(page, [lineOf['heading']]);
            return Math.abs(
              heading.block - heading.height - HEADING_TOP_WHEN_SCROLLING_UP,
            );
          },
          { message: `the link up at zoom ${zoomLevel}` },
        )
        .toBeLessThan(1);

      expect(pageErrors).toEqual([]);
    });
  }

  test(`the preview is in sync after it first rendered where nothing is laid out${engine}`, async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    const lineOf = await openPreview(page, pageErrors, 1.5, legacyRects, {
      laidOutAtFirst: false,
    });
    const height = await windowHeight(page);
    await page.evaluate(() => {
      document.documentElement.style.display = '';
    });
    // The preview is rendered again, as after an edit: the block of the
    // rendering in place is marked, to know when it is gone.
    await page.evaluate(() => {
      const block = document.querySelector(
        '.markdown-preview:not(.hidden-preview) [data-source-line]',
      ) as HTMLElement;
      block.dataset.firstRendering = '';
    });
    await renderDocument(page, createDocument());
    await expect
      .poll(
        () =>
          page
            .locator(
              '.markdown-preview:not(.hidden-preview) [data-first-rendering]',
            )
            .count(),
        { message: 'the preview is rendered again' },
      )
      .toBe(0);

    await putBlockAt(page, lineOf['paragraph 150'], height / 2);
    await expectLineAtRatio(
      page,
      lineOf['paragraph 100'],
      'block',
      height,
      'paragraph 100 after the preview was first rendered unseen',
    );
    await putBlockAt(page, lineOf['link up'], 100);
    await clickInPreview(page, 'a.up');
    await expect
      .poll(
        async () => {
          const [heading] = await blockTops(page, [lineOf['heading']]);
          return Math.abs(
            heading.block - heading.height - HEADING_TOP_WHEN_SCROLLING_UP,
          );
        },
        { message: 'the link up after the preview was first rendered unseen' },
      )
      .toBeLessThan(1);

    expect(pageErrors).toEqual([]);
  });

  test(`the preview keeps in sync after its zoom changes${engine}`, async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    const lineOf = await openPreview(page, pageErrors, 1, legacyRects);
    const height = await windowHeight(page);
    // The preview throws its scroll map away 2s after the first rendering,
    // as images may have loaded since. That has to be over: it would throw
    // away a map that a zoom should have.
    await expect
      .poll(() => page.evaluate(() => performance.now() > 2100))
      .toBe(true);
    // A different editor position at each zoom: the preview does not scroll
    // again to the position it has already synced to.
    const positions: Array<[number, string, string]> = [
      [1.5, 'paragraph 100', 'paragraph 20'],
      [0.5, 'paragraph 110', 'paragraph 30'],
      [1, 'paragraph 120', 'paragraph 10'],
    ];
    for (const [zoomLevel, far, near] of positions) {
      const zoom = await previewZoom(page);
      const command =
        zoomLevel === 1 ? 'resetZoom' : zoomLevel > zoom ? 'zoomIn' : 'zoomOut';
      for (let i = 0; i < Math.round(Math.abs(zoomLevel - zoom) * 10); i++) {
        await postToPreview(page, { command });
      }
      await expect
        .poll(async () => Math.abs((await previewZoom(page)) - zoomLevel), {
          message: `zoomed to ${zoomLevel}`,
        })
        .toBeLessThan(1e-6);

      await putBlockAt(page, lineOf['paragraph 150'], height / 2);
      await expectLineAtRatio(
        page,
        lineOf[far],
        'block',
        height,
        `${far} after zooming to ${zoomLevel}, by its block`,
      );
      await putBlockAt(page, lineOf['paragraph 150'], height / 2);
      await expectLineAtRatio(
        page,
        lineOf[near],
        'text',
        height,
        `${near} after zooming to ${zoomLevel}, by its text`,
      );
    }

    expect(pageErrors).toEqual([]);
  });
}
