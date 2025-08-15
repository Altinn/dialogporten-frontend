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
    await expect(page).toHaveURL(`${baseURL}/inbox/0197abb7-bf17-70f9-84d3-c7bee2d96612/`);
  });
});
