const { context, build } = require('esbuild');

/**
 * @type {import('esbuild').BuildOptions}
 */
const sharedConfig = {
  entryPoints: ['./src/mume.ts'],
  bundle: true,
  minify: true,
  external: [],
};

/**
 * @type {import('esbuild').BuildOptions}
 */
const cjsConfig = {
  ...sharedConfig,
  platform: 'node', // For CJS
  outfile: './out/cjs/index.js',
};

/**
 * @type {import('esbuild').BuildOptions}
 */
const esmConfig = {
  ...sharedConfig,
  // TODO: Support browser
  platform: 'node', // For ESM
  outfile: './out/esm/index.js',
};

/**
 * @type {import('esbuild').BuildOptions}
 */
const webviewConfig = {
  entryPoints: ['./src/webview/webview.ts'],
  bundle: true,
  minify: true,
  platform: 'browser',
  outfile: './out/webview/webview.js',
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

      // Webview
      await build(webviewConfig);
    }
  } catch (error) {
    console.error(error);
  }
}

main();
