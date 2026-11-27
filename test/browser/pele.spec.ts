import { expect, Page, test } from '@playwright/test';
import { build } from 'esbuild';
import { escape } from 'html-escaper';
import * as fs from 'fs';
import * as path from 'path';
import type { PeleRenderer } from '../../src/lib/pele';
import { evaluatePeleBundle } from '../../src/lib/pele-bundle';
import { buildPeleExportScript } from '../../src/markdown-engine/pele-export';
import { PELE_DIAGRAMS, PELE_INVALID } from '../fixtures/pele-diagrams';
import { startServer, TestServer } from './server';

/**
 * Pele diagrams in a real Chromium, drawn by the vendored bundle
 * (`dependencies/pele/pele.global.js`): through the preview's helper
 * (`src/webview/lib/pele.ts`) and the real preview container, and through the
 * script of an exported document (`src/markdown-engine/pele-export.ts`).
 *
 * The engine itself is not imported here — Playwright's TypeScript loader
 * cannot load `src/utility.ts` — so pages are written by hand in the shape of
 * the engine's templates, and the stylesheet is compiled from its source: the
 * browser-test job has no build output to read.
 */

type PeleHelper = typeof import('../../src/webview/lib/pele');

interface RevealApi {
  isReady(): boolean;
  getIndices(): { h: number; v: number };
  getCurrentSlide(): HTMLElement;
}

interface HostMessage {
  command?: string;
}

type PeleWindow = Window & {
  pele: PeleRenderer;
  crossnotePele?: PeleHelper;
  Reveal: RevealApi;
  __crossnotePeleExport?: { status: string; message?: string };
  __hostMessages: HostMessage[];
};

/** What a label is painted with on a light page, and on a dark one. */
const LIGHT_LABEL = 'rgb(31, 31, 31)';
const DARK_LABEL = 'rgb(206, 205, 195)';
/** What a node is filled with on a light page, and on a dark one. */
const LIGHT_NODE = 'rgb(243, 243, 243)';
const DARK_NODE = 'rgb(28, 27, 26)';
const FLOWCHART = PELE_DIAGRAMS.find(
  (diagram) => diagram.name === 'flowchart',
)!;
const SEQUENCE = PELE_DIAGRAMS.find((diagram) => diagram.name === 'sequence')!;
const JOURNEY = PELE_DIAGRAMS.find(
  (diagram) => diagram.name === 'user journey',
)!;
const SOURCES = PELE_DIAGRAMS.map((diagram) => diagram.source);

const PREVIEW_CONFIG = {
  sourceUri: 'file:///tmp/pele.md',
  isVSCode: true,
  enablePreviewContextMenu: false,
};

let server: TestServer;
/** `src/webview/lib/pele.ts` for the page, as `window.crossnotePele`. */
let helperJs: string;
/** The real preview container (`preview-container-harness.tsx`). */
let previewHarnessJs: string;
/** `styles/style-template.less`, compiled. */
let stylesheet: string;

/** Bundle one of the sources, by its path from the root of the repository, for the page. */
async function bundled(entry: string, globalName?: string): Promise<string> {
  const { outputFiles } = await build({
    entryPoints: [path.resolve(__dirname, '../..', entry)],
    bundle: true,
    format: 'iife',
    platform: 'browser',
    globalName,
    write: false,
  });
  return outputFiles[0].text;
}

/**
 * `styles/style-template.less`, compiled.
 *
 * How `less` is imported depends on the loader: under Playwright's its
 * functions sit behind the default export. `typeof import('less')` is what
 * the sources see.
 */
async function compileStylesheet(): Promise<{ css: string }> {
  const imported = await import('less');
  const less = ((imported as unknown as { default?: typeof imported })
    .default ?? imported) as typeof imported;
  return less.render(
    fs.readFileSync(
      path.resolve(__dirname, '../../styles/style-template.less'),
      'utf8',
    ),
  );
}

test.beforeAll(async () => {
  server = await startServer();
  helperJs = await bundled('src/webview/lib/pele.ts', 'crossnotePele');
  previewHarnessJs = await bundled(
    'test/browser/preview-container-harness.tsx',
  );
  stylesheet = (await compileStylesheet()).css;
});

