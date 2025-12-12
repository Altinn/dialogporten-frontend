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

    const saveButton = page.getByRole('button', { name: 'Lagre søk' });
    await expect(saveButton).toBeVisible({ timeout: 15000 });
    await expect(saveButton).toBeEnabled();
    await saveButton.click();
    await expect(page.getByText('Søket ditt er lagret')).toBeVisible();

    await page.goto(`${baseURL}/saved-searches`);
    await expect(page.getByRole('heading', { name: '1 lagret søk' })).toBeVisible();

    const menuTrigger = page.locator('button[aria-haspopup="menu"], button[aria-expanded]').first();
    await menuTrigger.click();

    await page.getByRole('menuitem', { name: 'Rediger tittel' }).click();

    await page.getByRole('textbox', { name: 'Tittel' }).fill('test saved search');

    // Wait for the save button to be visible and enabled
    const saveButtonInModal = page.getByRole('button', { name: 'Lagre søk' });
    await expect(saveButtonInModal).toBeVisible();
    await expect(saveButtonInModal).toBeEnabled();
    await saveButtonInModal.click();

    await expect(page.getByText('Søket ditt er oppdatert')).toBeVisible();

    await expect(page.getByRole('link', { name: 'test saved search' })).toBeVisible();

    // Open context menu again and click "Slett søk"
    await menuTrigger.click();
    await page.getByRole('menuitem', { name: 'Slett søk' }).click();

    await expect(page.getByText('Søket ditt ble slettet')).toBeVisible();

    await expect(page.getByRole('main')).toContainText('Du har ingen lagrede søk');
  });
});
