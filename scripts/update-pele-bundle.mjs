/**
 * Download pele's official browser build from jsDelivr into
 * `dependencies/pele/pele.global.js`.
 *
 * The vendored file is loaded by a `<script>` tag in the preview and in
 * exported documents, where it defines the global `pele`, and is evaluated as
 * a script by the Node-side renderer (`src/renderers/pele.ts`). Do not
 * re-bundle pele locally: the committed file is byte-identical to the CDN
 * file, and `test/pele-vendor.test.ts` pins its SHA-256.
 *
 * Full update procedure (also documented in dependencies/README.md):
 *   1. `node scripts/update-pele-bundle.mjs <version>`
 *   2. Put the printed SHA-256 into test/pele-vendor.test.ts
 *   3. Update the `pele` version in the version list of dependencies/README.md
 *   4. Update the CDN fallback version string in src/markdown-engine/index.ts
 *   5. Add a CHANGELOG.md entry
 *
 * Usage: `node scripts/update-pele-bundle.mjs [version]`
 * Without a version, the one of the vendored file is fetched again.
 */
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as vm from 'vm';

const CDN_HOST = 'cdn.jsdelivr.net';
const outfile = path.resolve('dependencies/pele/pele.global.js');

/**
 * The version named in the first line of the build, a "Pele x.y.z | MIT
 * License" comment.
 */
const bannerOf = (bundle) => bundle.match(/^\/\*! Pele (\d+\.\d+\.\d+) \|/);

const vendored = fs.existsSync(outfile)
  ? fs.readFileSync(outfile, 'utf8')
  : '';
const version = process.argv[2] ?? bannerOf(vendored)?.[1];
if (!version) {
  console.error(
    'No version given and none found in dependencies/pele/pele.global.js',
  );
  process.exit(1);
}

// Security: https only, and the host must be the exact public CDN host
// (never localhost/loopback/private/reserved addresses).
const url = new URL(
  `https://${CDN_HOST}/npm/pele@${encodeURIComponent(version)}/dist/pele.global.js`,
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

// Sanity checks: the file is pele's browser build of the requested version —
// the banner names the version, and the script that follows defines `pele` —
// and it still runs where crossnote evaluates it. Run this in the Node 18
// dev shell (nix develop) to check the extension-host floor too: a bundle
// that needs a newer Node or a newer syntax fails here instead of in a
// release.
if (bannerOf(bundle)?.[1] !== version) {
  throw new Error(
    `Downloaded file is not the Pele ${version} browser build: its first line is ${JSON.stringify(bundle.slice(0, 120))}`,
  );
}
if (!/^"use strict";var pele=/m.test(bundle.slice(0, 200))) {
  throw new Error(
    'Downloaded file does not define the global `pele` (expected `"use strict";var pele=` after the banner)',
  );
}
const pele = vm.runInNewContext(`${bundle}\n;pele`, {}, {
  filename: 'pele.global.js',
});
if (typeof pele?.render !== 'function' || typeof pele.PeleError !== 'function') {
  throw new Error('Downloaded file does not expose `render` and `PeleError`');
}
if (!pele.render('flowchart LR\n  A --> B').svg.startsWith('<svg')) {
  throw new Error('Downloaded file does not render a diagram in Node');
}

fs.writeFileSync(outfile, bundle);
console.log(
  `pele ${version} bundle written to ${outfile} (${bundle.length} bytes, sha256 ${crypto.createHash('sha256').update(bundle).digest('hex')})`,
);
