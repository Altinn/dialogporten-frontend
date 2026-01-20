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

    // Step 1: Open the add filter dropdown
    const addButton = toolbarArea.getByRole('button', { name: 'add' });
    await expect(addButton).toBeVisible();
    await addButton.click();

    // Step 2: Select sender filter option
    const senderOption = toolbarArea.getByText('Velg avsender').locator('visible=true');
    await expect(senderOption).toBeVisible();
    await senderOption.click();

    // Step 3: Wait for sender dropdown to be visible and select organization
    const orgFilter = page.getByTestId('filter-base-toolbar-filter-org');
    await expect(orgFilter).toBeVisible();

    const digitaliseringsdirektoratet = orgFilter
      .locator('span')
      .filter({ hasText: 'Digitaliseringsdirektoratet' })
      .nth(1);
    await expect(digitaliseringsdirektoratet).toBeVisible();
    await digitaliseringsdirektoratet.click();

    // Step 4: Close dropdown and wait for filter to be applied
    await page.keyboard.press('Escape');

    // Wait for save button to appear (indicates filter state has updated)
    const saveButton = toolbarArea.getByRole('button', { name: 'Lagre søk' });
    // Wait for save button to appear (indicates filter state has updated)
    const undoSaveButton = toolbarArea.getByRole('button', { name: 'Lagret søk' });

    // Step 5: Check button state and handle accordingly
    try {
      // Check if undoSaveButton is visible
      await expect(undoSaveButton).toBeVisible({ timeout: 2000 });
      // If undoSaveButton is visible, click it and wait for saveButton
      await undoSaveButton.click();
      await expect(saveButton).toBeVisible({ timeout: 5000 });
    } catch {
      // If undoSaveButton is not visible, saveButton should be available
      await expect(saveButton).toBeVisible({ timeout: 5000 });
    }
    
    // Save the search
    await saveButton.click();
    const successMessage = page.getByText('Søket ditt er lagret');
    await expect(successMessage).toBeVisible({ timeout: 10000 });

    // Wait for success message to disappear before continuing
    await expect(successMessage).not.toBeVisible({ timeout: 10000 });

    // Step 6: Navigate to saved searches page
    await page.goto(`${baseURL}/saved-searches`);

    // Step 7: Verify saved search appears
    await expect(page.locator('#main-content')).toContainText('1 lagret søk', { timeout: 10000 });

    // Step 8: Open saved search menu
    const menuButton = page.getByRole('button', { name: 'Open menu-saved-search-' });
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    // Step 9: Edit search title (first time)
    const editTitleLink = page.locator('a').filter({ hasText: 'Rediger tittel' });
    await expect(editTitleLink).toBeVisible();
    await editTitleLink.click();

    const titleTextbox = page.getByRole('textbox', { name: 'Tittel' });
    await expect(titleTextbox).toBeVisible();
    await titleTextbox.click();
    await titleTextbox.fill('test');

    const saveEditButton = page.getByRole('button', { name: 'Lagre søk' });
    await saveEditButton.click();

    // Step 10: Open menu again and edit title (second time)
    const menuButton2 = page.getByRole('button', { name: 'Open menu-saved-search-' });
    await expect(menuButton2).toBeVisible();
    await menuButton2.click();

    const editTitleLink2 = page.locator('a').filter({ hasText: 'Rediger tittel' });
    await expect(editTitleLink2).toBeVisible();
    await editTitleLink2.click();

    const titleTextbox2 = page.getByRole('textbox', { name: 'Tittel' });
    await expect(titleTextbox2).toBeVisible();
    await titleTextbox2.fill('hei');

    const saveEditButton2 = page.getByRole('button', { name: 'Lagre søk' });
    await expect(saveEditButton2).toBeEnabled();
    await saveEditButton2.click();

    // Step 11: Delete the saved search
    const menuButton3 = page.getByRole('button', { name: 'Open menu-saved-search-' });
    await expect(menuButton3).toBeVisible();
    await menuButton3.click();

    const deleteLink = page.locator('a').filter({ hasText: 'Slett søk' });
    await expect(deleteLink).toBeVisible();
    await deleteLink.click();

    // Step 12: Verify deletion
    const deleteMessage = page.getByText('Søket ditt ble slettet');
    await expect(deleteMessage).toBeVisible({ timeout: 10000 });
  });
});
