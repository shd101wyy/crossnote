/** @type {import('jest').Config} */
module.exports = {
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.{ts,tsx,js}'],
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  transform: {
    '\\.m?[tj]sx?$': ['babel-jest', { configFile: './babel-jest.config.js' }],
  },
  transformIgnorePatterns: ['/node_modules/'],
  roots: ['test'],
  testMatch: ['**/?(*.)(spec|test).(j|t)s?(x)'],
  // Browser tests under test/browser run with Playwright (`pnpm test:browser`),
  // not jest — they need a real Chromium to exercise MathJax typesetting.
  testPathIgnorePatterns: ['/node_modules/', '/test/browser/'],
  testEnvironment: 'node',
};
