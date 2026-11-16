import * as fs from 'fs';
import * as path from 'path';
import { MERMAID_LEGACY_WEBVIEW_POLYFILL } from '../src/markdown-engine/mermaid-polyfill';

/**
 * The vendored mermaid bundle was accidentally committed as a 0-byte file
 * by an unrelated PR (a failed `wget -O` truncates its output file), and
 * nothing caught it because the file is never exercised by unit tests.
 * Guard the invariants that scripts/update-mermaid-bundle.mjs relies on,
 * so an empty or truncated bundle fails CI instead of shipping.
 */
describe('vendored mermaid bundle', () => {
  const bundlePath = path.resolve(
    __dirname,
    '../dependencies/mermaid/mermaid.min.js',
  );
  const bundle = fs.readFileSync(bundlePath, 'utf8');
  const trimmed = bundle.trimEnd();

  test('is not empty or truncated', () => {
    // The official mermaid 12.x IIFE dist is ~5.5 MB (11.x was ~3.5 MB).
    // Anything far smaller means the file was emptied or only partially
    // written.
    expect(bundle.length).toBeGreaterThan(3_000_000);
  });

  test('is the official IIFE dist build', () => {
    expect(
      trimmed.startsWith('"use strict";var __esbuild_esm_mermaid_nm'),
    ).toBe(true);
    expect(
      trimmed.endsWith(
        'globalThis["mermaid"] = globalThis.__esbuild_esm_mermaid_nm["mermaid"].default;',
      ),
    ).toBe(true);
  });

  test('parses on the Node 18 runtime floor (no ES2024-only syntax)', () => {
    // The extension host of the oldest supported VS Code runs Node 18
    // (V8 10.2), which rejects newer *syntax* — e.g. the ES2024 RegExp
    // `v` flag mermaid's ES2024 target could emit — with a SyntaxError at
    // parse time. The bundle only ever executes in the browser, but
    // Node-side tooling reads, embeds, and serves the file, so it must
    // stay parseable there. The check is strongest under the Node 18 pin
    // of CI; a newer local Node weakens (but never breaks) it.
    expect(() => new Function(trimmed)).not.toThrow();
  });

  test('contains no ES2024 runtime APIs newer than the webview floor', () => {
    // The oldest supported VS Code (1.82) renders webviews with
    // Electron 25 / Chromium 114. The ES2024 APIs below only shipped in
    // Chromium 116–121: a bundle calling any of them parses everywhere
    // but throws at runtime in older webviews — unless the API is
    // polyfilled ahead of the bundle (MERMAID_LEGACY_WEBVIEW_POLYFILL is
    // emitted immediately before every mermaid script tag).
    const polyfilled = new Set(['Object.groupBy (needs Chromium 117)']);
    const chromium116PlusApis: [string, RegExp][] = [
      ['Promise.withResolvers (needs Chromium 119)', /Promise\.withResolvers/],
      ['Object.groupBy (needs Chromium 117)', /Object\.groupBy/],
      ['Map.groupBy (needs Chromium 117)', /Map\.groupBy/],
      ['Array.fromAsync (needs Chromium 121)', /Array\.fromAsync/],
    ];
    const used = chromium116PlusApis
      .filter(
        (entry: [string, RegExp]) =>
          entry[1].test(bundle) && !polyfilled.has(entry[0]),
      )
      .map((entry: [string, RegExp]) => entry[0]);
    expect(used).toEqual([]);
  });

  test('the legacy-webview polyfill defines Object.groupBy per spec', () => {
    // Simulate the Chromium 114 webview: no native Object.groupBy. Run the
    // exact script body that is emitted before the mermaid bundle and
    // check the grouping semantics chevrotain relies on.
    const body = MERMAID_LEGACY_WEBVIEW_POLYFILL.replace(
      /^<script>/,
      '',
    ).replace(/<\/script>$/, '');
    const objectWithGroupBy = Object as unknown as {
      groupBy?: unknown;
      create: (proto: null) => Record<string, unknown>;
    };
    const saved = objectWithGroupBy.groupBy;
    delete objectWithGroupBy.groupBy;
    try {
       
      new Function(body)();
      const grouped = (
        objectWithGroupBy.groupBy as (
          items: number[],
          callbackfn: (item: number, index: number) => string,
        ) => Record<string, number[]>
      )([6, 4, 7, 2], (n) => (n % 2 ? 'odd' : 'even'));
      // Spec: the result has a null prototype.
      expect(Object.getPrototypeOf(grouped)).toBe(null);
      expect(Object.keys(grouped).sort()).toEqual(['even', 'odd']);
      expect(grouped.odd).toEqual([7]);
      expect(grouped.even).toEqual([6, 4, 2]);
      // The callback receives the index (spec: (value, index)).
      const indices: number[] = [];
      (
        objectWithGroupBy.groupBy as (
          items: string[],
          callbackfn: (item: string, index: number) => string,
        ) => Record<string, string[]>
      )(['a', 'b'], (_item, index) => {
        indices.push(index);
        return 'all';
      });
      expect(indices).toEqual([0, 1]);
    } finally {
      if (saved === undefined) {
        delete objectWithGroupBy.groupBy;
      } else {
        objectWithGroupBy.groupBy = saved;
      }
    }
  });

  test('CDN fallback URL in markdown-engine matches the installed mermaid', () => {
    // Step 3 of the vendoring checklist (dependencies/README.md) is a
    // manual version edit of src/markdown-engine/index.ts; this keeps a
    // mermaid bump that skips it from shipping mismatched CDN versions.
    const engine = fs.readFileSync(
      path.resolve(__dirname, '../src/markdown-engine/index.ts'),
      'utf8',
    );
    const fallback = engine.match(
      /npm\/mermaid@([\w.-]+)\/dist\/mermaid\.min\.js/,
    );
    expect(fallback).not.toBeNull();
    const installed = JSON.parse(
      fs.readFileSync(
        path.resolve(__dirname, '../node_modules/mermaid/package.json'),
        'utf8',
      ),
    ) as { version: string };
    expect(fallback?.[1]).toBe(installed.version);
  });
});
