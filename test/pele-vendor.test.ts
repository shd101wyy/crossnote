import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import type { PeleRenderer } from '../src/lib/pele';
import { evaluatePeleBundle } from '../src/lib/pele-bundle';

/**
 * `dependencies/pele/pele.global.js` is loaded by a `<script>` tag in every
 * preview and in exported documents, and is evaluated as a script by
 * `src/renderers/pele.ts`. Nothing else checks that the file is what it claims
 * to be, so a wrong, truncated or locally modified bundle would only fail in
 * the preview. These tests guard what scripts/update-pele-bundle.mjs relies on.
 */

/**
 * SHA-256 of the official pele 1.13.0 browser build as served by jsDelivr
 * (`https://cdn.jsdelivr.net/npm/pele@1.13.0/dist/pele.global.js`, the same
 * bytes as `dist/pele.global.js` in the npm package). Update it together with
 * the file — the update script prints the new one.
 */
const VENDORED_SHA256 =
  '0b0a46c57a5a6971670c09f5ec4066705bd78505f90fd11adf6260325efa0910';

/**
 * APIs that the oldest supported webview (VS Code 1.82 / Electron 25 /
 * Chromium 114) lacks. Unlike mermaid's, pele's bundle gets no shim: an API
 * listed here must simply not be called.
 */
const FLOOR_APIS: { label: string; usage: RegExp }[] = [
  { label: 'Promise.withResolvers', usage: /Promise\.withResolvers/ },
  { label: 'Object.groupBy', usage: /Object\.groupBy/ },
  { label: 'Map.groupBy', usage: /Map\.groupBy/ },
  { label: 'Array.fromAsync', usage: /Array\.fromAsync/ },
  { label: 'URL.canParse', usage: /URL\.canParse/ },
  { label: 'Symbol.dispose', usage: /Symbol\.dispose/ },
  { label: 'Symbol.asyncDispose', usage: /Symbol\.asyncDispose/ },
];

/** The vendored build as crossnote calls it — and the class of its errors. */
type PeleGlobal = PeleRenderer & {
  PeleError: new (...args: unknown[]) => Error;
};

/** The vendored build, evaluated as `src/renderers/pele.ts` evaluates it. */
function loadPele(bundle: string): PeleGlobal {
  return evaluatePeleBundle(bundle) as PeleGlobal;
}

describe('vendored pele bundle', () => {
  const bundlePath = path.resolve(
    __dirname,
    '../dependencies/pele/pele.global.js',
  );
  const bytes = fs.readFileSync(bundlePath);
  const bundle = bytes.toString('utf8');
  const firstLine = bundle.slice(0, bundle.indexOf('\n'));
  const banner = firstLine.match(
    /^\/\*! Pele (\d+\.\d+\.\d+) \| MIT License \| https:\/\/github\.com\/obsidianmd\/pele \*\/$/,
  );

  test('is not empty or truncated', () => {
    // The official 1.13.0 build is ~734 kB. Anything far smaller means the
    // file was emptied or only partially written.
    expect(bytes.length).toBeGreaterThan(600_000);
  });

  test('is the official browser build', () => {
    // The first line is pele's version banner; the script that follows is a
    // classic (non-module) one defining the global `pele`.
    expect(banner).not.toBeNull();
    const opening = '\n"use strict";var pele=';
    expect(
      bundle.slice(firstLine.length, firstLine.length + opening.length),
    ).toBe(opening);
  });

  test('is byte-identical to the build jsDelivr serves (pinned SHA-256)', () => {
    // Pins the committed bytes to the ones that were downloaded and compared
    // with the npm package, so that a local edit or a partially written file
    // cannot ship. A pele bump updates this constant (the update script
    // prints the new digest).
    expect(crypto.createHash('sha256').update(bytes).digest('hex')).toBe(
      VENDORED_SHA256,
    );
  });

  test('is of the version documented in dependencies/README.md', () => {
    const readme = fs.readFileSync(
      path.resolve(__dirname, '../dependencies/README.md'),
      'utf8',
    );
    const documented = readme.match(/"pele":\s*"([\d.]+)"/);
    expect(documented).not.toBeNull();
    expect(banner?.[1]).toBe(documented?.[1]);
  });

  test('parses on the Node 18 runtime floor (no ES2024-only syntax)', () => {
    // The extension host of the oldest supported VS Code runs Node 18
    // (V8 10.2), which rejects newer *syntax* — e.g. the ES2024 RegExp `v`
    // flag — with a SyntaxError at parse time. `src/renderers/pele.ts`
    // evaluates this very file there. The check is strongest under the Node
    // 18 pin of CI; a newer local Node weakens (but never breaks) it.
    expect(() => new Function(bundle)).not.toThrow();
  });

  test('contains no runtime APIs newer than the webview floor', () => {
    // A bundle calling an API of a later Chromium parses everywhere but
    // throws at runtime in older webviews.
    const used = FLOOR_APIS.filter((api) => api.usage.test(bundle)).map(
      (api) => api.label,
    );
    expect(used).toEqual([]);
  });

  test('exposes render and PeleError, and renders in Node', () => {
    // The pandoc and markdown exports render pele diagrams in the Node
    // process (src/renderers/pele.ts); the package declares
    // `engines.node >= 20`, so what crossnote needs is checked here on the
    // supported Node instead.
    const pele = loadPele(bundle);
    expect(typeof pele.render).toBe('function');
    expect(typeof pele.PeleError).toBe('function');
    expect(pele.render('flowchart LR\n  A --> B').svg).toMatch(/^<svg /);
    let thrown: unknown;
    try {
      pele.render('flowchart LR\n  A --> --> B');
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(pele.PeleError);
  });

  test('draws web links and web images in Node as it does in a browser', () => {
    // pele checks `http:` and `https:` targets with `new URL(…)`. Where the
    // constructor is missing it throws no error: the diagram just comes out
    // without its links and images.
    const { svg } = loadPele(bundle).render(
      'flowchart LR\n  A[Site] --> B\n  click A "https://pele.run/" "open"\n  B --> C@{ img: "https://example.com/a.png", label: "pic" }',
    );

    expect(svg).toContain('<a href="https://pele.run/"');
    expect(svg).toContain('<image href="https://example.com/a.png"');
  });

  test('CDN fallback URL in markdown-engine matches the vendored pele', () => {
    // A non-offline HTML export loads pele from jsDelivr when the document
    // has a pele diagram; step 4 of the vendoring checklist
    // (dependencies/README.md) is a manual version edit of
    // src/markdown-engine/index.ts. The exported document draws with whatever
    // that URL serves, so it is to be the version that was verified here.
    const engine = fs.readFileSync(
      path.resolve(__dirname, '../src/markdown-engine/index.ts'),
      'utf8',
    );
    const fallback = engine.match(
      /npm\/pele@([\w.-]+)\/dist\/pele\.global\.js/,
    );
    expect(fallback).not.toBeNull();
    expect(fallback?.[1]).toBe(banner?.[1]);
  });
});
