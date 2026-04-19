export default {
  // Run prettier on all files it can format
  '**/*': ['prettier --write --ignore-unknown'],
  // Run ESLint + tsc on TypeScript files.
  // ESLint receives the specific staged files; tsc always checks the full
  // project (it cannot operate on individual files in isolation).
  '**/*.{ts,tsx}': (files) => [
    `eslint --fix ${files.join(' ')}`,
    'tsc --noEmit --project .',
  ],
};
