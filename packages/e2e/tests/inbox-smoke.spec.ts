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
    await expect(page.getByRole('link', { name: 'Testdriver for Arbeidsflate' }).first()).toBeVisible();
    await page.getByRole('link', { name: 'Testdriver for Arbeidsflate' }).first().click();
    await expect(page.getByRole('button', { name: 'Gå til skjemautfylling' })).toBeVisible();
    await expect(page).toHaveURL(`${baseURL}/inbox/0198acd7-23aa-7140-9884-57228990faa1/`);
  });
});
