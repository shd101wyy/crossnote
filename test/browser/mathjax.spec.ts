import * as path from 'path';
import { expect, Page, test } from '@playwright/test';
import { build } from 'esbuild';
import { buildMathJaxConfigScript } from '../../src/markdown-engine/mathjax-config';
import { getDefaultMathjaxConfig } from '../../src/notebook/types';
import { startServer, TestServer } from './server';

/**
 * Real-browser tests for the client-side MathJax pipeline.
 *
 *  - Equation numbering must stay correct across re-renders. The preview
 *    rebuilds the hidden DOM and re-typesets on every edit; without
 *    `typesetClear()` + `texReset()` MathJax keeps the previous run's labels
 *    and emits "Label … multiply defined" errors with drifting numbers.
 *  - Semantic enrichment (speech-rule-engine) must be disabled by default for
 *    performance (#2312), and re-enableable via `mathjaxConfig`.
 *  - The first `updateHtml` must wait for MathJax to be actually ready
 *    (`typesetClear` / `startup.promise`) so a slow deferred load cannot
 *    leave raw `$…$` source as a finished preview (#569).
 */

// Minimal shape of the MathJax global used inside page.evaluate callbacks.
interface MathJaxGlobal {
  typesetClear: () => void;
  texReset: () => void;
  typesetPromise: (elements: Element[]) => Promise<void>;
  startup: {
    promise: Promise<void>;
    document: { options: Record<string, unknown> };
  };
}

type WindowWithMathJax = Window &
  typeof globalThis & { MathJax: MathJaxGlobal };

interface HostWindow extends Window {
  __hostMessages?: Array<{ command?: string }>;
}

const FIRST_LOAD_MATH_HTML =
  '<p><span class="mathjax-exps">$x^2 + y^2 = z^2$</span></p>' +
  '<div class="mathjax-exps">$$E = mc^2$$</div>';

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

const NUMBERED_DOC =
  '<p>$$\\begin{equation}\\label{eq:one}a+b=c\\end{equation}$$</p>' +
  '<p>$$\\begin{equation}\\label{eq:two}d+e=f\\end{equation}$$</p>';

function makeConfig(optionOverrides?: Record<string, unknown>) {
  const cfg = getDefaultMathjaxConfig() as Record<string, unknown>;
  cfg.tex = {
    inlineMath: [['$', '$']],
    displayMath: [['$$', '$$']],
    tags: 'ams',
  };
  cfg.startup = { typeset: false };
  if (optionOverrides) {
    cfg.options = {
      ...((cfg.options as Record<string, unknown>) || {}),
      ...optionOverrides,
    };
  }
  return cfg;
}

/**
 * Load a fresh MathJax instance into the page using the engine's real
 * `buildMathJaxConfigScript` output, then wait for startup to finish.
 */
async function loadMathJax(page: Page, config: Record<string, unknown>) {
  await page.goto(server.url);
  page.on('pageerror', (e) => {
    throw e;
  });
  await page.addScriptTag({ content: buildMathJaxConfigScript(config) });
  await page.addScriptTag({ url: `${server.url}/mathjax/tex-mml-chtml.js` });
  await page.evaluate(async () => {
    await (window as WindowWithMathJax).MathJax.startup.promise;
  });
}

/** Render the doc `rounds` times, mirroring the preview's renderMathJax. */
async function renderRounds(
  page: Page,
  html: string,
  withReset: boolean,
  rounds: number = 3,
) {
  return page.evaluate(
    async ({ html, withReset, rounds }) => {
      const MathJax = (window as WindowWithMathJax).MathJax;
      const hidden = document.getElementById('hidden')!;
      const results: { tags: string[]; errors: string[] }[] = [];
      for (let r = 0; r < rounds; r++) {
        hidden.innerHTML = html;
        if (withReset) {
          MathJax.typesetClear();
          MathJax.texReset();
        }
        await MathJax.typesetPromise([hidden]);
        // CHTML renders each equation's number inside an <mjx-labels> element,
        // e.g. "(1)".
        const tags = [...hidden.querySelectorAll('mjx-labels')]
          .map((n) => (n.textContent || '').trim())
          .filter((t) => /^\(\d+\)$/.test(t));
        const errors = [...hidden.querySelectorAll('mjx-merror')].map(
          (n) => n.getAttribute('data-mjx-error') || n.textContent || '',
        );
        results.push({ tags, errors });
        hidden.innerHTML = '';
      }
      return results;
    },
    { html, withReset, rounds },
  );
}

test('equation numbering is stable across re-renders (with typesetClear/texReset)', async ({
  page,
}) => {
  await loadMathJax(page, makeConfig());
  const rounds = await renderRounds(page, NUMBERED_DOC, true);

  for (const [i, round] of rounds.entries()) {
    expect(round.errors, `render #${i} should have no MathJax errors`).toEqual(
      [],
    );
    // Two numbered equations → tags (1) and (2), reset to the same values
    // on every render.
    expect(round.tags, `render #${i} equation numbers`).toEqual(['(1)', '(2)']);
  }
});

