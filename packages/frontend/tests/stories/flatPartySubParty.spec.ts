import type { Page } from '@playwright/test';
import { appUrlWithPlaywrightId } from '..';
import { expect, test } from '../fixtures';
import { getToolbarAccountInfo } from './common';

test.describe('Flattened parties and subparties', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    const flattenedPartiesPage = appUrlWithPlaywrightId('subparty-merged-with-party');
    await page.goto(flattenedPartiesPage);
  });

  test('Renders correctly', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Message for Test Testesen' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Test Testesen' }).first()).toBeVisible();
  });

  test('Party and subparty with same name are merged as one', async ({ page }) => {
    await page.getByRole('button', { name: 'Test Testesen' }).first().click();
    const FirmaAS = await getToolbarAccountInfo(page, 'Firma AS');
    expect(FirmaAS.found).toEqual(true);

    const TestBedriftAS = await getToolbarAccountInfo(page, 'Testbedrift AS');
    expect(TestBedriftAS.found).toEqual(true);

    const TestBedriftASAvdOslo = await getToolbarAccountInfo(page, 'Testbedrift AS Avd Oslo');
    expect(TestBedriftASAvdOslo.found).toEqual(true);

    await page
      .getByTestId('inbox-toolbar')
      .getByRole('group')
      .locator('a')
      .filter({ hasText: /^TTestbedrift AS$/ })
      .click();

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

    await expect(page.getByRole('banner').getByRole('menuitem', { name: 'Message for Test Testesen' })).toBeVisible();
    await expect(page.getByRole('banner').getByRole('menuitem', { name: 'Main party message' })).not.toBeVisible();

    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: 'Test Testesen' }).first().click();
    await page
      .getByTestId('inbox-toolbar')
      .getByRole('group')
      .locator('a')
      .filter({ hasText: /^TTestbedrift AS$/ })
      .click();

    await searchbarInput.fill('party');
    await expect(page.getByLabel('Message for Test Testesen')).not.toBeVisible();
    await expect(page.getByRole('banner').getByRole('menuitem', { name: 'Main party message' })).toBeVisible();
  });

  test('Filters shows merged parties if sub party has same name as main party', async ({ page }) => {
    await page.getByRole('button', { name: 'Test Testesen' }).first().click();
    await page
      .getByTestId('inbox-toolbar')
      .getByRole('group')
      .locator('a')
      .filter({ hasText: 'Alle virksomheter' })
      .click();

    await page.getByTestId('inbox-toolbar').getByRole('button', { name: 'add' }).click();
    await page
      .getByTestId('inbox-toolbar')
      .getByRole('group')
      .locator('a')
      .filter({ hasText: 'Velg avsender' })
      .click();

    await expect(
      page.getByTestId('filter-base-toolbar-filter-org').locator('span').filter({ hasText: 'Oslo kommune' }).nth(1),
    ).toBeVisible();
  });
});
