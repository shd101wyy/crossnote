/**
 * Copy files from one directory to another
 * - ./dependencies -> ./out/dependencies
 * - ./styles -> ./out/styles
 */

const fs = require('fs');

fs.cpSync('./dependencies', './out/dependencies', { recursive: true });
fs.cpSync('./styles', './out/styles', { recursive: true });
