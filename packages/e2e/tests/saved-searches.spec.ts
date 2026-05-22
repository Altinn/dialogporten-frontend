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
    // Login + filter setup + (optional) leftover cleanup + save/edit/delete easily exceeds the 30s default.
    test.setTimeout(90_000);
    const toolbarArea = page.getByTestId('inbox-toolbar');

    // Step 1: Apply a sender filter so the toolbar exposes "Lagre søk"
    await toolbarArea.getByRole('button', { name: /legg til/i }).click();
    await toolbarArea
      .getByRole('menuitem', { name: /(Tjenesteeier|Avsender)/i })
      .first()
      .click();
    await page.locator('li').filter({ hasText: 'Digitaliseringsdirektoratet' }).nth(1).click();
    await page.keyboard.press('Escape');

    // Step 2: Open the save modal. If a matching saved search already exists from a previous run,
    // the toolbar shows "Lagret søk" (edit modal) — delete it first so we start clean.
    const undoSaveButton = toolbarArea.getByRole('button', { name: 'Lagret søk' });
    if (await undoSaveButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await undoSaveButton.click();
      await page.getByRole('dialog').getByRole('button', { name: 'Slett søk' }).click();
      await expect(page.getByText('Søket ditt ble slettet')).toBeVisible({ timeout: 10000 });
    }
    await toolbarArea.getByRole('button', { name: 'Lagre søk' }).click();

    // Step 3: Fill title in the modal and submit
    const saveDialog = page.getByRole('dialog');
    await expect(saveDialog).toBeVisible();
    await saveDialog.getByRole('textbox', { name: 'Gi søket et navn' }).fill('e2e test search');
    await saveDialog.getByRole('button', { name: 'Lagre søk' }).click();

    const savedSuccess = page.getByText('Søket ditt er lagret');
    await expect(savedSuccess).toBeVisible({ timeout: 10000 });
    await expect(savedSuccess).not.toBeVisible({ timeout: 10000 });

    // Step 4: Navigate to saved-searches page and verify it appears
    await page.goto(`${baseURL}/profile/saved-searches`);
    await expect(page.locator('#main-content')).toContainText('Personlige søk', { timeout: 10000 });
    await expect(page.getByText('e2e test search').first()).toBeVisible();

    // Step 5: Edit the title via the per-item menu (label changed: "Rediger tittel" → "Endre navn").
    // Each menu item is a <li role="menuitem"> wrapping a <button role="menuitem"> with the same
    // accessible name, so scope to the button to avoid strict-mode collisions.
    await page.getByRole('button', { name: 'Åpne meny' }).first().click();
    await page.locator('button[role="menuitem"]', { hasText: 'Endre navn' }).click();

    const editDialog = page.getByRole('dialog');
    const editTitle = editDialog.getByRole('textbox', { name: 'Gi søket et navn' });
    await expect(editTitle).toBeVisible();
    await editTitle.fill('e2e test search renamed');
    await editDialog.getByRole('button', { name: 'Lagre', exact: true }).click();

    await expect(page.getByText('e2e test search renamed').first()).toBeVisible({ timeout: 10000 });

    // Step 6: Delete via menu and verify
    await page.getByRole('button', { name: 'Åpne meny' }).first().click();
    await page.locator('button[role="menuitem"]', { hasText: 'Slett søk' }).click();
    await expect(page.getByText('Søket ditt ble slettet')).toBeVisible({ timeout: 10000 });
  });
});
