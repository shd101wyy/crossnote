/**@type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  root: true,
  ignorePatterns: [
    'build.js',
    'gulpfile.js',
    'tailwind.config.js',
    '.eslintrc.js',
    'jest.config.js',
    'prettier.config.js',
    'test.js',
    'node_modules/**',
    'out/**',
    'styles/**',
    'dependencies/**',
    'src/prism/prism.js',
  ],
};
