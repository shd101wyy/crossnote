/**
 * The pele scripts of an exported document (`src/markdown-engine/index.ts`,
 * `src/markdown-engine/pele-export.ts`): a document that has a pele diagram
 * loads the vendored bundle and draws its diagrams with a classic script; one
 * that has none loads nothing. And the Chrome export reads what that script
 * reports.
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as vm from 'vm';
import {
  Browser,
  launch,
} from 'puppeteer-core/lib/cjs/puppeteer/puppeteer-core.js';
import type { PeleRenderer } from '../src/lib/pele';
import { mkdirSync, track } from '../src/lib/temp';
import { MarkdownEngine } from '../src/markdown-engine';
import { buildPeleExportScript } from '../src/markdown-engine/pele-export';
import { Notebook } from '../src/notebook';
import {
  getCrossnoteBuildDirectory,
  setCrossnoteBuildDirectory,
} from '../src/utility';

jest.mock('less', () => ({
  render: (
    _input: string,
    _options: unknown,
    callback: (error: unknown, output: { css: string } | undefined) => void,
  ) => {
    callback(null, { css: '' });
  },
}));

jest.mock('puppeteer-core/lib/cjs/puppeteer/puppeteer-core.js', () => ({
  launch: jest.fn(),
}));

/** The version of the vendored bundle: the one a CDN export is to load. */
const VENDORED_VERSION = fs
  .readFileSync(
    path.resolve(__dirname, '../dependencies/pele/pele.global.js'),
    'utf8',
  )
  .match(/^\/\*! Pele (\d+\.\d+\.\d+) \|/)?.[1];

const PELE_MARKER = 'window.PELE_OFFLINE_MARKER = true;';

function writeFakeBuildDirectory(root: string) {
  fs.mkdirSync(path.join(root, 'dependencies', 'pele'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'dependencies', 'pele', 'pele.global.js'),
    PELE_MARKER,
  );
}

/** Where in `html` the pele bundle is loaded, and where it is drawn with. */
function positions(html: string) {
  return {
    bundle: [html.indexOf(PELE_MARKER), html.indexOf('pele.global.js')].filter(
      (at) => at >= 0,
    ),
    drawing: html.indexOf('__crossnotePeleExport'),
  };
}

