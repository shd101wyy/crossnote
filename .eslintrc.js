/* eslint-env node */
module.exports = {
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  root: true,
  ignorePatterns: [
    'build.js',
    'copy-files.js',
    'compile-less.js',
    '.eslintrc.js',
    'jest.config.js',
    'prettier.config.js',
    'test.js',
    'node_modules/**',
    'out/**',
    'styles/**',
    'dependencies/**',
  ],
};
