import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as vm from 'vm';
import {
  Browser,
  launch,
} from 'puppeteer-core/lib/cjs/puppeteer/puppeteer-core.js';
import { Notebook } from '../src/notebook';

jest.mock('puppeteer-core/lib/cjs/puppeteer/puppeteer-core.js', () => ({
  launch: jest.fn(),
}));

function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

interface Diagram {
  processed?: boolean;
  svg?: string;
}

/**
 * Run the engine's emitted scripts with a controllable async Mermaid renderer.
 * Only the browser transport is replaced; parsing, HTML generation and export
 * are real. A data-processed node deliberately exists before its SVG is ready.
 */
function browserHarness(
  options: { timeout?: boolean; captureError?: Error } = {},
) {
  const loaded = deferred();
  const rendering = deferred();
  const diagrams: Diagram[] = [];
  const captures: Array<Array<string | undefined>> = [];
  const context = vm.createContext({
    console: { error() {} },
    document: {
      querySelector: () => diagrams[0] ?? null,
      querySelectorAll: () => diagrams,
    },
    mermaid: {
      initialize() {},
      async run() {
        diagrams.forEach((diagram: Diagram) => (diagram.processed = true));
        await rendering.promise;
        diagrams.forEach((diagram: Diagram) => (diagram.svg = 'complete'));
      },
    },
  });
  context.window = context;
  const evaluate = (fn: () => unknown) =>
    vm.runInContext(`(${fn.toString()})()`, context);
  const capture = async (config: { path: string }) => {
    if (options.captureError) throw options.captureError;
    captures.push(diagrams.map((diagram: Diagram) => diagram.svg));
    fs.writeFileSync(config.path, JSON.stringify(captures[0]));
  };
  const page = {
    async goto(url: string) {
      const html = fs.readFileSync(fileURLToPath(url), 'utf8');
      diagrams.push(...[...html.matchAll(/class="mermaid/g)].map(() => ({})));
      for (const [, script] of html.matchAll(
        /<script type="module">([\s\S]*?)<\/script>/g,
      )) {
        // Navigation does not wait for a module's top-level await.
        Promise.resolve(
          vm.runInContext(`(async () => {${script}\n})()`, context),
        ).catch(() => {});
      }
      loaded.resolve();
    },
    async waitForFunction(predicate: () => unknown) {
      while (!(await evaluate(predicate))) {
        if (options.timeout)
          throw new Error('Waiting failed: timeout exceeded');
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
  return { browser, page, loaded, rendering, diagrams, captures };
}

const markdown = [
  '```mermaid\ngraph TD\nA --> B\n```',
  '```mermaid\nclassDiagram\nA --> B\n```',
  '```mermaid\nsequenceDiagram\nA->>B: Hello\n```',
].join('\n\n');

describe('Chrome export waits for Mermaid', () => {
  let directory: string;

  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'crossnote-chrome-'));
  });

  afterEach(() => {
    fs.rmSync(directory, { recursive: true, force: true });
    jest.clearAllMocks();
  });

  async function createEngine(content: string = markdown) {
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

  test.each(['pdf', 'png', 'jpeg'])(
    '%s waits for all diagrams even after they are marked processed',
    async (fileType: string) => {
      const harness = browserHarness();
      jest
        .mocked(launch)
        .mockResolvedValue(harness.browser as unknown as Browser);
      const engine = await createEngine();
      const exporting = engine.chromeExport({ fileType });
      await harness.loaded.promise;
      await new Promise<void>((resolve) => setImmediate(resolve));
      try {
        expect(harness.diagrams).toHaveLength(3);
        expect(
          harness.diagrams.every((diagram: Diagram) => diagram.processed),
        ).toBe(true);
        expect(harness.captures).toEqual([]);
      } finally {
        harness.rendering.resolve();
        await exporting;
      }
      expect(harness.captures).toEqual([['complete', 'complete', 'complete']]);
      expect(harness.browser.close).toHaveBeenCalledTimes(1);
    },
  );

  test('propagates a rendering failure without creating a PDF', async () => {
    const harness = browserHarness();
    jest
      .mocked(launch)
      .mockResolvedValue(harness.browser as unknown as Browser);
    const engine = await createEngine();
    const exporting = engine.chromeExport();
    await harness.loaded.promise;
    harness.rendering.reject(new Error('Invalid diagram syntax'));
    await expect(exporting).rejects.toThrow('Invalid diagram syntax');
    expect(fs.existsSync(path.join(directory, 'note.pdf'))).toBe(false);
    expect(harness.browser.close).toHaveBeenCalledTimes(1);
  });

  test('closes Chrome on a rendering timeout', async () => {
    const harness = browserHarness({ timeout: true });
    jest
      .mocked(launch)
      .mockResolvedValue(harness.browser as unknown as Browser);
    const engine = await createEngine();
    try {
      await expect(engine.chromeExport()).rejects.toThrow('timeout');
      expect(harness.captures).toEqual([]);
      expect(harness.browser.close).toHaveBeenCalledTimes(1);
    } finally {
      harness.rendering.resolve();
    }
  });

  test('exports documents without Mermaid immediately', async () => {
    const harness = browserHarness();
    jest
      .mocked(launch)
      .mockResolvedValue(harness.browser as unknown as Browser);
    const engine = await createEngine('# Plain Markdown');
    await engine.chromeExport();
    expect(harness.captures).toEqual([[]]);
    expect(harness.browser.close).toHaveBeenCalledTimes(1);
  });

  test('closes Chrome when navigation fails', async () => {
    const harness = browserHarness();
    harness.page.goto = async () => {
      throw new Error('Navigation failed');
    };
    jest
      .mocked(launch)
      .mockResolvedValue(harness.browser as unknown as Browser);
    const engine = await createEngine();
    await expect(engine.chromeExport()).rejects.toThrow('Navigation failed');
    expect(harness.browser.close).toHaveBeenCalledTimes(1);
  });

  test('preserves capture errors even if closing Chrome also fails', async () => {
    const harness = browserHarness({
      captureError: new Error('Capture failed'),
    });
    harness.browser.close.mockRejectedValue(new Error('Profile is busy'));
    jest
      .mocked(launch)
      .mockResolvedValue(harness.browser as unknown as Browser);
    const engine = await createEngine('# Plain Markdown');
    await expect(engine.chromeExport()).rejects.toThrow('Capture failed');
    expect(harness.browser.close).toHaveBeenCalledTimes(1);
  });
});
