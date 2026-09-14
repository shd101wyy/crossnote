#!/usr/bin/env node
// `require.main === module` inside out/cli/index.cjs is false on this path
// (this bin is the main module), so main() has to be called from here.
require('../out/cli/index.cjs')
  .main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
