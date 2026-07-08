import { expect } from '@playwright/test';
import { test } from '../fixtures';
import { appUrlWithPlaywrightId } from '../index';
import { setOrgLimitInfoDismissedCookie } from './common';

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

  test.beforeEach(async ({ page }) => {
    // The org-limit info modal would otherwise pop up and block these tests'
    // interactions the first time the AccountNavigator becomes visible.
    await setOrgLimitInfoDismissedCookie(page);
  });

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

  test.beforeEach(async ({ page }) => {
    // The org-limit info modal would otherwise pop up and block these tests'
    // interactions the first time the AccountNavigator becomes visible.
    await setOrgLimitInfoDismissedCookie(page);
  });

  test('clears the previous view’s dialogs and shows page navigation', async ({ page }) => {
    await page.goto(appURL);

    await expect(page.getByRole('link', { name: PERSONAL_DIALOG })).toBeVisible();

    // Switch to "Alle virksomheter" (120 orgs → query exceeds 100)
    await page.locator('#toolbar-menu-root > button').click();
    await expect(page.locator('#toolbar-menu-listbox')).toBeVisible();
    await page.getByRole('option', { name: 'Alle virksomheter' }).click();

    await expect(page).toHaveURL(/group=ALL_COMPANIES/);
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

test.describe('Org limit info modal', () => {
  const appURL = appUrlWithPlaywrightId('parties-over-100-mainunits');
  const MODAL_TITLE = 'Før du går videre …';

  const openAccountNavigator = async (page: import('@playwright/test').Page) => {
    await page.locator('#toolbar-menu-root > button').click();
    await expect(page.locator('#toolbar-menu-listbox')).toBeVisible();
    await page.getByRole('option', { name: 'Alle virksomheter' }).click();
  };

  test('shows the modal the first time the account navigator becomes visible', async ({ page }) => {
    await page.goto(appURL);
    await expect(page.getByRole('link', { name: PERSONAL_DIALOG })).toBeVisible();

    await openAccountNavigator(page);

    await expect(page.getByRole('heading', { name: MODAL_TITLE })).toBeVisible();
    await expect(page.getByText(/120 virksomheter/)).toBeVisible();
    await expect(page.getByText(/100 om gangen/)).toBeVisible();
  });

  test('modal does not appear when the dismissal cookie is already set', async ({ page }) => {
    await setOrgLimitInfoDismissedCookie(page);
    await page.goto(appURL);

    await openAccountNavigator(page);

    await expect(page.getByRole('heading', { name: MODAL_TITLE })).toBeHidden();
  });

  test('closing via "Gå videre" without checking the box does not set a permanent cookie, and does not reopen within the same session', async ({
    page,
  }) => {
    await page.goto(appURL);
    await openAccountNavigator(page);

    await expect(page.getByRole('heading', { name: MODAL_TITLE })).toBeVisible();
    await page.getByRole('button', { name: 'Gå videre' }).click();
    await expect(page.getByRole('heading', { name: MODAL_TITLE })).toBeHidden();

    const cookies = await page.context().cookies();
    expect(cookies.find((c) => c.name === 'AltinnOrgLimitInfoDismissed')).toBeUndefined();

    // Re-triggering within the same session (sessionStorage survives in-page navigation) does not reopen it
    await page.goto(appURL);
    await openAccountNavigator(page);
    await expect(page.getByRole('heading', { name: MODAL_TITLE })).toBeHidden();
  });

  test('checking "don\'t show again" and closing sets a permanent cookie', async ({ page }) => {
    await page.goto(appURL);
    await openAccountNavigator(page);

    await expect(page.getByRole('heading', { name: MODAL_TITLE })).toBeVisible();
    await page.getByRole('checkbox', { name: 'Ikke vis denne meldingen igjen' }).check();
    await page.getByRole('button', { name: 'Gå videre' }).click();

    const cookies = await page.context().cookies();
    const dismissCookie = cookies.find((c) => c.name === 'AltinnOrgLimitInfoDismissed');
    expect(dismissCookie?.value).toBe('true');
  });

  test('closing via the header close button behaves like session-only dismissal (no cookie set)', async ({ page }) => {
    await page.goto(appURL);
    await openAccountNavigator(page);

    await expect(page.getByRole('heading', { name: MODAL_TITLE })).toBeVisible();
    await page.getByRole('button', { name: 'Lukk' }).click();
    await expect(page.getByRole('heading', { name: MODAL_TITLE })).toBeHidden();

    const cookies = await page.context().cookies();
    expect(cookies.find((c) => c.name === 'AltinnOrgLimitInfoDismissed')).toBeUndefined();
  });
});
