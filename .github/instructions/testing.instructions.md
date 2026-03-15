---
description: Testing guidelines for the crossnote project
globs: ["test/**", "src/**"]
---

# Testing Guidelines

## Running Tests

- `pnpm test` — run all tests without coverage
- `pnpm test:coverage` — run with coverage report
- `npx jest path/to/test.ts --no-coverage` — run a specific test file

## Test Structure

- Tests go in `test/` directory, mirroring `src/` structure
- Use Jest's `describe`/`test` (or `it`) blocks
- Prefer data-driven tests when testing many similar cases
- For markdown transformation tests, use `.md` and `.expect.md` file pairs in `test/markdown/test-files/`

## Writing Tests

```typescript
import { functionToTest } from "../src/module";

describe("functionToTest", () => {
  it("should handle the expected case", () => {
    expect(functionToTest(input)).toBe(expected);
  });
});
```

## Test Environment

- Test environment is `node` (jest.config.js)
- Transforms use babel-jest with the config in `babel-jest.config.js`
- For tests that need a Notebook instance, use `Notebook.init()` with a test directory

## Before Submitting

Always run the full check suite: `pnpm check && pnpm test`
