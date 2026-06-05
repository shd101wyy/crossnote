import { expect, Page, test } from '@playwright/test';
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

let server: TestServer;

test.beforeAll(async () => {
  server = await startServer();
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
