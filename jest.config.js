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
  testEnvironment: 'node',
};
