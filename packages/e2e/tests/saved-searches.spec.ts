import { expect, test } from '@playwright/test';
import { loginUser } from './utils/auth';

test.describe('Saved Searches', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test.afterEach(async ({ page }) => {
    await page.close();
  });

  test('should save, edit, and delete a search', async ({ page, baseURL }) => {
    await page.getByRole('button', { name: 'Prøv ny innboks' }).click();
    await page.getByRole('button', { name: 'Close tour' }).click();

    const toolbarArea = page.getByTestId('inbox-toolbar');
    await toolbarArea.getByRole('button', { name: 'add' }).click();
    await toolbarArea.getByText('Velg avsender').locator('visible=true').click();
    await toolbarArea.getByLabel('Digitaliseringsdirektoratet').locator('visible=true').check();
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: 'Lagre søk' }).click();
    await expect(page.getByText('Søket ditt er lagret')).toBeVisible();

    await page.goto(`${baseURL}/saved-searches`);
    await expect(page.getByRole('heading', { name: '1 lagret søk' })).toBeVisible();

    await page.getByRole('button', { name: 'savedSearches.' }).click();
    await page.getByRole('textbox', { name: 'Tittel' }).fill('test saved search');
    await page.getByRole('button', { name: 'Lagre søk' }).click();

    await expect(page.getByRole('link', { name: 'test saved search' })).toBeVisible();
    await page.getByRole('button', { name: 'savedSearches.' }).click();
    await page.getByRole('button', { name: 'Slett' }).click();

    await expect(page.getByText('Søket ditt ble slettet')).toBeVisible();

    await expect(page.getByRole('main')).toContainText('Du har ingen lagrede søk');
  });
});