test.afterAll(async () => {
  await server?.close();
});

/** The `div.pele` elements of these diagrams, as the engine writes them. */
function blocksOf(sources: string[]): string {
  return sources
    .map((source) => `<div class="pele">${escape(source)}</div>`)
    .join('\n');
}

/** Uncaught errors of the page. */
function errorsOf(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  return errors;
}

/** A blank page with the vendored pele and the preview's helper on it. */
async function openWithPele(page: Page): Promise<void> {
  await page.goto(server.url);
  await page.addScriptTag({ url: `${server.url}/pele/pele.global.js` });
  await page.addScriptTag({ content: helperJs });
}

let containers = 0;

/**
 * Put `html` in a container of the page and draw its pele diagrams the way
 * `drawer` does: `'preview'` through the preview's helper, `'export'` through
 * the script of an exported document. Returns what selects the container.
 */
async function drawIn(
  page: Page,
  html: string,
  drawer: 'preview' | 'export',
): Promise<string> {
  const id = String(++containers);
  await page.evaluate(
    ({ id, html, drawer, script }) => {
      const container = document.createElement('div');
      container.className = 'crossnote markdown-preview';
      container.setAttribute('data-drawn', id);
      container.innerHTML = html;
      document.body.appendChild(container);
      if (drawer === 'preview') {
        (window as unknown as PeleWindow).crossnotePele!.renderPeleDiagrams(
          container,
        );
      } else {
        new Function(script)();
      }
    },
    { id, html, drawer, script: buildPeleExportScript() },
  );
  return `[data-drawn="${id}"]`;
}

interface Shape {
  tags: string[];
  attributes: string[];
}

/** What each diagram in the container selected by `selector` came to. */
function readShapes(page: Page, selector: string): Promise<Shape[]> {
  return page.evaluate((selector) => {
    // An id carries a counter that differs between the two drawings.
    const comparable = (value: string) => value.replace(/pele-\d+-/g, 'pele-');
    // The outline of a path is left out: cynefin derives its wavy borders from
    // the id of its diagram, which differs between the two drawings. Where the
    // path is, and how large, is in its other attributes.
    const outline = new Set(['d']);
    return Array.from(
      document.querySelector(selector)!.querySelectorAll('div.pele'),
    ).map((node) => ({
      tags: Array.from(node.querySelectorAll('*')).map(
        (element) => element.localName,
      ),
      attributes: Array.from(node.querySelectorAll('*'))
        .flatMap((element) => [
          ...Array.from(element.attributes)
            .filter(
              (attribute) => !['xmlns', 'target'].includes(attribute.name),
            )
            .map((attribute) =>
              outline.has(attribute.name)
                ? `${element.localName}.${attribute.name}`
                : `${element.localName}.${attribute.name}=${comparable(attribute.value)}`,
            ),
          ...(element.localName === 'text'
            ? [`text=${element.textContent}`]
            : []),
        ])
        .sort(),
    }));
  }, selector);
}

/** The scheme the page is marked with, and what a diagram is painted with. */
function readColors(page: Page, root: string = 'body') {
  return page.evaluate((root) => {
    // A node of the first diagram: the rect pele fills with its surface
    // color, by the variable it names rather than by the color that comes
    // out. Others — an actor of a flowchart — take the page's own color.
    const label = document.querySelector<SVGElement>(
      `${root} svg.pele text.pele-label`,
    );
    const node = document.querySelector<SVGElement>(
      `${root} svg.pele rect[fill="var(--_s)"]`,
    );
    return {
      scheme: document.body.getAttribute('data-preview-theme'),
      label: label ? getComputedStyle(label).fill : '',
      node: node ? getComputedStyle(node).fill : '',
    };
  }, root);
}

/** Stand in for the extension, which the preview talks to through its API. */
async function stubHost(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const globals = window as unknown as PeleWindow & {
      acquireVsCodeApi?: () => unknown;
    };
    globals.__hostMessages = [];
    globals.acquireVsCodeApi = () => ({
      postMessage: (message: HostMessage) =>
        globals.__hostMessages.push(message),
      getState: () => null,
      setState: () => undefined,
    });
  });
}

