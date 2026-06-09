import { type Page, expect } from '@playwright/test';
import { test } from '../fixtures';
import { appUrlWithPlaywrightId } from '../index';

/**
 * Regression tests for the bug where deleted sub-units were counted toward
 * MAX_DIALOG_PARTY_SIZE (100) even though they are hidden from the user
 * (shouldShowDeletedEntities = false). getPartyIds() re-derived the query URNs
 * from each parent's subParties without filtering deleted ones, so the count
 * sent to the API exceeded 100 while the visible list stayed under it — the
 * dialog query was silently disabled and the inbox went blank.
 *
 * After the fix, deleted sub-units are excluded from the query party set, so it
 * matches the visible list and the dialogs load.
 */

const PARENT_DIALOG = 'Melding til hovedenhet';
const SUBUNIT_DIALOG = 'Melding til STORSELSKAP AVD 001';
const PARTY_LIMIT_NOTICE = 'Du har valgt flere enn';

const openAccountMenu = async (page: Page) => {
  await page.locator('#toolbar-menu-root > button').click();
  await expect(page.locator('#toolbar-menu-listbox')).toBeVisible();
};

test.describe('"Alle virksomheter" with deleted sub-units (parties-over-100-with-deleted-subunits)', () => {
  // Parent + 98 active + 4 deleted sub-units. Visible = 99, but the unfixed query counted 103.
  const appURL = appUrlWithPlaywrightId('parties-over-100-with-deleted-subunits');

  test('loads dialogs instead of a blank inbox (deleted sub-units not counted)', async ({ page }) => {
    await page.goto(appURL);

    await openAccountMenu(page);
    await page.getByRole('option', { name: 'Alle virksomheter' }).click();
    await expect(page).toHaveURL(/group=ALL_COMPANIES/);

    // 99 parties ≤ 100 → the query runs and the dialogs show
    await expect(page.getByRole('link', { name: PARENT_DIALOG })).toBeVisible();
    await expect(page.getByRole('link', { name: SUBUNIT_DIALOG })).toBeVisible();

    // Under the limit: no party-limit notice and no page navigation
    await expect(page.getByText(PARTY_LIMIT_NOTICE)).toBeHidden();
    await expect(page.getByRole('button', { name: 'Side 1', exact: true })).toBeHidden();
  });
});

test.describe('Single parent with deleted sub-units (party-parent-with-deleted-subunits)', () => {
  // Parent + 80 active + 40 deleted sub-units. Visible = 81, but the unfixed query counted 121.
  const appURL = appUrlWithPlaywrightId('party-parent-with-deleted-subunits');

  test('loads dialogs instead of a blank inbox (deleted sub-units not counted)', async ({ page }) => {
    await page.goto(appURL);

    await openAccountMenu(page);
    await page.getByRole('option', { name: 'Storselskap AS', exact: true }).click();

    // 81 parties ≤ 100 → the query runs and the dialogs show
    await expect(page.getByRole('link', { name: PARENT_DIALOG })).toBeVisible();
    await expect(page.getByRole('link', { name: SUBUNIT_DIALOG })).toBeVisible();

    await expect(page.getByText(PARTY_LIMIT_NOTICE)).toBeHidden();
    await expect(page.getByRole('button', { name: 'Side 1', exact: true })).toBeHidden();
  });
});
