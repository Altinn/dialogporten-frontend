import { expect, type Page, test } from '@playwright/test';
import { appUrlWithPlaywrightId } from '../index';
import { isPartyLimitInfoDismissed, setPartyLimitInfoDismissed } from './common';

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
    // The party-limit info modal would otherwise pop up and block these tests'
    // interactions the first time the AccountNavigator becomes visible.
    await setPartyLimitInfoDismissed(page);
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
    // The party-limit info modal would otherwise pop up and block these tests'
    // interactions the first time the AccountNavigator becomes visible.
    await setPartyLimitInfoDismissed(page);
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

test.describe('Party limit info modal', () => {
  const appURL = appUrlWithPlaywrightId('parties-over-100-mainunits');
  const MODAL_TITLE = 'Du må velge visning';
  const PERSON_ACCOUNT = 'Stortest Person';

  const selectAccount = async (page: Page, name: string) => {
    await page.locator('#toolbar-menu-root > button').click();
    await expect(page.locator('#toolbar-menu-listbox')).toBeVisible();
    await page.getByRole('option', { name, exact: true }).click();
  };

  const selectAllOrganizations = (page: Page) => selectAccount(page, 'Alle virksomheter');

  test('shows the modal when the account navigator becomes visible', async ({ page }) => {
    await page.goto(appURL);
    await expect(page.getByRole('link', { name: PERSONAL_DIALOG })).toBeVisible();

    await selectAllOrganizations(page);

    await expect(page.getByRole('heading', { name: MODAL_TITLE })).toBeVisible();
    await expect(page.getByText(/100 aktører om gangen/)).toBeVisible();
    await expect(page.getByRole('link', { name: 'muligheter og begrensninger i søk' })).toBeVisible();
  });

  test('modal does not appear when "don\'t show again" was checked earlier', async ({ page }) => {
    await setPartyLimitInfoDismissed(page);
    await page.goto(appURL);

    await selectAllOrganizations(page);

    await expect(page.getByRole('button', { name: 'Side 1', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: MODAL_TITLE })).toBeHidden();
  });

  test('closing via "Gå videre" without checking the box stores nothing, and the modal shows again on the next switch', async ({
    page,
  }) => {
    await page.goto(appURL);
    await selectAllOrganizations(page);

    await expect(page.getByRole('heading', { name: MODAL_TITLE })).toBeVisible();
    await page.getByRole('button', { name: 'Gå videre' }).click();
    await expect(page.getByRole('heading', { name: MODAL_TITLE })).toBeHidden();
    expect(await isPartyLimitInfoDismissed(page)).toBe(false);

    await selectAccount(page, PERSON_ACCOUNT);
    await expect(page.getByRole('link', { name: PERSONAL_DIALOG })).toBeVisible();

    await selectAllOrganizations(page);
    await expect(page.getByRole('heading', { name: MODAL_TITLE })).toBeVisible();
  });

  test('does not show the modal again when paging or returning from a message within the same selection', async ({
    page,
  }) => {
    await page.goto(appURL);
    await selectAllOrganizations(page);

    await expect(page.getByRole('heading', { name: MODAL_TITLE })).toBeVisible();
    await page.getByRole('button', { name: 'Gå videre' }).click();
    await expect(page.getByRole('heading', { name: MODAL_TITLE })).toBeHidden();

    await page.getByRole('button', { name: 'Side 1', exact: true }).click();
    await page.getByRole('link', { name: 'Virksomhet melding i innboks' }).click();
    await page.getByRole('link', { name: 'Tilbake' }).click();

    await expect(page.getByRole('link', { name: 'Virksomhet melding i innboks' })).toBeVisible();
    await expect(page.getByRole('heading', { name: MODAL_TITLE })).toBeHidden();
  });

  test('checking "don\'t show again" stores the choice in localStorage and keeps the modal hidden on later switches', async ({
    page,
  }) => {
    await page.goto(appURL);
    await selectAllOrganizations(page);

    await expect(page.getByRole('heading', { name: MODAL_TITLE })).toBeVisible();
    await page.getByRole('checkbox', { name: 'Ikke vis denne meldingen igjen' }).check();
    await page.getByRole('button', { name: 'Gå videre' }).click();
    await expect(page.getByRole('heading', { name: MODAL_TITLE })).toBeHidden();
    expect(await isPartyLimitInfoDismissed(page)).toBe(true);

    await selectAccount(page, PERSON_ACCOUNT);
    await expect(page.getByRole('link', { name: PERSONAL_DIALOG })).toBeVisible();

    await selectAllOrganizations(page);
    await expect(page.getByRole('button', { name: 'Side 1', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: MODAL_TITLE })).toBeHidden();
  });
});