test('dropping typesetClear/texReset regresses numbering (guards why we keep them)', async ({
  page,
}) => {
  await loadMathJax(page, makeConfig());
  const rounds = await renderRounds(page, NUMBERED_DOC, false);

  // First render is clean; the regression shows up once the same labels are
  // typeset again without resetting MathJax's label/equation state.
  const laterErrors = rounds.slice(1).flatMap((r) => r.errors);
  expect(laterErrors.join('\n')).toMatch(/multiply defined/i);
});

test('semantic enrichment is disabled by default for performance (#2312)', async ({
  page,
}) => {
  await loadMathJax(page, makeConfig());
  await renderRounds(page, NUMBERED_DOC, true, 1);

  const state = await page.evaluate(() => {
    const MathJax = (window as WindowWithMathJax).MathJax;
    const hidden = document.getElementById('hidden')!;
    // Re-render so we can inspect the output DOM for enrichment artifacts.
    hidden.innerHTML = '<p>$$x^2 + y^2 = z^2$$</p>';
    return MathJax.typesetPromise([hidden]).then(() => ({
      enableEnrichment: MathJax.startup.document.options.enableEnrichment,
      semanticNodes: hidden.querySelectorAll(
        '[data-semantic-id], [data-semantic-speech], mjx-assistive-mml',
      ).length,
    }));
  });

  expect(state.enableEnrichment).toBe(false);
  // Enrichment off → no semantic tree / assistive MathML generated.
  expect(state.semanticNodes).toBe(0);
});

test('semantic enrichment can be re-enabled via mathjaxConfig', async ({
  page,
}) => {
  await loadMathJax(page, makeConfig({ enableEnrichment: true }));

  const enableEnrichment = await page.evaluate(() => {
    const MathJax = (window as WindowWithMathJax).MathJax;
    const hidden = document.getElementById('hidden')!;
    hidden.innerHTML = '<p>$$x^2 + y^2 = z^2$$</p>';
    return MathJax.typesetPromise([hidden]).then(
      () => MathJax.startup.document.options.enableEnrichment,
    );
  });

  // The startup.ready hook must copy the user's override onto the live
  // document (MathJax ignores it in the config block).
  expect(enableEnrichment).toBe(true);
});

/**
 * Reproduce the first-preview race: MathJax is loaded with `<script defer>`,
 * so the preview bundle can run, post `webviewFinishLoading`, and handle the
 * first `updateHtml` before `typesetClear` exists. Start the real preview
 * path first and only then inject MathJax so that race is deterministic.
 */
test('first updateHtml waits for MathJax instead of finishing as raw $…$ (#569)', async ({
  page,
}) => {
  const config = {
    mathRenderingOption: 'MathJax',
    markdownParser: 'markdown-it',
    sourceUri: 'file:///tmp/crossnote-569.md',
    enablePreviewZenMode: true,
    enablePreviewContextMenu: false,
    isVSCode: true,
  };
  const mathJaxConfig = makeConfig();
  mathJaxConfig.startup = { typeset: false, elements: ['.hidden-preview'] };

  await page.addInitScript(() => {
    const hostMessages: Array<{ command?: string }> = [];
    const hostWindow = window as unknown as HostWindow & {
      acquireVsCodeApi: () => {
        postMessage(message: unknown): void;
        getState(): unknown;
        setState(state: unknown): void;
      };
    };
    hostWindow.acquireVsCodeApi = () => ({
      postMessage: (message: unknown) => {
        hostMessages.push(message as { command?: string });
      },
      getState: () => null,
      setState: () => undefined,
    });
    hostWindow.__hostMessages = hostMessages;
  });

  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  await page.goto(server.url);
  await page.evaluate(
    ({ configJson, mathHtml }) => {
      const meta = document.createElement('meta');
      meta.id = 'crossnote-data';
      meta.setAttribute('data-config', configJson);
      document.head.appendChild(meta);
      document.body.setAttribute('data-html', mathHtml);
    },
    { configJson: JSON.stringify(config), mathHtml: FIRST_LOAD_MATH_HTML },
  );

  // Config object only — `typesetClear` is still missing, as with a slow CDN.
  await page.addScriptTag({ content: buildMathJaxConfigScript(mathJaxConfig) });
  await page.addScriptTag({ content: previewHarnessJs });

  await page.waitForSelector('[data-for="preview"] .mathjax-exps');
  await page.waitForFunction(() =>
    ((window as HostWindow).__hostMessages || []).some(
      (message) => message.command === 'webviewFinishLoading',
    ),
  );

  await page.evaluate(
    (payload) => {
      window.postMessage(payload, '*');
    },
    {
      command: 'updateHtml',
      html: FIRST_LOAD_MATH_HTML,
      id: '',
      class: '',
      totalLineCount: 3,
      tocHTML: '',
      sourceUri: config.sourceUri,
      sourceScheme: 'file',
      markdown: '$x^2 + y^2 = z^2$\n\n$$E = mc^2$$',
    },
  );

  await page.waitForSelector('[data-fore="preview"] .mathjax-exps');

  // Unfixed renderMathJax has already thrown by this point. Inject MathJax
  // so a waiter can proceed; nothing retries on the unfixed path.
  await page.addScriptTag({ url: `${server.url}/mathjax/tex-mml-chtml.js` });

  const preview = page.locator('[data-for="preview"]');
  await expect(preview.locator('mjx-container')).toHaveCount(2, {
    timeout: 8000,
  });
  await expect(preview).not.toContainText('$x^2 + y^2 = z^2$');
  await expect(preview).not.toContainText('$$E = mc^2$$');
  expect(
    consoleErrors.join('\n'),
    'typesetClear TypeError must not be swallowed into a finished raw preview',
  ).not.toMatch(/typesetClear is not a function/);
});

