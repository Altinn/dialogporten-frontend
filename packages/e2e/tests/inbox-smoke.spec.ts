import { expect, test } from '@playwright/test';
import { loginUser } from './utils/auth';

test.describe('Inbox smoke tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test.afterEach(async ({ page }) => {
    await page.close();
  });

  test('should load inbox correctly', async ({ page, baseURL }) => {
    await expect(page).toHaveURL(`${baseURL}/`);
  });

  test('should fetch dialogs and open correctly', async ({ page, baseURL }) => {
    await page.getByRole('button', { name: 'Prøv ny innboks' }).click();
    await page.getByRole('button', { name: 'Close tour' }).click();

    await expect(page.getByRole('link', { name: 'BACK OFF! Dette er en' })).toBeVisible();
    await page.getByRole('link', { name: 'BACK OFF! Dette er en' }).click();

    await expect(page).toHaveURL(`${baseURL}/inbox/0198cc16-d75d-75ad-b6bc-2337d64363dd/`);
    await expect(page.getByText('Digitaliseringsdirektoratettil Konditor Ustabil')).toBeVisible();

    await expect(page.getByRole('button', { name: 'Flytt til arkivet' })).toBeVisible();
  });
});
