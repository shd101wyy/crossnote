import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for the browser-backed tests under `test/browser`.
 *
 * These exercise the client-side MathJax pipeline in a real Chromium so we can
 * lock in behavior that jsdom cannot reproduce (MathJax's speech-rule-engine
 * worker, equation numbering across re-renders). Run with `pnpm test:browser`.
 *
 * In CI, Chromium is provided by `playwright install --with-deps chromium`.
 * Locally (e.g. on NixOS where Playwright's bundled Chromium can't find system
 * libs), point at a system browser via `PLAYWRIGHT_CHROMIUM_EXECUTABLE`.
 */
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined;

export default defineConfig({
  testDir: './test/browser',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    ...devices['Desktop Chrome'],
    launchOptions: executablePath ? { executablePath } : {},
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: executablePath ? { executablePath } : {},
      },
    },
  ],
});