/**
 * The document the engine's template lays out for the preview
 * (`generateHTMLTemplateForPreview`), with the preview container in place of
 * the webview bundle: what the preview draws with — Mermaid configured, then
 * pele — comes first, and the bundle last. A presentation also has Reveal and
 * the function that starts it.
 */
function previewDocument(
  config: object,
  body: string,
  {
    presentation = false,
    head = '',
  }: { presentation?: boolean; head?: string } = {},
): string {
  return `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta id="crossnote-data" data-config="${escape(JSON.stringify(config))}">
        ${head}
      </head>
      ${body}
      <script src="${server.url}/mermaid/mermaid.min.js"></script>
      <script>
        mermaid.initialize({ startOnLoad: false, cloneCssStyles: false, theme: 'default' })
      </script>
      <script src="${server.url}/pele/pele.global.js"></script>
      ${
        presentation
          ? `<script src="${server.url}/reveal/js/reveal.js"></script>
      <script>
        window.initRevealPresentation = async function () {
          await Reveal.initialize({ margin: 0.1 })
          await new Promise((resolve) => setTimeout(resolve, 200))
        }
      </script>`
          : ''
      }
      <script src="${server.url}/webview/preview.js"></script>
    </html>`;
}

/** The page of a preview, as the engine's template serves it. */
async function openPreview(page: Page, document: string): Promise<void> {
  await page.route(`${server.url}/preview.html`, (route) =>
    route.fulfill({
      contentType: 'text/html; charset=utf-8',
      body: document,
    }),
  );
  await page.route(`${server.url}/webview/preview.js`, (route) =>
    route.fulfill({ contentType: 'text/javascript', body: previewHarnessJs }),
  );
  await page.goto(`${server.url}/preview.html`);
}

/**
 * Wait until the preview of a note has loaded and told the host so. The host
 * answers with the first page (`updateHtml`). A presentation does not report:
 * its deck is waited for instead.
 */
async function waitForPreview(page: Page): Promise<void> {
  await page.waitForFunction(() =>
    (window as unknown as PeleWindow).__hostMessages.some(
      (message) => message.command === 'webviewFinishLoading',
    ),
  );
}

/** Send the preview the rendered page of a note, as the host does. */
function updatePreview(page: Page, html: string): Promise<void> {
  return page.evaluate((payload) => window.postMessage(payload, '*'), {
    command: 'updateHtml',
    html,
    id: '',
    class: '',
    totalLineCount: 20,
    tocHTML: '',
    sourceUri: PREVIEW_CONFIG.sourceUri,
    sourceScheme: 'file',
    markdown: '',
  });
}

interface Deck {
  current: number;
  /** For each slide: whether its diagram is in. */
  rendered: boolean[];
  /**
   * By how much the top of the current slide is off the one Reveal gives a
   * slide of the content it holds now. Reveal centers a slide from the height
   * of its content, so a diagram that arrived after the layout leaves it
   * off center.
   */
  offCenter: number;
}

function readDeck(page: Page): Promise<Deck> {
  return page.evaluate(() => {
    const { Reveal } = window as unknown as PeleWindow;
    const slides = Array.from(
      document.querySelectorAll<HTMLElement>('.slides > section'),
    );
    const slide = Reveal.getCurrentSlide();
    const slideHeight =
      document.querySelector<HTMLElement>('.slides')!.clientHeight;
    const centered = Math.max((slideHeight - slide.scrollHeight) / 2, 0);
    return {
      current: Reveal.getIndices().h,
      rendered: slides.map((s) => !!s.querySelector('div.pele > svg.pele')),
      offCenter: Math.abs(parseFloat(slide.style.top) - centered),
    };
  });
}

/** Wait until the deck is ready and shown. */
async function waitForDeck(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const { Reveal } = window as unknown as PeleWindow;
    const first = document.querySelector<HTMLElement>('.slides > section');
    return Reveal.isReady() && first?.style.visibility === 'visible';
  });
}

