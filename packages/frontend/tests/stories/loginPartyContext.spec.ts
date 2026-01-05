import type { Page } from '@playwright/test';
import { appUrlWithPlaywrightId } from '../';
import { expect, test } from '../fixtures';
import {
  expectIsCompanyPage,
  expectIsPersonPage,
  getSearchbarInput,
  getToolbarAccountInfo,
  performSearch,
  selectPartyFromToolbar,
} from './common';

test.describe('LoginPartyContext', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    const dateScenarioPage = appUrlWithPlaywrightId('login-party-context');
    await page.goto(dateScenarioPage);
  });

  test('Shows correct messages for person party by default', async ({ page }: { page: Page }) => {
    // Verify initial state - person party selected by default
    await expect(page.getByRole('link', { name: 'Skatten din for 2022' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Test Testesen' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'This is a message 1 for Firma AS' })).not.toBeVisible();

    // Verify URL parameters
    const url = new URL(page.url());
    expect(url.searchParams.has('party')).toBe(false);
    expect(url.searchParams.has('allParties')).toBe(false);
  });

  test('Shows available parties in dropdown when clicked', async ({ page }: { page: Page }) => {
    // Open party selector
    await page.getByTestId('account-menu-button').click();

    // Verify all expected parties are available
    const expectedParties = [
      'Firma AS',
      'Testbedrift AS',
      'Testbedrift AS Avd Sub',
      'Testbedrift AS Avd Oslo',
      'Alle virksomheter',
    ];

    for (const partyName of expectedParties) {
      const party = await getToolbarAccountInfo(page, partyName);
      expect(party.found).toEqual(true);
    }

    const toolbar = page.getByTestId('inbox-toolbar');
    await expect(toolbar.locator('a').filter({ hasText: 'Alle virksomheter' })).toBeVisible();
  });

  test('Shows correct messages when switching to company party', async ({ page }: { page: Page }) => {
    // Open party selector and switch to Firma AS
    await page.getByTestId('account-menu-button').click();
    await selectPartyFromToolbar(page, 'Firma AS');

    // Verify party switch and message visibility
    await expect(page.getByRole('button', { name: 'Firma AS', exact: true }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'This is a message 1 for Firma AS' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Skatten din for 2022' })).not.toBeVisible();

    // Verify URL parameters
    const url = new URL(page.url());
    expect(url.searchParams.has('party')).toBe(true);
    expect(url.searchParams.has('allParties')).toBe(false);
  });

  test('Shows correct messages when switching to sub-party', async ({ page }: { page: Page }) => {
    // Navigate to parent party
    await page.getByTestId('account-menu-button').click();
    await selectPartyFromToolbar(page, 'Testbedrift AS');
    await expect(page.getByRole('link', { name: 'This is a message 1 for' })).toBeVisible();

    // Navigate to parent party
    await page.getByTestId('account-menu-button').click();
    await selectPartyFromToolbar(page, 'Testbedrift As Avd Oslo');
    await expect(page.getByRole('link', { name: 'This is a message 1 for' })).not.toBeVisible();
    await expect(page.getByRole('link', { name: 'Innkalling til sesjon' })).toBeVisible();
  });

  test('Shows all messages when selecting "Alle virksomheter"', async ({ page }: { page: Page }) => {
    // Navigate to "Alle virksomheter"
    await page.getByTestId('account-menu-button').click();
    await page.locator('a').filter({ hasText: 'TTT5Alle virksomheter' }).click();

    // Verify all company messages are visible (but not person messages)
    await expect(page.getByRole('link', { name: 'Skatten din for 2022' })).not.toBeVisible();
    await expect(page.getByRole('link', { name: 'This is a message 1 for Firma AS' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'This is a message 1 for Testbedrift AS', exact: true })).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'This is a message 1 for Testbedrift AS sub party AVD SUB' }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'This is a message 2 for Testbedrift AS sub party AVD SUB' }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Innkalling til sesjon' })).toBeVisible();

    // Verify URL parameters
    const url = new URL(page.url());
    expect(url.searchParams.has('party')).toBe(false);
    expect(url.searchParams.get('allParties')).toBe('true');
  });

  test('Maintains party selection after page reload', async ({ page }: { page: Page }) => {
    // Navigate to "Alle virksomheter"
    await page.getByTestId('account-menu-button').click();
    await page.locator('a').filter({ hasText: 'TTT5Alle virksomheter' }).click();
    // Reload page and verify state is maintained
    await page.reload();
    const urlAfterReload = new URL(page.url());
    expect(urlAfterReload.searchParams.has('party')).toBe(false);
    expect(urlAfterReload.searchParams.get('allParties')).toBe('true');
  });

  test('Correct colour theme for selected party', async ({ page }: { page: Page }) => {
    await expect(page.getByTestId('account-menu-button')).toContainText('Test Testesen');
    await expect(page.getByRole('link', { name: 'Skatten din for 2022' })).toBeVisible();
    await expectIsPersonPage(page);

    await page.getByTestId('account-menu-button').click();
    await page.locator('a').filter({ hasText: 'FFirma ASOrg. nr. :' }).click();
    await expect(page.getByTestId('account-menu-button')).toContainText('Firma AS');
    await expectIsCompanyPage(page);

    await page.reload();
    await expectIsCompanyPage(page);
  });

  test('Searchbar input adds search params', async ({ page }: { page: Page }) => {
    expect(new URL(page.url()).searchParams.has('search')).toBe(false);

    await performSearch(page, 'skatten din', 'enter');
    const searchParams = new URL(page.url()).searchParams;
    expect(searchParams.get('search')).toBe('skatten din');

    await expect(page.getByRole('link', { name: 'Skatten din for 2022' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Melding om bortkjøring av snø' })).not.toBeVisible();

    await page.reload();
    await expect(page.getByRole('link', { name: 'Skatten din for 2022' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Melding om bortkjøring av snø' })).not.toBeVisible();
  });

  test('Go-back button deletes search bar value', async ({ page }: { page: Page }) => {
    await performSearch(page, 'skatten din', 'enter');
    const searchParams = new URL(page.url()).searchParams;
    expect(searchParams.get('search')).toBe('skatten din');
    await expect(page.getByRole('link', { name: 'Skatten din for 2022' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Melding om bortkjøring av snø' })).not.toBeVisible();

    await page.goBack();
    const updatedSearchParams = new URL(page.url()).searchParams;
    expect(updatedSearchParams.has('search')).toBe(false);
    await expect(getSearchbarInput(page)).toBeEmpty();

    await expect(page.getByRole('link', { name: 'Melding om bortkjøring av snø' })).toBeVisible();
  });
});
