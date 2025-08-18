import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';

config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/stories',
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 15000,
  reporter: 'html',
  use: {
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
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'playwright-mobile',
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'accessibility',
      testDir: './tests/accessibility',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: process.env.PLAYWRIGHT_TEST_BASE_URL,
    timeout: 120000,
    reuseExistingServer: !process.env.CI,
  },
});