test('the preview draws every kind of diagram pele documents', async ({
  page,
}) => {
  const errors = errorsOf(page);
  await openWithPele(page);
  const selector = await drawIn(page, blocksOf(SOURCES), 'preview');

  const drawn = await page.evaluate((selector) => {
    return Array.from(
      document
        .querySelector(selector)!
        .querySelectorAll<HTMLElement>('div.pele'),
    ).map((node) => {
      const svg = node.querySelector<SVGSVGElement>('svg.pele');
      const box = svg?.getBoundingClientRect();
      return {
        type: svg?.getAttribute('aria-roledescription') ?? '',
        width: box?.width ?? 0,
        height: box?.height ?? 0,
        ids: Array.from(node.querySelectorAll('[id]')).map((el) => el.id),
      };
    });
  }, selector);

  // Each is drawn as the kind of diagram it is, and takes room on the page.
  expect(drawn.map((diagram) => diagram.type)).toEqual(
    PELE_DIAGRAMS.map((diagram) => diagram.type),
  );
  for (const diagram of drawn) {
    expect(diagram.width, diagram.type).toBeGreaterThan(20);
    expect(diagram.height, diagram.type).toBeGreaterThan(10);
  }
  // Each diagram has its own ids: no two share one.
  const ids = drawn.flatMap((diagram) => diagram.ids);
  expect(new Set(ids).size).toBe(ids.length);
  expect(errors).toEqual([]);
});

test('an exported document draws what the preview draws', async ({ page }) => {
  const errors = errorsOf(page);
  await openWithPele(page);
  const html = blocksOf([...SOURCES, PELE_INVALID]);
  const inPreview = await drawIn(page, html, 'preview');
  const inExport = await drawIn(page, html, 'export');

  expect(
    await page.evaluate(
      () => (window as unknown as PeleWindow).__crossnotePeleExport,
    ),
  ).toEqual({ status: 'complete' });
  const shapes = {
    preview: await readShapes(page, inPreview),
    export: await readShapes(page, inExport),
  };
  expect(shapes.preview).toHaveLength(SOURCES.length + 1);
  // The one that could not be drawn shows its error in both.
  expect(shapes.preview[SOURCES.length].tags).toEqual(['pre', 'code']);
  expect(shapes.export).toEqual(shapes.preview);
  expect(errors).toEqual([]);
});

test('the Node side draws what the browser draws', async ({ page }) => {
  const errors = errorsOf(page);
  await page.goto(server.url);
  await page.addScriptTag({ url: `${server.url}/pele/pele.global.js` });
  const inBrowser = await page.evaluate(
    (sources) =>
      sources.map(
        (source) => (window as unknown as PeleWindow).pele.render(source).svg,
      ),
    SOURCES,
  );
  // The renderer the pandoc and markdown exports go through
  // (`src/renderers/pele.ts`), minus its reading of the file: the bundle in
  // a context of Node's own.
  const pele = evaluatePeleBundle(
    fs.readFileSync(
      path.resolve(__dirname, '../../dependencies/pele/pele.global.js'),
      'utf8',
    ),
  );
  const inNode = SOURCES.map((source) => pele.render(source).svg);

  /** What a diagram comes to whatever width its labels measured at. */
  const signatureOf = (svg: string) => ({
    drawn: svg.startsWith('<svg '),
    type: svg.match(/aria-roledescription="([^"]*)"/)?.[1],
    links: [...svg.matchAll(/<a\s[^>]*>/g)].map(
      ([tag]) => tag.match(/\shref="([^"]*)"/)?.[1] ?? '',
    ),
    images: [...svg.matchAll(/<image\s[^>]*>/g)].map(
      ([tag]) => tag.match(/\shref="([^"]*)"/)?.[1] ?? '',
    ),
    // What is drawn besides text: a global the Node context lacks would show
    // in what is drawn — pele drops every web link and image without `URL` —
    // not in how wide a label came out.
    shapes: [
      ...new Set(
        [...svg.matchAll(/<([a-zA-Z]+)[\s/>]/g)]
          .map(([, tag]) => tag)
          .filter((tag) => !['text', 'tspan', 'title'].includes(tag)),
      ),
    ].sort(),
  });

  expect(inNode.map(signatureOf)).toEqual(inBrowser.map(signatureOf));
  expect(
    inBrowser.map(signatureOf).map((signature) => signature.links),
  ).toEqual(
    PELE_DIAGRAMS.map((diagram) =>
      diagram.name === 'flowchart' ? ['https://pele.run/'] : [],
    ),
  );
  expect(errors).toEqual([]);
});

