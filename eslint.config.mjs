import eslint from '@eslint/js';
import globals from 'globals';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // Global ignores (replaces .eslintignore)
  {
    ignores: [
      'build.js',
      'gulpfile.js',
      'tailwind.config.js',
      'eslint.config.mjs',
      'jest.config.js',
      'test.js',
      'node_modules/**',
      'out/**',
      'styles/**',
      'dependencies/**',
      'src/prism/prism.js',
      'postcss.config.js',
      'babel-jest.config.js',
      'ts_test.ts',
    ],
  },

  // Base recommended rules
  eslint.configs.recommended,
  tseslint.configs.recommended,

  // Node.js globals for all non-webview TypeScript files
  {
    files: ['src/**/*.ts', 'test/**/*.ts'],
    ignores: ['src/webview/**'],
    languageOptions: {
      globals: globals.node,
    },
  },

  // Browser + React for webview files
  {
    files: ['src/webview/**/*.{ts,tsx}'],
    plugins: {
      react: pluginReact,
      'react-hooks': pluginReactHooks,
    },
    settings: {
      react: { version: 'detect' },
    },
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      ...pluginReact.configs.flat['jsx-runtime'].rules,
      // Classic rules only (skip React Compiler rules new in v7)
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // Custom rules for all TypeScript files
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // Require type annotations on function parameters
      '@typescript-eslint/typedef': ['error', { parameter: true }],
    },
  },
);