describe('HTML export of a document with pele diagrams', () => {
  track();

  const originalBuildDirectory = getCrossnoteBuildDirectory();
  let tmpDir: string;

  beforeAll(() => {
    tmpDir = mkdirSync({ prefix: 'xnote-pele-export' });
    writeFakeBuildDirectory(tmpDir);
    setCrossnoteBuildDirectory(tmpDir);
  });

  afterAll(() => {
    setCrossnoteBuildDirectory(originalBuildDirectory);
  });

  async function renderExportTemplate(
    bodyHtml: string,
    options: { offline: boolean; embedOfflineAssets?: boolean },
  ): Promise<string> {
    const notebook = await Notebook.init({
      notebookPath: tmpDir,
      config: {
        markdownParser: 'markdown-it',
        markdownYoBinaryPath: '',
        mathRenderingOption: 'KaTeX',
      },
    });
    const engine = new MarkdownEngine({
      notebook,
      filePath: path.join(tmpDir, 'test.md'),
    });
    return engine.generateHTMLTemplateForExport(
      bodyHtml,
      {},
      {
        isForPrint: false,
        isForPrince: false,
        offline: options.offline,
        embedLocalImages: false,
        embedOfflineAssets: options.embedOfflineAssets,
      },
    );
  }

  const peleBody = '<div class="pele">flowchart LR\n  A --> B\n</div>';
  const modes = [
    { offline: true, embedOfflineAssets: true },
    { offline: true },
    { offline: false },
  ];

  test('offline with embedded assets inlines the pele script', async () => {
    const html = await renderExportTemplate(peleBody, modes[0]);

    expect(html).not.toMatch(/<script[^>]*src="[^"]*pele\.global\.js"/);
    expect(html).toContain(PELE_MARKER);
  });

  test('offline without embedding links the vendored file', async () => {
    const html = await renderExportTemplate(peleBody, modes[1]);

    expect(html).toMatch(/file:\/\/[^"]*dependencies\/pele\/pele\.global\.js/);
    expect(html).not.toContain(PELE_MARKER);
  });

  test('online loads the vendored version from the CDN', async () => {
    const html = await renderExportTemplate(peleBody, modes[2]);

    expect(html).toContain(
      `<script src="https://cdn.jsdelivr.net/npm/pele@${VENDORED_VERSION}/dist/pele.global.js"></script>`,
    );
    expect(html).not.toContain(PELE_MARKER);
  });

  test('a document without a pele diagram loads nothing of pele', async () => {
    const html = await renderExportTemplate(
      '<p>hello</p><div class="mermaid">graph TD; A-->B;</div>',
      modes[0],
    );

    expect(html).not.toContain('pele.global.js');
    expect(html).not.toContain('__crossnotePeleExport');
    // Mermaid is unaffected.
    expect(html).toContain('__crossnoteMermaidExport');
  });

  test.each(modes)(
    'draws with a classic script, after the bundle has loaded (%j)',
    async (mode) => {
      const html = await renderExportTemplate(peleBody, mode);
      const { bundle, drawing } = positions(html);

      expect(bundle).toHaveLength(1);
      expect(drawing).toBeGreaterThanOrEqual(0);
      // The bundle is a script of its own, ahead of the one that draws.
      expect(bundle[0]).toBeLessThan(drawing);
      // Not a module: a module runs only once the document has been parsed,
      // after Reveal has begun to lay out a presentation's slides.
      expect(html).toMatch(
        /<script>\s*window\.__crossnotePeleExport = \{ status: 'pending' \}/,
      );
      expect(html).not.toMatch(
        /<script type="module">\s*window\.__crossnotePeleExport/,
      );
    },
  );

  test.each([
    ['the only class', '<div class="pele">'],
    ['a class among others', '<div class="wide pele narrow">'],
    ['attributes before the class', '<div id="flow" class="pele">'],
  ])('finds a diagram with %s', async (_what, openingTag) => {
    const html = await renderExportTemplate(
      `${openingTag}A --> B</div>`,
      modes[0],
    );

    expect(html).toContain('__crossnotePeleExport');
  });

  test('is not loaded for a class that only begins with pele', async () => {
    const html = await renderExportTemplate(
      '<div class="pelephant">A --> B</div>',
      modes[0],
    );

    expect(html).not.toContain('__crossnotePeleExport');
  });
});

describe('the script that draws the diagrams of an exported document', () => {
  const script = buildPeleExportScript();

  test('is JavaScript the Node 18 runtime floor parses', () => {
    // The engine's scripts are evaluated on that Node too when a test or a
    // host runs them; the document itself is drawn by a browser.
    expect(() => new Function(script)).not.toThrow();
  });

  test('asks pele for every diagram that was not drawn yet', () => {
    expect(script).toContain(
      "querySelectorAll('div.pele:not([data-processed])')",
    );
  });

  /**
   * Run the script in a page whose <body> and <html> have the given
   * background colors, and return the scheme it marked the page with, and
   * the colors it asked a canvas for. Without `canvas` the page has no 2D
   * context and the colors are read from their text; with one, the context
   * holds `pixel` for whichever color it is given, a transparent one excepted.
   */
  function schemeOf(
    body: string,
    html: string,
    canvas?: { pixel: number[] },
  ): { scheme: string | undefined; fills: string[] } {
    const attributes: Record<string, string> = {};
    const fills: string[] = [];
    const context2d = {
      fillStyle: '',
      clearRect: () => undefined,
      fillRect: () => {
        fills.push(context2d.fillStyle);
      },
      getImageData: () => ({
        data:
          context2d.fillStyle === 'rgba(0, 0, 0, 0)'
            ? [0, 0, 0, 0]
            : canvas?.pixel,
      }),
    };
    const document = {
      querySelector: () => null,
      querySelectorAll: () => [],
      createElement: () => ({
        getContext: () => (canvas ? context2d : null),
      }),
      body: {
        setAttribute: (name: string, value: string) => {
          attributes[name] = value;
        },
      },
      documentElement: {},
    };
    const page = vm.createContext({
      console: { error() {} },
      pele: {},
      document,
      getComputedStyle: (element: unknown) => ({
        backgroundColor: element === document.documentElement ? html : body,
        getPropertyValue: () => '',
        fontFamily: 'Arial',
      }),
    });
    page.window = page;
    vm.runInContext(script, page);
    return { scheme: attributes['data-preview-theme'], fills };
  }

  test('marks the page with the attribute the stylesheet keys colors on', () => {
    // style-template.less keys pele's dark palette on the same attribute the
    // preview sets on <body>.
    const stylesheet = fs.readFileSync(
      path.resolve(__dirname, '../styles/style-template.less'),
      'utf8',
    );
    expect(stylesheet).toContain(
      ":where(html:has(> body[data-preview-theme='dark'])) {",
    );
    expect(schemeOf('rgb(36, 41, 46)', 'rgba(0, 0, 0, 0)').scheme).toBe('dark');
    expect(schemeOf('rgb(255, 255, 255)', 'rgba(0, 0, 0, 0)').scheme).toBe(
      'light',
    );
  });

  test('reads a page that paints neither <body> nor <html> as a light one', () => {
    // The `none.css` preview theme paints neither: the document is black
    // text on the canvas, which is white. Read from <body> alone such a page
    // came out dark, and its diagrams in the dark palette.
    expect(schemeOf('rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0)').scheme).toBe(
      'light',
    );
    expect(schemeOf('rgb(255, 255, 255)', 'rgba(0, 0, 0, 0)').scheme).toBe(
      'light',
    );
    expect(schemeOf('rgb(36, 41, 46)', 'rgba(0, 0, 0, 0)').scheme).toBe('dark');
    expect(schemeOf('rgba(0, 0, 0, 0)', 'rgb(13, 17, 23)').scheme).toBe('dark');
  });

  test('reads a background that is not opaque over the white canvas', () => {
    // What shows through a background by its alpha is the canvas, which is
    // white. These colors are read from their text, as where the page has no
    // canvas: read as whole numbers alone, 0.8 came out as nothing showing.
    expect(schemeOf('rgba(13, 17, 23, 0.8)', 'rgba(0, 0, 0, 0)').scheme).toBe(
      'dark',
    );
    expect(schemeOf('rgba(13, 17, 23, 0.05)', 'rgba(0, 0, 0, 0)').scheme).toBe(
      'light',
    );
    // Through a canvas the alpha is in the pixel too.
    const barely = { pixel: [13, 17, 23, 51] };
    const fully = { pixel: [13, 17, 23, 255] };
    expect(schemeOf('rgba(0, 0, 0, 0)', '#0d1117', barely).scheme).toBe(
      'light',
    );
    expect(schemeOf('rgba(0, 0, 0, 0)', '#0d1117', fully).scheme).toBe('dark');
  });

  test('reads a color in whatever form the page wrote it, through a canvas', () => {
    // rgb() and rgba() are not the only forms. Read as numbers from the
    // text, a color-mix() came out light and an oklch() one as transparent.
    const dark = { pixel: [13, 17, 23, 255] };
    expect(
      schemeOf(
        'color-mix(in srgb, #0d1117 90%, white)',
        'rgba(0, 0, 0, 0)',
        dark,
      ),
    ).toEqual({
      scheme: 'dark',
      fills: ['color-mix(in srgb, #0d1117 90%, white)'],
    });
    expect(
      schemeOf('oklch(0.2 0.01 260)', 'rgba(0, 0, 0, 0)', dark).scheme,
    ).toBe('dark');
    // <body> shows nothing of its own: <html> is asked, and answers.
    expect(schemeOf('rgba(0, 0, 0, 0)', 'oklch(0.2 0.01 260)', dark)).toEqual({
      scheme: 'dark',
      fills: ['rgba(0, 0, 0, 0)', 'oklch(0.2 0.01 260)'],
    });
  });

  test('cannot end its own script element early', () => {
    // It is inlined into a <script> element: a closing tag in it would cut
    // the drawing short and let what follows be read as markup.
    expect(script).not.toMatch(/<\/script/i);
  });
});

describe('Chrome export with pele diagrams', () => {
  /** A `div.pele` as the drawing script sees it. */
  interface FakeDiagram {
    textContent: string;
    innerHTML: string;
    attributes: Record<string, string>;
    setAttribute(name: string, value: string): void;
  }

  function fakeDiagram(code: string): FakeDiagram {
    return {
      textContent: code,
      innerHTML: '',
      attributes: {},
      setAttribute(name: string, value: string) {
        this.attributes[name] = value;
      },
    };
  }

  /**
   * Run the engine's emitted scripts against a controllable page. Only the
   * browser transport is replaced; parsing, HTML generation and export are
   * real. The classic scripts run as the document is loaded — the one that
   * draws the pele diagrams among them, unless `drawingScript` is off — with
   * `pele` as the page's own.
   */
  function browserHarness(
    pele: PeleRenderer | undefined,
    { drawingScript = true }: { drawingScript?: boolean } = {},
  ) {
    const diagrams: FakeDiagram[] = [];
    const body: { attributes: Record<string, string> } = { attributes: {} };
    const captures: Array<Array<{ drawn: string; processed: string }>> = [];
    const context = vm.createContext({
      console: { error() {} },
      document: {
        querySelector: (selector: string) =>
          // What the export asks: a pele diagram that was not drawn. No
          // Mermaid diagram.
          selector === 'div.pele:not([data-processed])'
            ? (diagrams.find(
                (diagram) => !diagram.attributes['data-processed'],
              ) ?? null)
            : null,
        querySelectorAll: () => diagrams,
        createElement: () => ({ getContext: () => null }), // no canvas
        body: {
          setAttribute: (name: string, value: string) => {
            body.attributes[name] = value;
          },
        },
      },
      getComputedStyle: () => ({
        backgroundColor: 'rgb(255, 255, 255)',
        getPropertyValue: () => '',
        fontFamily: 'Arial',
      }),
    });
    if (pele) {
      context.pele = pele;
    }
    context.window = context;
    const evaluate = (fn: () => unknown) =>
      vm.runInContext(`(${fn.toString()})()`, context);
    const capture = async (config: { path: string }) => {
      captures.push(
        diagrams.map((diagram) => ({
          drawn: diagram.innerHTML,
          processed: diagram.attributes['data-processed'] ?? '',
        })),
      );
      fs.writeFileSync(config.path, 'pdf');
    };
    const page = {
      async goto(url: string) {
        const html = fs.readFileSync(fileURLToPath(url), 'utf8');
        for (const [, code] of html.matchAll(
          /<div class="pele">([^<]*)<\/div>/g,
        )) {
          // As the text of the element, with the source's markup unescaped.
          diagrams.push(
            fakeDiagram(
              code
                .replace(/&gt;/g, '>')
                .replace(/&lt;/g, '<')
                .replace(/&amp;/g, '&'),
            ),
          );
        }
        for (const [, script] of html.matchAll(
          /<script>([\s\S]*?)<\/script>/g,
        )) {
          if (drawingScript || !script.includes('__crossnotePeleExport')) {
            vm.runInContext(script, context);
          }
        }
      },
      waitForFunction: async (predicate: () => unknown) => {
        while (!(await evaluate(predicate))) {
          await new Promise<void>((resolve) => setImmediate(resolve));
        }
      },
      evaluate,
      pdf: capture,
      screenshot: capture,
    };
    const browser = {
      newPage: async () => page,
      close: jest.fn().mockResolvedValue(undefined),
    };
    return { browser, page, diagrams, captures, body };
  }

  const pele: PeleRenderer = {
    render: (source) => ({
      svg: `<svg class="pele"><text>${source.trim()}</text></svg>`,
      width: 1,
      height: 1,
      type: 'flowchart',
    }),
  };
  let directory: string;

  beforeEach(() => {
    directory = fs.mkdtempSync(
      path.join(os.tmpdir(), 'crossnote-pele-chrome-'),
    );
  });

  afterEach(() => {
    fs.rmSync(directory, { recursive: true, force: true });
    jest.clearAllMocks();
  });

  async function createEngine(content: string) {
    fs.writeFileSync(path.join(directory, 'note.md'), content);
    const notebook = await Notebook.init({
      notebookPath: directory,
      config: {
        markdownParser: 'markdown-it',
        chromePath: '/test/chrome',
        mathRenderingOption: 'None',
        puppeteerWaitForTimeout: 0,
      },
    });
    return notebook.getNoteMarkdownEngine('note.md');
  }

  test('draws the diagrams before the page is captured', async () => {
    const harness = browserHarness(pele);
    jest
      .mocked(launch)
      .mockResolvedValue(harness.browser as unknown as Browser);
    const engine = await createEngine(
      '```pele\nflowchart LR\n  A --> B\n```\n\n```pele\npie title Pets\n  "Dogs" : 1\n```',
    );

    await engine.chromeExport();

    expect(harness.captures).toEqual([
      [
        {
          drawn: '<svg class="pele"><text>flowchart LR\n  A --> B</text></svg>',
          processed: 'true',
        },
        {
          drawn:
            '<svg class="pele"><text>pie title Pets\n  "Dogs" : 1</text></svg>',
          processed: 'true',
        },
      ],
    ]);
    expect(fs.existsSync(path.join(directory, 'note.pdf'))).toBe(true);
    expect(harness.browser.close).toHaveBeenCalledTimes(1);
  });

  test('fails, and writes no file, when the pele script did not load', async () => {
    const harness = browserHarness(undefined);
    jest
      .mocked(launch)
      .mockResolvedValue(harness.browser as unknown as Browser);
    const engine = await createEngine('```pele\nflowchart LR\n  A --> B\n```');

    await expect(engine.chromeExport()).rejects.toThrow(
      'Pele rendering failed: The pele script is not loaded.',
    );
    expect(harness.captures).toEqual([]);
    expect(fs.existsSync(path.join(directory, 'note.pdf'))).toBe(false);
    expect(harness.browser.close).toHaveBeenCalledTimes(1);
  });

  test('fails, and writes no file, when a diagram was left undrawn', async () => {
    // Nothing is reported in place of such a diagram: it would be captured
    // as the source text stands in the document.
    const harness = browserHarness(pele, { drawingScript: false });
    jest
      .mocked(launch)
      .mockResolvedValue(harness.browser as unknown as Browser);
    const engine = await createEngine('```pele\nflowchart LR\n  A --> B\n```');

    await expect(engine.chromeExport()).rejects.toThrow(
      'Pele rendering failed: A diagram was not drawn',
    );
    expect(harness.captures).toEqual([]);
    expect(fs.existsSync(path.join(directory, 'note.pdf'))).toBe(false);
    expect(harness.browser.close).toHaveBeenCalledTimes(1);
  });
});
