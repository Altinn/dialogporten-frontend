import { type Page, expect, test } from '@playwright/test';
import { defaultAppURL } from '..';
import { getToolbarAccountInfo, performSearch } from './common';

test.describe('Flattened parties and subparties', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    const flattenedPartiesPage = `${defaultAppURL}&playwrightId=subparty-merged-with-party`;
    await page.goto(flattenedPartiesPage);
  });

  test('Renders correctly', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Message for Test Testesen' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Test Testesen' })).toBeVisible();
  });

  test('Party and subparty with same name are merged as one', async ({ page }) => {
    await page.getByRole('button', { name: 'Test Testesen' }).click();
    const FirmaAS = await getToolbarAccountInfo(page, 'Firma AS');
    expect(FirmaAS.found).toEqual(true);
    expect(FirmaAS.count).toEqual(1);

    const TestBedriftAS = await getToolbarAccountInfo(page, 'Testbedrift AS');
    expect(TestBedriftAS.found).toEqual(true);
    expect(TestBedriftAS.count).toEqual(2);

    const TestBedriftASAvdOslo = await getToolbarAccountInfo(page, 'Testbedrift AS Avd Oslo');
    expect(TestBedriftASAvdOslo.found).toEqual(true);
    expect(TestBedriftASAvdOslo.count).toEqual(1);

    await page.getByRole('menu').locator('a').filter({ hasText: 'TTestbedrift AS2' }).click();

    await expect(page.getByRole('link', { name: 'Message for Test Testesen' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Testbedrift AS' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Main party message' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sub party message' })).toBeVisible();
  });

  test('Search input shows flattened messages based on chosen party', async ({ page }) => {
    const searchbarInput = page.locator("[name='Søk']");
    await searchbarInput.click();
    await expect(searchbarInput).toBeVisible();

    await searchbarInput.fill('test');
    /* search box result */
    await expect(page.getByLabel('Message for Test Testesen')).toBeVisible();
    await expect(page.getByLabel('Main party message')).not.toBeVisible();
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: 'Test Testesen' }).click();
    await page.getByRole('menu').locator('a').filter({ hasText: 'TTestbedrift AS2' }).click();

    await searchbarInput.fill('party');
    await expect(page.getByLabel('Message for Test Testesen')).not.toBeVisible();
    await expect(page.getByLabel('Main party message')).toBeVisible();
    await expect(page.getByLabel('Main party message')).toBeVisible();
  });

  test('Filters shows merged parties if sub party has same name as main party', async ({ page }) => {
    await page.getByRole('button', { name: 'Test Testesen' }).click();
    await page.getByRole('menu').locator('a').filter({ hasText: 'Alle virksomheter' }).click();
    await page.getByTestId('inbox-toolbar').getByRole('button', { name: 'add' }).click();
    await page.getByRole('menu').locator('a').filter({ hasText: 'Velg mottaker' }).click();
    await expect(page.getByRole('menu').getByText('checkboxMycompany AS Main2')).toBeVisible();
  });
});
