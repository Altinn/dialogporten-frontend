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
    await page.waitForLoadState('networkidle');
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

  test('Shows available parties in dropdown when clicked', async ({ page }) => {
    await page.locator('#toolbar-menu-root > button').click();

    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible();

    await expect(page.locator('[role="option"][data-id="urn:altinn:organization:identifier-no:1"]')).toBeVisible(); // Firma AS
    await expect(page.locator('[role="option"][data-id="urn:altinn:organization:identifier-no:2"]')).toBeVisible(); // Testbedrift AS
    await expect(page.locator('[role="option"][data-id="urn:altinn:organization:identifier-sub:1"]')).toBeVisible(); // Testbedrift As Avd Sub
    await expect(page.locator('[role="option"][data-id="urn:altinn:organization:identifier-sub:2"]')).toBeVisible(); // Testbedrift As Avd Oslo
    await expect(page.locator('[role="option"][data-id="ALL"]')).toBeVisible(); // Alle virksomheter
  });

  test('Shows correct messages when switching to company party', async ({ page }: { page: Page }) => {
    // Open party selector and switch to Firma AS
    await page.locator('#toolbar-menu-root > button').click();
    await selectPartyFromToolbar(page, 'Firma AS');

    // Verify party switch and message visibility
    await expect(page.getByTestId('inbox-toolbar').getByRole('button', { name: 'Firma AS' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'This is a message 1 for Firma AS' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Skatten din for 2022' })).not.toBeVisible();

    // Verify URL parameters
    const url = new URL(page.url());
    expect(url.searchParams.has('party')).toBe(true);
    expect(url.searchParams.has('allParties')).toBe(false);
  });

  test('Shows correct messages when switching to sub-party', async ({ page }: { page: Page }) => {
    // Navigate to parent party
    const toolbarMenu = page.locator('#toolbar-menu-root');
    await toolbarMenu.locator('> button').click();
    await toolbarMenu.locator('[role="option"][data-id="urn:altinn:organization:identifier-no:2"]').click();
    await expect(page.getByRole('link', { name: 'This is a message 1 for Testbedrift AS', exact: true })).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'This is a message 1 for Testbedrift AS sub party AVD SUB' }),
    ).toBeVisible();

    // Navigate to parent party
    await toolbarMenu.locator('> button').click();
    await toolbarMenu.locator('[role="option"][data-id="urn:altinn:organization:identifier-sub:2"]').click();
    await expect(page.getByRole('link', { name: 'Innkalling til sesjon' })).toBeVisible();
  });

  test('Shows all messages when selecting "Alle virksomheter"', async ({ page }: { page: Page }) => {
    // Navigate to "Alle virksomheter"
    await page.locator('#toolbar-menu-root > button').click();
    await page.getByRole('option', { name: 'Alle virksomheter' }).click();

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
    await page.locator('#toolbar-menu-root > button').click();
    await page.getByRole('option', { name: 'Alle virksomheter' }).click();

    // Reload page and verify state is maintained
    await Promise.all([page.waitForLoadState('domcontentloaded'), page.reload()]);
    const urlAfterReload = new URL(page.url());
    expect(urlAfterReload.searchParams.has('party')).toBe(false);
    expect(urlAfterReload.searchParams.get('allParties')).toBe('true');
  });

  test('Correct colour theme for selected party', async ({ page }: { page: Page }) => {
    await expect(page.locator('#toolbar-menu-root')).toContainText('Test Testesen');
    await expect(page.getByRole('link', { name: 'Skatten din for 2022' })).toBeVisible();
    await expectIsPersonPage(page);

    await page.locator('#toolbar-menu-root > button').click();
    await page.getByRole('option', { name: 'Firma AS' }).click();

    await expect(page.locator('#toolbar-menu-root')).toContainText('Firma AS');

    await expectIsCompanyPage(page);
  });

  test('Searchbar input adds search params', async ({ page }: { page: Page }) => {
    expect(new URL(page.url()).searchParams.has('search')).toBe(false);

    await performSearch(page, 'skatten din', 'enter');
    const searchParams = new URL(page.url()).searchParams;
    expect(searchParams.get('search')).toBe('skatten din');

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