test('a diagram takes its colors from the scheme of its page, and changes with it', async ({
  page,
}) => {
  const errors = errorsOf(page);
  await openWithPele(page);
  // The stylesheet of the preview and of exported documents, which has the
  // dark palette. The page is painted like the documents: every preview theme
  // gives <body> its background color, and a document that follows the
  // reader's system color scheme switches it.
  await page.addStyleTag({
    content: `${stylesheet}
      body { margin: 0; background-color: #ffffff; }
      @media (prefers-color-scheme: dark) { body { background-color: #0d1117; } }`,
  });

  // The script of an exported document marks the scheme of the page itself.
  await page.emulateMedia({ colorScheme: 'light' });
  await drawIn(page, blocksOf([FLOWCHART.source]), 'export');
  expect(await readColors(page)).toEqual({
    scheme: 'light',
    label: LIGHT_LABEL,
    node: LIGHT_NODE,
  });
  // … and keeps following the system color scheme.
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.waitForFunction(
    () => document.body.getAttribute('data-preview-theme') === 'dark',
  );
  expect(await readColors(page)).toEqual({
    scheme: 'dark',
    label: DARK_LABEL,
    node: DARK_NODE,
  });
  await page.emulateMedia({ colorScheme: 'light' });
  await page.waitForFunction(
    () => document.body.getAttribute('data-preview-theme') === 'light',
  );
  expect((await readColors(page)).label).toBe(LIGHT_LABEL);

  // The preview marks the scheme itself, from the background color of the
  // page. A diagram changes color with the theme without being drawn again.
  const selector = await drawIn(page, blocksOf([SEQUENCE.source]), 'preview');
  expect(await readColors(page, selector)).toEqual({
    scheme: 'light',
    label: LIGHT_LABEL,
    node: LIGHT_NODE,
  });
  await page.evaluate(() =>
    document.body.setAttribute('data-preview-theme', 'dark'),
  );
  expect(await readColors(page, selector)).toEqual({
    scheme: 'dark',
    label: DARK_LABEL,
    node: DARK_NODE,
  });
  expect(errors).toEqual([]);
});

const USER_RED = 'rgb(255, 0, 0)';
const USER_BLUE = 'rgb(0, 0, 255)';

for (const scheme of ['light', 'dark'] as const) {
  for (const rule of [':root', 'html', 'body', '.pele']) {
    test(`a variable that global CSS sets on \`${rule}\` restyles a diagram on a ${scheme} page`, async ({
      page,
    }) => {
      // The dark palette is declared so that it loses to a rule of the
      // user's wherever that is written (crossnote#603: on `:root`, it won).
      const errors = errorsOf(page);
      await openWithPele(page);
      await page.addStyleTag({ content: stylesheet });
      // Global CSS comes after the stylesheet, as the user's does.
      await page.addStyleTag({
        content: `${rule} { --pele-fg: ${USER_RED}; --pele-surface: ${USER_BLUE}; }`,
      });
      await page.evaluate(
        (scheme) => document.body.setAttribute('data-preview-theme', scheme),
        scheme,
      );

      const container = await drawIn(
        page,
        blocksOf([FLOWCHART.source]),
        'preview',
      );
      expect(await readColors(page, container)).toEqual({
        scheme,
        label: USER_RED,
        node: USER_BLUE,
      });
      expect(errors).toEqual([]);
    });
  }
}

