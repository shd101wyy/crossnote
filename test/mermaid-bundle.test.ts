import * as fs from 'fs';
import * as path from 'path';

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
    // The official mermaid 11.x IIFE dist is ~3.5 MB. Anything far
    // smaller means the file was emptied or only partially written.
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
});
