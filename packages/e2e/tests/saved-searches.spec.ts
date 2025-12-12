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

    await page.getByRole('button', { name: 'Lagre søk' }).click();
    await expect(page.getByText('Søket ditt er lagret')).toBeVisible();

    await page.goto(`${baseURL}/saved-searches`);
    await expect(page.getByRole('heading', { name: '1 lagret søk' })).toBeVisible();

    // Find and click the context menu trigger button (usually a three-dot or menu icon button)
    // The button should be near the saved search item
    const menuTrigger = page.locator('button[aria-haspopup="menu"], button[aria-expanded]').first();
    await menuTrigger.click();

    // Click "Rediger tittel" from the context menu
    await page.getByRole('menuitem', { name: 'Rediger tittel' }).click();

    // Fill in the title field
    await page.getByRole('textbox', { name: 'Tittel' }).fill('test saved search');

    // Save the changes
    await page.getByRole('button', { name: 'Lagre søk' }).click();

    // Wait for the update to complete
    await expect(page.getByText('Søket ditt er oppdatert')).toBeVisible();

    await expect(page.getByRole('link', { name: 'test saved search' })).toBeVisible();

    // Open context menu again and click "Slett søk"
    await menuTrigger.click();
    await page.getByRole('menuitem', { name: 'Slett søk' }).click();

    await expect(page.getByText('Søket ditt ble slettet')).toBeVisible();

    await expect(page.getByRole('main')).toContainText('Du har ingen lagrede søk');
  });
});
