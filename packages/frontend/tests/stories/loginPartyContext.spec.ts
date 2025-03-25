import { type Page, expect, test } from '@playwright/test';
import { appUrlWithPlaywrightId } from '../';
import {
  expectIsCompanyPage,
  expectIsPersonPage,
  getSearchbarInput,
  getToolbarAccountInfo,
  performSearch,
} from './common';

test.describe('LoginPartyContext', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    const dateScenarioPage = appUrlWithPlaywrightId('login-party-context');
    await page.goto(dateScenarioPage);
  });

  test('Correct messages for selected party', async ({ page }: { page: Page }) => {
    await expect(page.getByRole('link', { name: 'Skatten din for 2022' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Test Testesen' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'This is a message 1 for Firma AS' })).not.toBeVisible();
    expect(new URL(page.url()).searchParams.has('party')).toBe(false);
    expect(new URL(page.url()).searchParams.has('allParties')).toBe(false);

    await page.getByRole('button', { name: 'Test Testesen' }).click();
    const firmaAs = await getToolbarAccountInfo(page, 'Firma AS');
    expect(firmaAs.found).toEqual(true);
    expect(firmaAs.count).toEqual(1);

    const toolbar = page.getByTestId('inbox-toolbar');
    await expect(toolbar.getByText('Alle virksomheter').locator('visible=true')).toBeVisible();

    const TestBedriftAS = await getToolbarAccountInfo(page, 'Testbedrift AS');
    expect(TestBedriftAS.found).toEqual(true);
    expect(TestBedriftAS.count).toEqual(1);

    const TestBedriftASAvdSub = await getToolbarAccountInfo(page, 'Testbedrift AS Avd Sub');
    expect(TestBedriftASAvdSub.found).toEqual(true);
    expect(TestBedriftASAvdSub.count).toEqual(2);

    const TestBedriftASAvdOslo = await getToolbarAccountInfo(page, 'Testbedrift AS Avd Oslo');
    expect(TestBedriftASAvdOslo.found).toEqual(true);
    expect(TestBedriftASAvdOslo.count).toEqual(1);

    await toolbar.locator('li').locator('visible=true').filter({ hasText: 'Firma AS' }).click();
    await expect(page.getByRole('button', { name: 'Firma AS' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'This is a message 1 for Firma AS' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Skatten din for 2022' })).not.toBeVisible();
    expect(new URL(page.url()).searchParams.has('party')).toBe(true);
    expect(new URL(page.url()).searchParams.has('allParties')).toBe(false);

    await page.getByRole('button', { name: 'Firma AS' }).click();
    await page.getByRole('menu').locator('a').filter({ hasText: 'TTestbedrift AS Avd Sub2' }).click();

    await expect(page.getByRole('button', { name: 'Testbedrift AS Avd Sub' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'This is a message 1 for Firma AS' })).not.toBeVisible();
    await expect(
      page.getByRole('link', { name: 'This is a message 1 for Testbedrift AS sub party AVD SUB' }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'This is a message 2 for Testbedrift AS sub party AVD SUB' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Testbedrift AS Avd Sub' }).click();
    await page.getByRole('menu').locator('a').filter({ hasText: 'Alle virksomheter' }).click();

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

    expect(new URL(page.url()).searchParams.has('party')).toBe(false);
    expect(new URL(page.url()).searchParams.get('allParties')).toBe('true');

    await page.reload();
    expect(new URL(page.url()).searchParams.has('party')).toBe(false);
    expect(new URL(page.url()).searchParams.get('allParties')).toBe('true');
  });

  test('Correct colour theme for selected party', async ({ page }: { page: Page }) => {
    await expect(page.getByRole('link', { name: 'Skatten din for 2022' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Test Testesen' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'This is a message 1 for Firma AS' })).not.toBeVisible();

    await expectIsPersonPage(page);

    await page.getByRole('button', { name: 'Test Testesen' }).click();
    await page.getByRole('menu').locator('a').filter({ hasText: 'Firma AS' }).click();

    await expect(page.getByRole('button', { name: 'Firma AS' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'This is a message 1 for Firma AS' })).toBeVisible();

    await expectIsCompanyPage(page);
    await expect(page.getByRole('button', { name: 'Firma AS' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'This is a message 1 for Firma AS' })).toBeVisible();

    await page.reload();
    await expectIsCompanyPage(page);
    await expect(page.getByRole('button', { name: 'Firma AS' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'This is a message 1 for Firma AS' })).toBeVisible();
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
