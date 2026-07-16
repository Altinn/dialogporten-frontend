import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';

config();

// Specs that put heavy load on the browser (e.g. 15 000 mock parties, long multi-step
// flows) — isolated into their own project/worker, see `playwright-heavy` below.
const HEAVY_SPECS = ['**/partiesExtreme.spec.ts', '**/savedSearchParties.spec.ts'];

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/stories',
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 3 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 15000,
  reporter: 'html',
  use: {
    browserName: 'firefox',
    defaultBrowserType: 'firefox',
    locale: 'nb-NO',
    timezoneId: 'Europe/Oslo',
    trace: 'on-first-retry',
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL,
    screenshot: 'only-on-failure',
    headless: true,
    bypassCSP: true,
    launchOptions: {
      args: ['--disable-web-security'],
    },
  },
  testMatch: '**/*.{spec,test}.{js,ts}',
  projects: [
    {
      name: 'playwright',
      // Heavy specs run in their own project (own browser process/worker) so their
      // memory/CPU footprint doesn't degrade the rest of the suite sharing one
      // long-lived browser process under `workers: 1` on CI.
      testIgnore: HEAVY_SPECS,
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'playwright-mobile',
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'playwright-heavy',
      testMatch: HEAVY_SPECS,
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