test('a diagram whose font cannot be read shows its error, and the others are drawn', async ({
  page,
}) => {
  // The node is marked drawn before its font is read: an error there has to
  // take the place of the diagram, as the error of a drawing does, and must
  // not end the script with the diagram left as its source.
  const errors = errorsOf(page);
  await openWithPele(page);
  // Only the first diagram's cannot; the page's own reads — of the color the
  // page is painted with — still work.
  await page.evaluate(() => {
    const getComputedStyleOf = window.getComputedStyle.bind(window);
    let first = true;
    window.getComputedStyle = (element: Element) => {
      if (first && element.classList.contains('pele')) {
        first = false;
        throw new Error('no style');
      }
      return getComputedStyleOf(element);
    };
  });

  const container = await drawIn(
    page,
    blocksOf([SEQUENCE.source, FLOWCHART.source]),
    'export',
  );
  const diagrams = await page.evaluate((container) => {
    return Array.from(
      document.querySelector(container)!.querySelectorAll('div.pele'),
    ).map((node) => ({
      drawn: !!node.querySelector('svg.pele'),
      error: node.querySelector('pre code')?.textContent ?? null,
    }));
  }, container);
  expect(diagrams).toEqual([
    { drawn: false, error: 'Error: no style' },
    { drawn: true, error: null },
  ]);
  expect(
    await page.evaluate(
      () => (window as unknown as PeleWindow).__crossnotePeleExport,
    ),
  ).toEqual({ status: 'complete' });
  expect(errors).toEqual([]);
});

test('an exported document that paints neither <body> nor <html> is a light page', async ({
  page,
}) => {
  // The page of the `none.css` preview theme: black text on the canvas, which
  // is white. Read from <body> alone it came out dark, and a diagram on it in
  // the dark palette.
  const errors = errorsOf(page);
  await openWithPele(page);
  await page.addStyleTag({ content: stylesheet });
  const selector = await drawIn(page, blocksOf([FLOWCHART.source]), 'export');

  expect(await readColors(page, selector)).toEqual({
    scheme: 'light',
    label: LIGHT_LABEL,
    node: LIGHT_NODE,
  });
  expect(errors).toEqual([]);
});

test('an exported document reads the background of its page in whatever form it is written', async ({
  page,
}) => {
  // A browser keeps the space a color is written in: <body> is painted with
  // an oklch() or a color-mix() as readily as with rgb(), and keeps a
  // fractional alpha. One pixel of a canvas holds any of them as rgba. Read
  // as numbers from the text, a color-mix() came out light and a
  // mostly-opaque dark one as transparent; where it is only guessed at, a
  // light oklch() color comes out dark.
  const errors = errorsOf(page);
  await openWithPele(page);
  await page.addStyleTag({ content: stylesheet });
  for (const [color, scheme] of [
    ['color-mix(in srgb, #0d1117 90%, white)', 'dark'],
    ['oklch(0.2 0.01 260)', 'dark'],
    ['#0d1117cc', 'dark'],
    ['rgb(13 17 23 / 5%)', 'light'],
    ['oklch(0.98 0.01 100)', 'light'],
    ['color-mix(in srgb, white 95%, #0d1117)', 'light'],
  ] as const) {
    const sheet = await page.addStyleTag({
      content: `body { background-color: ${color}; }`,
    });
    const selector = await drawIn(page, blocksOf([FLOWCHART.source]), 'export');
    const colors = await readColors(page, selector);
    // What the browser handed the script.
    const computed = await page.evaluate(
      () => getComputedStyle(document.body).backgroundColor,
    );
    await sheet.evaluate((element) => (element as HTMLElement).remove());

    expect({ color, computed, ...colors }).toEqual({
      color,
      computed,
      scheme,
      label: scheme === 'dark' ? DARK_LABEL : LIGHT_LABEL,
      node: scheme === 'dark' ? DARK_NODE : LIGHT_NODE,
    });
  }
  expect(errors).toEqual([]);
});

