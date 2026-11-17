import { expect, type Locator, type Page, test } from '@playwright/test';
import { loginUser } from './utils/auth';

const SENDER = 'Digitaliseringsdirektoratet';
const SAVED_SEARCH_PATH = '/?org=digdir';

const openSavedSearchesPage = async (page: Page) => {
  await page.goto('/profile/saved-searches');
  const main = page.locator('#main-content');
  await expect(
    main
      .getByText('Ingen lagrede søk')
      .or(main.getByRole('button', { name: 'Åpne meny' }))
      .first(),
  ).toBeVisible({ timeout: 10_000 });
};

const savedSearchItem = (page: Page, name: string) =>
  page.getByRole('listitem').filter({ has: page.getByRole('heading', { name, exact: true }) });

const openItemMenu = async (page: Page, item: Locator, action: string) => {
  await item.getByRole('button', { name: 'Åpne meny' }).click();
  await page.locator('button[role="menuitem"]').filter({ hasText: action, visible: true }).click();
};

test.describe('Saved Searches', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test.afterEach(async ({ page }) => {
    await page.close();
  });

  test('should save, edit, and delete a search', async ({ page, baseURL }) => {
    test.setTimeout(90_000);
    const name = `e2e test search ${Date.now()}`;
    const renamed = `${name} renamed`;
    const searchesWithSenderFilter = page
      .getByRole('listitem')
      .filter({ has: page.locator(`a[href="${SAVED_SEARCH_PATH}"]`) });

    await openSavedSearchesPage(page);
    for (let remaining = await searchesWithSenderFilter.count(); remaining > 0; remaining--) {
      await openItemMenu(page, searchesWithSenderFilter.first(), 'Slett søk');
      await expect(searchesWithSenderFilter).toHaveCount(remaining - 1, { timeout: 10_000 });
    }

    await page.goto('/');
    const toolbarArea = page.getByTestId('inbox-toolbar');
    await toolbarArea.getByRole('button', { name: /legg til/i }).click();
    await toolbarArea.locator('#tool-filter-add').getByRole('menuitem', { name: 'Tjenesteeier' }).click();
    await page.getByRole('option', { name: SENDER, exact: true }).click();
    await page.keyboard.press('Escape');
    await expect(page).toHaveURL(`${baseURL}${SAVED_SEARCH_PATH}`);

    await toolbarArea.getByRole('button', { name: 'Lagre søk', exact: true }).click();
    const saveDialog = page.getByRole('dialog');
    await saveDialog.getByRole('textbox', { name: 'Gi søket et navn' }).fill(name);
    await saveDialog.getByRole('button', { name: 'Lagre søk' }).click();
    await expect(toolbarArea.getByRole('button', { name: 'Lagret søk', exact: true })).toBeVisible({
      timeout: 10_000,
    });

    await openSavedSearchesPage(page);
    await expect(savedSearchItem(page, name)).toHaveCount(1);
    await openItemMenu(page, savedSearchItem(page, name), 'Endre navn');
    const editDialog = page.getByRole('dialog');
    await editDialog.getByRole('textbox', { name: 'Gi søket et navn' }).fill(renamed);
    await editDialog.getByRole('button', { name: 'Lagre', exact: true }).click();
    await expect(savedSearchItem(page, renamed)).toHaveCount(1, { timeout: 10_000 });

    await openItemMenu(page, savedSearchItem(page, renamed), 'Slett søk');
    await expect(searchesWithSenderFilter).toHaveCount(0, { timeout: 10_000 });
  });
});
