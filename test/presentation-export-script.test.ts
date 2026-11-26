import * as vm from 'vm';
import { buildPresentationInitScript } from '../src/markdown-engine/presentation-export';

/**
 * Run the script the way a page does that has reveal.js 6. Before a deck is
 * started in it, its global takes listeners and `initialize`, and knows
 * nothing else.
 */
function runScript(script: string, { search = '' }: { search?: string } = {}) {
  const listeners: Record<string, Array<() => void>> = {};
  let started = 0;
  const slides = { style: {} as Record<string, string> };
  const context = vm.createContext({
    location: { search },
    document: { querySelector: () => slides },
    Reveal: {
      addEventListener(type: string, listener: () => void) {
        (listeners[type] ??= []).push(listener);
      },
      initialize() {
        started += 1;
      },
    },
  });
  context.window = context;
  const isModule = script.startsWith('<script type="module">');
  const body = script
    .replace(/^<script( type="module")?>/, '')
    .replace(/<\/script>\s*$/, '');
  if (!isModule) {
    vm.runInContext(body, context);
  }
  const done = isModule
    ? Promise.resolve(
        vm.runInContext(`(async () => {${body}\n})()`, context),
      ).catch((error: Error) => error)
    : Promise.resolve();
  const window = context as unknown as Record<string, unknown>;
  return {
    done,
    slides,
    listeners,
    window,
    get started() {
      return started;
    },
  };
}

describe('the script that starts a presentation of an exported document', () => {
  // The addresses are read the way reveal.js reads them (reveal 6.0.2).
  const printView: [string, string, Record<string, unknown>][] = [
    ['by its address', '?print-pdf', {}],
    ['by its address in capitals', '?PRINT-PDF', {}],
    ['by its address, before a fragment', '?print-pdf#/first', {}],
    ['by view=print in its address', '?view=print', {}],
    ['by a view that is written escaped', '?view=%70rint', {}],
    ['among other parameters', '?a=1&view=print&b=2', {}],
    [
      'among other parameters that a semicolon separates',
      '?a=1;view=print',
      {},
    ],
    ['by a parameter whose name ends in view', '?a-view=print', {}],
    ['by the last of two views', '?view=scroll&view=print', {}],
    ['by its configuration', '', { view: 'print' }],
    [
      'by its configuration, where the address has other parameters',
      '?page=3',
      { view: 'print' },
    ],
  ];

  const pageView: [string, string, Record<string, unknown>][] = [
    ['without a print address', '?page=3', {}],
    ['by a view of another name', '?view=scroll', {}],
    ['by a view written in capitals', '?view=Print', {}],
    ['by a parameter whose name is written in capitals', '?VIEW=print', {}],
    ['by the last of two views', '?view=print&view=scroll', {}],
    [
      'by a view that says nothing, though configured',
      '?view=',
      { view: 'print' },
    ],
    [
      'by a view of another name, though configured',
      '?view=scroll',
      { view: 'print' },
    ],
  ];

  test('starts the presentation at once where the page has no Mermaid diagram', async () => {
    const page = runScript(
      buildPresentationInitScript({
        presentationConfig: { theme: 'black.css' },
        hasMermaid: false,
      }),
    );

    expect(page.started).toBe(1);
    expect(page.window.__crossnoteDiagramsDrawn).toBeUndefined();
  });

  test.each([
    ['without a notes plugin', undefined],
    ['with the notes plugin', 'window.RevealNotes'],
  ])('reports the print layout of reveal.js, %s', async (_, notesPlugin) => {
    const page = runScript(
      buildPresentationInitScript({
        presentationConfig: {},
        notesPlugin,
        hasMermaid: false,
      }),
    );

    expect(page.window.__crossnotePrintLayoutReady).toBeUndefined();
    for (const listener of page.listeners['pdf-ready'] ?? []) {
      listener();
    }
    expect(page.window.__crossnotePrintLayoutReady).toBe(true);
  });

  test('passes the speaker notes plugin the way reveal.js 6 requires', () => {
    const script = buildPresentationInitScript({
      presentationConfig: { enableSpeakerNotes: true },
      notesPlugin: 'window.RevealNotes',
      hasMermaid: false,
    });

    expect(script).toMatch(
      /Reveal\.initialize\(Object\.assign\(\{.*"scrollActivationWidth":null.*"enableSpeakerNotes":true.*\}, \{ plugins: \[window\.RevealNotes\] \}\)\)/s,
    );
  });

  test.each(printView)(
    'with Mermaid diagrams, is started in the print view %s once they are drawn',
    async (_, search, presentationConfig) => {
      const page = runScript(
        buildPresentationInitScript({
          presentationConfig,
          hasMermaid: true,
        }),
        { search },
      );
      // The module script has run up to its wait.
      await new Promise<void>((resolve) => setImmediate(resolve));

      // The slides are as wide as the presentation says, as they are on
      // paper: a diagram is drawn as wide as its slide.
      expect(page.started).toBe(0);
      expect(page.slides.style.width).toBe('960px');
      expect(typeof page.window.__crossnoteDiagramsDrawn).toBe('function');

      (page.window.__crossnoteDiagramsDrawn as () => void)();
      expect(await page.done).toBeUndefined();
      expect(page.started).toBe(1);
      expect(page.listeners['pdf-ready']).toHaveLength(1);
    },
  );

  test.each(pageView)(
    'with Mermaid diagrams, is started at once in the page view %s',
    async (_, search, presentationConfig) => {
      const page = runScript(
        buildPresentationInitScript({
          presentationConfig,
          hasMermaid: true,
        }),
        { search },
      );

      expect(await page.done).toBeUndefined();
      expect(page.started).toBe(1);
      // Nothing waits for the diagrams there: the script that draws them
      // waits for Reveal instead.
      expect(page.window.__crossnoteDiagramsDrawn).toBeUndefined();
      expect(page.slides.style.width).toBeUndefined();
    },
  );

  test.each([
    ['a number', 1200, '1200px'],
    ['a percentage', '80%', '80%'],
  ] as const)(
    'gives the slides the width of the presentation written as %s',
    async (_, width, expected) => {
      const page = runScript(
        buildPresentationInitScript({
          presentationConfig: { width },
          hasMermaid: true,
        }),
        { search: '?print-pdf' },
      );
      await new Promise<void>((resolve) => setImmediate(resolve));

      expect(page.slides.style.width).toBe(expected);
    },
  );
});
