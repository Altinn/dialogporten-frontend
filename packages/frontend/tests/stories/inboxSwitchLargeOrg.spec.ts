import { expect } from '@playwright/test';
import { test } from '../fixtures';
import { appUrlWithPlaywrightId } from '../index';

/**
 * Regression tests for the bug where the inbox kept showing the previously
 * selected view's dialogs ("henger igjen") when switching to a context whose
 * party list exceeds MAX_DIALOG_PARTY_SIZE (100). In that case the dialog
 * query is disabled and keepPreviousData held the old dialogs, while the
 * inbox wrongly considered the limit not reached and rendered them.
 *
 * Switching must clear the stale dialogs and surface the AccountNavigator
 * (page selection) instead.
 */

const PERSONAL_DIALOG = 'Personlig melding i innboks';

test.describe('Switching to a main org with > 100 sub-units', () => {
  const appURL = appUrlWithPlaywrightId('parties-over-100-subunits');

  test('clears the previous view’s dialogs and shows page navigation', async ({ page }) => {
    await page.goto(appURL);

    // Personal inbox shows the person's dialog
    await expect(page.getByRole('link', { name: PERSONAL_DIALOG })).toBeVisible();

    // Switch to the parent organization (120 sub-units → query exceeds 100)
    await page.locator('#toolbar-menu-root > button').click();
    await expect(page.locator('#toolbar-menu-listbox')).toBeVisible();
    await page.getByRole('option', { name: 'Storselskap AS', exact: true }).click();

    // The stale personal dialog must no longer be shown
    await expect(page.getByRole('link', { name: PERSONAL_DIALOG })).toBeHidden();

    // The AccountNavigator prompts the user to pick a page
    await expect(page.getByRole('button', { name: 'Side 1', exact: true })).toBeVisible();
  });

  test('selecting a page loads that page’s dialogs', async ({ page }) => {
    await page.goto(appURL);
    await page.locator('#toolbar-menu-root > button').click();
    await expect(page.locator('#toolbar-menu-listbox')).toBeVisible();
    await page.getByRole('option', { name: 'Storselskap AS', exact: true }).click();

    await page.getByRole('button', { name: 'Side 1', exact: true }).click();

    // Page 1 covers the parent + first sub-units, which includes the sub-unit dialog
    await expect(page.getByRole('link', { name: 'Underenhet melding i innboks' })).toBeVisible();
    await expect(page.getByRole('link', { name: PERSONAL_DIALOG })).toBeHidden();
  });
});

test.describe('Switching to all organizations with > 100 main units', () => {
  const appURL = appUrlWithPlaywrightId('parties-over-100-mainunits');

  test('clears the previous view’s dialogs and shows page navigation', async ({ page }) => {
    await page.goto(appURL);

    await expect(page.getByRole('link', { name: PERSONAL_DIALOG })).toBeVisible();

    // Switch to "Alle virksomheter" (120 orgs → query exceeds 100)
    await page.locator('#toolbar-menu-root > button').click();
    await expect(page.locator('#toolbar-menu-listbox')).toBeVisible();
    await page.getByRole('option', { name: 'Alle virksomheter' }).click();

    await expect(page).toHaveURL(/allParties=true/);
    await expect(page.getByRole('link', { name: PERSONAL_DIALOG })).toBeHidden();
    await expect(page.getByRole('button', { name: 'Side 1', exact: true })).toBeVisible();
  });

  test('selecting a page loads that page’s dialogs', async ({ page }) => {
    await page.goto(appURL);
    await page.locator('#toolbar-menu-root > button').click();
    await expect(page.locator('#toolbar-menu-listbox')).toBeVisible();
    await page.getByRole('option', { name: 'Alle virksomheter' }).click();

    await page.getByRole('button', { name: 'Side 1', exact: true }).click();

    await expect(page.getByRole('link', { name: 'Virksomhet melding i innboks' })).toBeVisible();
    await expect(page.getByRole('link', { name: PERSONAL_DIALOG })).toBeHidden();
  });
});