/**
 * When MathJax never arrives, `renderMathJax` must not hang `initEvents`
 * forever: staged HTML still has to reach the visible preview, and later
 * `updateHtml` messages must replace it. Otherwise the first-load copy from
 * `data-html` stays on screen and the refreshing icon never clears (#572).
 */
test('preview follows later edits when MathJax never becomes ready (#572)', async ({
  page,
}) => {
  const config = {
    mathRenderingOption: 'MathJax',
    markdownParser: 'markdown-it',
    sourceUri: 'file:///tmp/crossnote-572.md',
    enablePreviewZenMode: true,
    enablePreviewContextMenu: false,
    isVSCode: true,
  };
  const mathJaxConfig = makeConfig();
  mathJaxConfig.startup = { typeset: false, elements: ['.hidden-preview'] };

  const firstHtml =
    '<p>FIRST_PAINT</p>' + '<p><span class="mathjax-exps">$a+b=c$</span></p>';
  const laterHtml =
    '<p>LATER_EDIT</p>' + '<p><span class="mathjax-exps">$x+y=z$</span></p>';

  await page.addInitScript(() => {
    const hostMessages: Array<{ command?: string }> = [];
    const hostWindow = window as unknown as HostWindow & {
      acquireVsCodeApi: () => {
        postMessage(message: unknown): void;
        getState(): unknown;
        setState(state: unknown): void;
      };
    };
    hostWindow.acquireVsCodeApi = () => ({
      postMessage: (message: unknown) => {
        hostMessages.push(message as { command?: string });
      },
      getState: () => null,
      setState: () => undefined,
    });
    hostWindow.__hostMessages = hostMessages;
  });

  await page.goto(server.url);
  await page.evaluate(
    ({ configJson, mathHtml }) => {
      const meta = document.createElement('meta');
      meta.id = 'crossnote-data';
      meta.setAttribute('data-config', configJson);
      document.head.appendChild(meta);
      document.body.setAttribute('data-html', mathHtml);
    },
    { configJson: JSON.stringify(config), mathHtml: firstHtml },
  );

  // Config object only — the MathJax script is never injected, as when the
  // CDN is unreachable.
  await page.addScriptTag({ content: buildMathJaxConfigScript(mathJaxConfig) });
  await page.addScriptTag({ content: previewHarnessJs });

  await page.waitForSelector('[data-for="preview"]');
  await page.waitForFunction(() =>
    ((window as HostWindow).__hostMessages || []).some(
      (message) => message.command === 'webviewFinishLoading',
    ),
  );

  const preview = page.locator('[data-for="preview"]');
  await expect(preview).toContainText('FIRST_PAINT');

  const postUpdateHtml = (html: string, markdown: string) =>
    page.evaluate(
      (payload) => {
        window.postMessage(payload, '*');
      },
      {
        command: 'updateHtml',
        html,
        id: '',
        class: '',
        totalLineCount: 2,
        tocHTML: '',
        sourceUri: config.sourceUri,
        sourceScheme: 'file',
        markdown,
      },
    );

  await postUpdateHtml(firstHtml, '$a+b=c$');

  // Unfixed initEvents waits forever for MathJax, so the visible element
  // keeps the first-load `data-html` copy and the icon never clears.
  await expect(page.getByTestId('refreshing-icon')).toHaveCount(1);
  await expect(page.getByTestId('refreshing-icon')).toHaveCount(0, {
    timeout: 8000,
  });
  await expect(preview).toContainText('FIRST_PAINT');

  // The 4s wait is shared: a later math edit must not pay it again.
  const started = Date.now();
  await postUpdateHtml(laterHtml, '$x+y=z$');
  await expect(preview).toContainText('LATER_EDIT', { timeout: 1000 });
  expect(Date.now() - started).toBeLessThan(1000);
  await expect(preview).not.toContainText('FIRST_PAINT');
  await expect(page.getByTestId('refreshing-icon')).toHaveCount(0);
});
