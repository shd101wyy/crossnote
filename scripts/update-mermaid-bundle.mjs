/**
 * Download the official mermaid IIFE bundle from jsDelivr into
 * `dependencies/mermaid/mermaid.min.js`.
 *
 * The vendored file must be mermaid's own dist build (it sets up the
 * `__esbuild_esm_mermaid_nm` wrapper and the trailing
 * `globalThis["mermaid"] = ...` assignment) — do not re-bundle mermaid
 * locally with esbuild; regenerate it from the official CDN instead so
 * the bytes match what mermaid ships.
 *
 * Full update procedure (also documented in dependencies/README.md):
 *   1. `pnpm add mermaid@<version>`          # updates package.json + lockfile
 *   2. `node scripts/update-mermaid-bundle.mjs`
 *   3. Update the CDN fallback version string in src/markdown-engine/index.ts
 *   4. Update dependencies/README.md + CHANGELOG.md
 *
 * Usage: `node scripts/update-mermaid-bundle.mjs [version]`
 * `version` defaults to the `mermaid` entry in package.json.
 */
import * as fs from 'fs';
import * as path from 'path';

const CDN_HOST = 'cdn.jsdelivr.net';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
// Resolve the exact version: prefer what is actually installed (node_modules
// holds the pinned resolution of the package.json range), so range operators
// like `^11.17.2` never leak into the URL.
function resolveVersion() {
  if (process.argv[2]) return process.argv[2];
  try {
    const installed = JSON.parse(
      fs.readFileSync('node_modules/mermaid/package.json', 'utf8'),
    );
    if (installed.version) return installed.version;
  } catch {
    // fall through to package.json below
  }
  const range = pkg.dependencies?.mermaid;
  return range?.replace(/^[^\d]+/, ''); // strip '^', '~', etc.
}
const version = resolveVersion();
if (!version) {
  console.error('No mermaid version found in package.json dependencies');
  process.exit(1);
}

// Security: https only, and the host must be the exact public CDN host
// (never localhost/loopback/private/reserved addresses).
const url = new URL(
  `https://${CDN_HOST}/npm/mermaid@${encodeURIComponent(version)}/dist/mermaid.min.js`,
);
if (
  url.protocol !== 'https:' ||
  url.hostname !== CDN_HOST ||
  /^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|::1|\[?fc|fd)/i.test(
    url.hostname,
  )
) {
  throw new Error(`Refusing to fetch from unexpected host: ${url.hostname}`);
}

console.log(`Downloading ${url} ...`);
const response = await fetch(url, {
  redirect: 'error',
  headers: { 'user-agent': 'crossnote-bundle-updater' },
});
if (!response.ok) {
  throw new Error(`Download failed: HTTP ${response.status}`);
}
const bundle = await response.text();

// Sanity checks: the official dist bundle is an IIFE with the
// __esbuild_esm_mermaid_nm wrapper and the globalThis assignment at the end.
const trimmed = bundle.trimEnd();
if (
  !trimmed.startsWith('"use strict";var __esbuild_esm_mermaid_nm') ||
  !trimmed.endsWith(
    'globalThis["mermaid"] = globalThis.__esbuild_esm_mermaid_nm["mermaid"].default;',
  )
) {
  throw new Error(
    'Downloaded file does not look like the official mermaid IIFE dist bundle',
  );
}

const outfile = path.resolve('dependencies/mermaid/mermaid.min.js');
fs.writeFileSync(outfile, bundle.endsWith('\n') ? bundle : `${bundle}\n`);
console.log(
  `mermaid ${version} bundle written to ${outfile} (${bundle.length} bytes)`,
);
