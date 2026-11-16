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

/**
 * Chromium-116+ APIs that the oldest supported webview (VS Code 1.82 /
 * Electron 25 / Chromium 114) lacks. An API the bundle uses must not
 * appear here as a violation unless MERMAID_LEGACY_WEBVIEW_POLYFILL
 * literally contains its defining assignment (`defines`) — so an API can
 * only be exempted by shipping a shim that defines it, and removing the
 * shim re-flagges the API. Behavior of each shim is covered by the
 * polyfill tests below.
 */
interface FloorApi {
  label: string;
  usage: RegExp;
  /** Matches the shim's defining assignment in the polyfill script. */
  defines?: RegExp;
}

const FLOOR_APIS: FloorApi[] = [
  { label: 'Promise.withResolvers', usage: /Promise\.withResolvers/ },
  {
    label: 'Object.groupBy',
    usage: /Object\.groupBy/,
    defines: /Object\.groupBy\s*=/,
  },
  { label: 'Map.groupBy', usage: /Map\.groupBy/ },
  { label: 'Array.fromAsync', usage: /Array\.fromAsync/ },
];

describe('vendored mermaid bundle', () => {
  const bundlePath = path.resolve(
    __dirname,
    '../dependencies/mermaid/mermaid.min.js',
  );
  const bundle = fs.readFileSync(bundlePath, 'utf8');
  const trimmed = bundle.trimEnd();
  const polyfillBody = MERMAID_LEGACY_WEBVIEW_POLYFILL.replace(
    /^<script>/,
    '',
  ).replace(/<\/script>$/, '');

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

  test('contains no ES2024 runtime APIs newer than the webview floor, except polyfilled ones', () => {
    // A bundle calling a Chromium-116+ API parses everywhere but throws
    // at runtime in older webviews — unless the API is defined by
    // MERMAID_LEGACY_WEBVIEW_POLYFILL, which is emitted immediately
    // before every mermaid script tag.
    const used = FLOOR_APIS.filter(
      (api) =>
        api.usage.test(bundle) &&
        !(api.defines && api.defines.test(polyfillBody)),
    ).map((api) => api.label);
    expect(used).toEqual([]);
  });

  test('the polyfill defines Object.groupBy per spec', () => {
    // The exact script body that is emitted before the mermaid bundle,
    // checked for the grouping semantics chevrotain relies on.
    const objectWithGroupBy = Object as unknown as {
      groupBy?: unknown;
    };
    const saved = objectWithGroupBy.groupBy;
    delete objectWithGroupBy.groupBy;
    try {
       
      new Function(polyfillBody)();
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

  test('the polyfill is emitted before the bundle at the preview load site', () => {
    // The preview/presentation path (generateScriptsForPreview) emits
    // consecutive append statements in source order; the export path is
    // covered end-to-end by test/html-export-offline-embed.test.ts. The
    // preview path is the first mermaid.min.js reference in the file, so
    // nothing may load the bundle before the polyfill.
    const engine = fs.readFileSync(
      path.resolve(__dirname, '../src/markdown-engine/index.ts'),
      'utf8',
    );
    const previewPolyfillAt = engine.indexOf(
      'scripts += MERMAID_LEGACY_WEBVIEW_POLYFILL;',
    );
    expect(previewPolyfillAt).toBeGreaterThanOrEqual(0);
    const firstBundleAt = engine.indexOf(
      './dependencies/mermaid/mermaid.min.js',
    );
    expect(firstBundleAt).toBeGreaterThan(previewPolyfillAt);
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