test('the bundle draws without the APIs the oldest supported webview lacks', async ({
  page,
}) => {
  // VS Code 1.82 renders webviews with Chromium 114. A call to one of these
  // throws there. The guard test (`test/pele-vendor.test.ts`) looks for them
  // by name; this draws with them gone — all but `Symbol.dispose` and
  // `Symbol.asyncDispose`, whose slots a page cannot empty. Nor can Node 18,
  // which has them too: for those two, the guard test is the only check.
  // (`Array.prototype.toSorted` and its two siblings are of Chromium 110, so
  // the floor has them.)
  const removed = [
    'Promise.withResolvers',
    'Object.groupBy',
    'Map.groupBy',
    'Array.fromAsync',
    'URL.canParse',
  ];
  await page.addInitScript((removed) => {
    for (const path of removed) {
      const name = path.split('.').pop()!;
      const holder = path
        .split('.')
        .slice(0, -1)
        .reduce(
          (object, key) => (object as Record<string, unknown>)[key] as object,
          window as unknown as object,
        );
      delete (holder as Record<string, unknown>)[name];
    }
  }, removed);
  const errors = errorsOf(page);
  await openWithPele(page);
  // They are gone from the page the bundle ran in.
  expect(
    await page.evaluate(
      (removed) =>
        removed.filter((path) => {
          const name = path.split('.').pop()!;
          const holder = path
            .split('.')
            .slice(0, -1)
            .reduce(
              (object, key) =>
                (object as Record<string, unknown>)[key] as object,
              window as unknown as object,
            );
          return name in (holder as object);
        }),
      removed,
    ),
  ).toEqual([]);

  const selector = await drawIn(page, blocksOf(SOURCES), 'preview');
  const types = await page.evaluate(
    (selector) =>
      Array.from(
        document
          .querySelector(selector)!
          .querySelectorAll('svg.pele[aria-roledescription]'),
      ).map((svg) => svg.getAttribute('aria-roledescription')),
    selector,
  );
  expect(types).toEqual(PELE_DIAGRAMS.map((diagram) => diagram.type));
  expect(errors).toEqual([]);
});

for (const scheme of ['light', 'dark'] as const) {
  test(`the preview draws the diagrams of a note in the colors of its ${scheme} page`, async ({
    page,
  }) => {
    const errors = errorsOf(page);
    await stubHost(page);
    // The page the engine's template lays out for a note, on a page painted
    // like the preview theme's: the body has the background color the scheme
    // is read from.
    await openPreview(
      page,
      previewDocument(
        PREVIEW_CONFIG,
        `<body class="preview-container" data-html="${escape(
          '<h1>Flows</h1>',
        )}" style="margin: 0; padding: 16px; ${
          scheme === 'dark'
            ? 'background-color: #0d1117; color: #c9d1d9;'
            : 'background-color: #ffffff; color: #24292e;'
        }"></body>`,
        { head: `<style>${stylesheet}</style>` },
      ),
    );
    await waitForPreview(page);

    const preview = page.locator('[data-for="preview"]');
    await updatePreview(
      page,
      `<h1>Flows</h1>${blocksOf([FLOWCHART.source, SEQUENCE.source])}`,
    );
    await expect(preview.locator('div.pele > svg.pele')).toHaveCount(2);
    expect(await readColors(page, '[data-for="preview"]')).toEqual({
      scheme,
      label: scheme === 'dark' ? DARK_LABEL : LIGHT_LABEL,
      node: scheme === 'dark' ? DARK_NODE : LIGHT_NODE,
    });

    // The next refresh replaces them: a diagram that cannot be drawn shows
    // its error where it is, as text.
    await updatePreview(page, blocksOf([SEQUENCE.source, PELE_INVALID]));
    await expect(preview.locator('div.pele > svg.pele')).toHaveCount(1);
    await expect(preview.locator('div.pele > pre')).toHaveText(
      /^PeleError: Parse error on line 2:/,
    );
    expect(errors).toEqual([]);
  });
}

test('a presentation in the preview has the diagram of every slide before the slide is shown', async ({
  page,
}) => {
  const errors = errorsOf(page);
  await stubHost(page);
  const deck = [SEQUENCE.source, JOURNEY.source, FLOWCHART.source];
  const slides = deck
    .map(
      (
        diagram,
        h,
      ) => `<section class="slide" data-source-line="${3 + 6 * h}" data-h="${h}" data-v="0">
        <h1>Slide ${h + 1}</h1>
        <div class="pele">${escape(diagram)}</div>
      </section>`,
    )
    .join('\n');
  // The slides of the deck stand at the top of <body>, as the engine's
  // template lays them out; the preview mounts after them.
  await openPreview(
    page,
    previewDocument(
      { ...PREVIEW_CONFIG, cursorLine: 3 },
      `<body class="preview-container" data-presentation-mode>
        <div class="reveal"><div class="slides">${slides}</div></div>
      </body>`,
      {
        presentation: true,
        head: `<link rel="stylesheet" href="${server.url}/reveal/css/reveal.css">
        <link rel="stylesheet" href="${server.url}/reveal/css/theme/white.css">`,
      },
    ),
  );
  await waitForDeck(page);

  // Every slide's diagram is in as the deck opens — not only the one shown —
  // and the slide shown is centered with its diagram.
  const opened = await readDeck(page);
  expect(opened.current).toBe(0);
  expect(opened.rendered).toEqual([true, true, true]);
  expect(opened.offCenter).toBeLessThan(1);

  for (const h of [1, 2]) {
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(
      (h) => (window as unknown as PeleWindow).Reveal.getIndices().h === h,
      h,
    );
    // The slide was laid out with its diagram: it is centered.
    expect((await readDeck(page)).offCenter, `slide ${h}`).toBeLessThan(1);
  }
  expect(errors).toEqual([]);
});

