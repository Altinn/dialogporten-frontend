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
    const toolbarArea = page.getByTestId('inbox-toolbar');
    await toolbarArea.getByRole('button', { name: 'add' }).click();
    await toolbarArea.getByText('Velg avsender').locator('visible=true').click();
    await page
      .getByTestId('filter-base-toolbar-filter-org')
      .locator('span')
      .filter({ hasText: 'Digitaliseringsdirektoratet' })
      .nth(1)
      .click();

    await page.keyboard.press('Escape');

    const saveButton = toolbarArea.getByRole('button', { name: 'Lagre søk' });
    await expect(saveButton).toBeVisible({ timeout: 20000 });
    await expect(saveButton).toBeEnabled();
    await saveButton.click();
    await expect(page.getByText('Søket ditt er lagret')).toBeVisible();
    await page.getByTestId('sidebar-saved-searches').click();

    await expect(page.locator('#main-content')).toContainText('1 lagret søk');

    await page.getByRole('button', { name: 'Open menu-saved-search-' }).click();
    await page.locator('a').filter({ hasText: 'Rediger tittel' }).click();
    await page.getByRole('textbox', { name: 'Tittel' }).click();
    await page.getByRole('textbox', { name: 'Tittel' }).fill('test');
    await page.getByRole('button', { name: 'Lagre søk' }).click();
    await page.getByRole('button', { name: 'Open menu-saved-search-' }).click();

    await page.locator('a').filter({ hasText: 'Rediger tittel' }).click();
    await page.getByRole('textbox', { name: 'Tittel' }).fill('hei');
    await page.getByRole('button', { name: 'Lagre søk' }).click();

    await page.getByRole('button', { name: 'Open menu-saved-search-' }).click();
    await page.locator('a').filter({ hasText: 'Slett søk' }).click();
    await expect(page.getByText('Søket ditt ble slettet')).toBeVisible();
  });
});
