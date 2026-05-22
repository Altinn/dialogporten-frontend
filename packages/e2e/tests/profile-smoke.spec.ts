import { expect, test } from '@playwright/test';
import { testCredentials } from '../playwright.config';
import { loginUser } from './utils/auth';

test.describe('Profile smoke tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test.afterEach(async ({ page }) => {
    await page.close();
  });

  test('should navigate to profile from inbox', async ({ page, baseURL }) => {
    await expect(page).toHaveURL(`${baseURL}/`);

    await page.goto(`${baseURL}/profile`);
    await expect(page).toHaveURL(`${baseURL}/profile`);

    await expect(page.getByRole('heading', { name: 'Dine innstillinger i Altinn' })).toBeVisible();
    await expect(page.getByText(testCredentials.expectedName).first()).toBeVisible();
    await expect(page.getByRole('searchbox')).toBeVisible();
  });
});
