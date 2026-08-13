import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';

config();

const PERF_SPECS = ['**/partiesExtreme.spec.ts'];

// Specs that put heavy load on the browser (long multi-step flows) — run as their own
// invocation via `test:playwright:heavy`, not alongside the main project.
const HEAVY_SPECS = ['**/savedSearchParties.spec.ts'];

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/stories',
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // The Vite dev server is the shared bottleneck, not the browser: parallel workers starve it and
  // assertions time out across unrelated specs. CI therefore runs one worker per shard, with each
  // shard on its own runner and its own dev server (cf. workflow-playwright-test.yml).
  workers: process.env.CI ? 1 : 3,
  timeout: 30000,
  expect: { timeout: 10000 },
  reporter: 'html',
  use: {
    locale: 'nb-NO',
    timezoneId: 'Europe/Oslo',
    trace: 'on-first-retry',
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL,
    screenshot: 'only-on-failure',
    headless: true,
  },
  testMatch: '**/*.{spec,test}.{js,ts}',
  projects: [
    {
      name: 'playwright',
      testIgnore: [...HEAVY_SPECS, ...PERF_SPECS],
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'playwright-heavy',
      testMatch: HEAVY_SPECS,
      fullyParallel: false,
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'playwright-perf',
      testMatch: PERF_SPECS,
      fullyParallel: false,
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'accessibility',
      testDir: './tests/accessibility',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: process.env.PLAYWRIGHT_TEST_BASE_URL,
    timeout: 120000,
    reuseExistingServer: !process.env.CI,
  },
});