test('an exported document has its diagrams drawn by the time it has loaded', async ({
  page,
}) => {
  const errors = errorsOf(page);
  await page.route(`${server.url}/export.html`, (route) =>
    route.fulfill({
      contentType: 'text/html; charset=utf-8',
      body: `<!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><style>${stylesheet}</style></head>
        <body>
          <div class="crossnote markdown-preview">${blocksOf([FLOWCHART.source, PELE_INVALID])}</div>
          <script src="${server.url}/pele/pele.global.js"></script>
          <script>${buildPeleExportScript()}</script>
        </body>
      </html>`,
    }),
  );
  await page.goto(`${server.url}/export.html`);

  // Nothing is waited for: the page has loaded, and the diagrams are drawn.
  expect(await page.evaluate(() => document.readyState)).toBe('complete');
  expect(
    await page.evaluate(() => ({
      status: (window as unknown as PeleWindow).__crossnotePeleExport,
      drawn: document.querySelectorAll('div.pele > svg.pele').length,
      error: document.querySelector('div.pele > pre')?.textContent ?? '',
      link: document.querySelector('div.pele a')?.getAttribute('href') ?? '',
      sourceLeft: Array.from(document.querySelectorAll('div.pele')).filter(
        (node) => node.firstElementChild === null,
      ).length,
    })),
  ).toEqual({
    status: { status: 'complete' },
    drawn: 1,
    error: expect.stringMatching(/^PeleError: Parse error on line 2:/),
    link: 'https://pele.run/',
    sourceLeft: 0,
  });
  expect(errors).toEqual([]);
});

test('an exported presentation has its diagrams before Reveal lays the slides out', async ({
  page,
}) => {
  const errors = errorsOf(page);
  const deck = [SEQUENCE.source, JOURNEY.source, FLOWCHART.source];
  const slides = deck
    .map(
      (diagram, h) => `<section class="slide" data-h="${h}" data-v="0">
        <h1>Slide ${h + 1}</h1>
        <div class="pele">${escape(diagram)}</div>
      </section>`,
    )
    .join('\n');
  // In the document of an HTML or PDF export the script that draws the pele
  // diagrams stands right after the one that starts Reveal
  // (`generateHTMLTemplateForExport`).
  await page.route(`${server.url}/export.html`, (route) =>
    route.fulfill({
      contentType: 'text/html; charset=utf-8',
      body: `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <script src="${server.url}/reveal/js/reveal.js"></script>
        </head>
        <body data-presentation-mode>
          <div class="crossnote markdown-preview" data-presentation-mode>
            <div class="reveal"><div class="slides">${slides}</div></div>
          </div>
          <script>Reveal.initialize({ margin: 0.1 })</script>
          <script src="${server.url}/pele/pele.global.js"></script>
          <script>${buildPeleExportScript()}</script>
        </body>
      </html>`,
    }),
  );
  await page.goto(`${server.url}/export.html`);
  await page.waitForFunction(() =>
    (window as unknown as PeleWindow).Reveal.isReady(),
  );

  // Every slide's diagram is in, and the slide shown was centered with its
  // diagram: the drawing was done before Reveal's first layout.
  const state = await readDeck(page);
  expect(state.rendered).toEqual([true, true, true]);
  expect(state.offCenter).toBeLessThan(1);
  expect(errors).toEqual([]);
});
