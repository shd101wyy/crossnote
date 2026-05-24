const { context, build } = require('esbuild');
const { dependencies, devDependencies } = require('./package.json');
const { tailwindPlugin } = require('esbuild-plugin-tailwindcss');
const fs = require('fs');

/**
 * Node.js builtins that esbuild-plugin-polyfill-node provides *empty*
 * polyfills for — if any of these are imported by the ESM library
 * bundle, downstream browser consumers will fail to bundle.
 */
const BROWSER_UNSAFE_IMPORTS = ['crypto'];

function verifyEsmForBrowser(esmPath) {
  const content = fs.readFileSync(esmPath, 'utf8');
  // Match named imports: `import { X } from "mod"`.  Namespace imports
  // (`import * as X from "mod"`) are safe because the empty polyfill
  // exports an empty module, so accessing mod.randomBytes is undefined
  // at runtime (which the D2 renderer already guards against).
  const regex = /import\s*\{([^}]*)\}\s*from\s*["']([^"']+)["']/g;
  let match;
  const found = new Set();
  while ((match = regex.exec(content)) !== null) {
    const mod = match[2];
    const names = match[1].split(',').map((s) => s.trim());
    if (BROWSER_UNSAFE_IMPORTS.includes(mod)) {
      for (const name of names) {
        if (name && !name.startsWith('//')) {
          found.add(`${name} from ${mod}`);
        }
      }
    }
  }
  if (found.size > 0) {
    const list = [...found].join(', ');
    throw new Error(
      `ESM bundle has named imports from browser-unsafe Node.js builtins: ${list}. ` +
        'These will cause esbuild-plugin-polyfill-node failures in browser builds. ' +
        'Replace with browser-compatible alternatives or wrap in an is-browser guard.',
    );
  }
}

/**
 * @type {import('esbuild').BuildOptions}
 */
const sharedConfig = {
  entryPoints: ['./src/index.ts'],
  bundle: true,
  minify: true,
  // sourcemap: true,
  external: [
    'fs',
    'module',
    'path',
    'child_process',
    'os',
    'crypto',
    'vm',
    'stream',
    'node:fs/promises',
    'url',
    // === from package.json
    ...Object.keys(dependencies),
    ...Object.keys(devDependencies),
  ],
};

/**
 * @type {import('esbuild').BuildOptions}
 */
const cjsConfig = {
  ...sharedConfig,
  platform: 'node', // For CJS
  outfile: './out/cjs/index.cjs',
  target: 'node16',
};

/**
 * @type {import('esbuild').BuildOptions}
 */
const esmConfig = {
  ...sharedConfig,
  // TODO: Support browser
  platform: 'neutral', // For ESM
  outfile: './out/esm/index.mjs',
};

/**
 * @type {import('esbuild').BuildOptions}
 */
const webviewConfig = {
  entryPoints: [
    './src/webview/preview.tsx',
    './src/webview/backlinks.tsx',
    './src/webview/graph-view.tsx',
  ],
  bundle: true,
  minify: true,
  platform: 'browser',
  // outfile: './out/webview/index.js',
  outdir: './out/webview',
  loader: {
    '.png': 'dataurl',
    '.woff': 'dataurl',
    '.woff2': 'dataurl',
    '.eot': 'dataurl',
    '.ttf': 'dataurl',
    '.svg': 'dataurl',
  },
  plugins: [tailwindPlugin({})],
};

async function main() {
  try {
    if (process.argv.includes('--watch')) {
      // CommonJS
      const cjsContext = await context({
        ...cjsConfig,
        sourcemap: true,
      });

      // ESM
      const esmContext = await context({
        ...esmConfig,
        sourcemap: true,
      });

      // Webview
      const webviewContext = await context({
        ...webviewConfig,
        sourcemap: true,
      });

      await Promise.all([
        cjsContext.watch(),
        esmContext.watch(),
        webviewContext.watch(),
      ]);
    } else {
      // CommonJS
      await build(cjsConfig);

      // ESM
      await build(esmConfig);

      // Verify the ESM bundle is safe for browser consumers
      verifyEsmForBrowser('./out/esm/index.mjs');

      // Webview
      await build(webviewConfig);
    }
  } catch (error) {
    console.error(error);
  }
}

main();
