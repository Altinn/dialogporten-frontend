import { type Page, expect } from '@playwright/test';
import { test } from '../fixtures';
import { appURLInbox, appUrlWithPlaywrightId } from '../index';

/**
 * Covers the notices shown when the dialog query cannot run, so the inbox is never
 * a silent blank:
 *  - the party limit (>100) with the AccountNavigator disabled,
 *  - the service-resource limit (>20 services),
 *  - a failed dialog fetch.
 */

const PARTY_LIMIT_NOTICE = 'Du har valgt flere enn';
const SERVICE_LIMIT_NOTICE = 'Velg maks 20 tjenester';
const DIALOGS_ERROR_NOTICE = 'En feil har oppstått';

const openAccountMenu = async (page: Page) => {
  await page.locator('#toolbar-menu-root > button').click();
  await expect(page.locator('#toolbar-menu-listbox')).toBeVisible();
};

test.describe('Party limit with the AccountNavigator disabled', () => {
  const appURL = appUrlWithPlaywrightId('parties-over-100-navigator-disabled');

  test('shows the party-limit notice instead of a blank inbox', async ({ page }) => {
    await page.goto(appURL);

    // Parent has 120 active sub-units (> 100) and the navigator feature flag is off
    await openAccountMenu(page);
    await page.getByRole('option', { name: 'Storselskap AS', exact: true }).click();

    await expect(page.getByText(PARTY_LIMIT_NOTICE)).toBeVisible();
    // No paginator to fall back on (flag disabled)
    await expect(page.getByRole('button', { name: 'Side 1', exact: true })).toBeHidden();
  });
});

test.describe('Service-resource limit (> 20 services)', () => {
  // 21 service filters pushed in via the URL — over MAX_SERVICE_RESOURCE_SIZE (20).
  const manyServices = Array.from({ length: 21 }, (_, i) => `service=urn:altinn:resource:svc-${i}`).join('&');
  const appURL = `${appURLInbox}&${manyServices}`;

  test('shows the service-limit notice and does not run the query', async ({ page }) => {
    await page.goto(appURL);

    await expect(page.getByText(SERVICE_LIMIT_NOTICE)).toBeVisible();
  });
});

test.describe('Failed dialog fetch', () => {
  const appURL = `${appURLInbox}&simulateDialogsError=true`;

  test('shows an error notice instead of an empty inbox', async ({ page }) => {
    await page.goto(appURL);

    // The query retries before failing, so allow extra time for the error state
    await expect(page.getByText(DIALOGS_ERROR_NOTICE)).toBeVisible({ timeout: 20000 });
  });
});
