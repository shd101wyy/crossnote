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

async function main() {
  try {
    if (process.argv.includes('--watch')) {
      // CommonJS
      const cjsContext = await context(cjsConfig);

      // ESM
      const esmContext = await context(esmConfig);

      await Promise.all([cjsContext.watch(), esmContext.watch()]);
    } else {
      // CommonJS
      await build(cjsConfig);

      // ESM
      await build(esmConfig);
    }
  } catch (error) {
    console.error(error);
  }
}

main();
