import { expect, test } from '@playwright/test';
import { appUrlWithPlaywrightId, defaultAppURL } from '../';

test.describe('Bankruptcy dialogs group', () => {
  test('Bankruptcy group NOT present if no bankruptcy dialogs', async ({ page }) => {
    await page.goto(defaultAppURL);

    await expect(page.getByRole('link', { name: 'Bankruptcy title 1' })).not.toBeVisible();
    await expect(page.getByRole('link', { name: 'Bankruptcy title 2' })).not.toBeVisible();
  });

  test('Bankruptcy group present with bankruptcy dialogs', async ({ page }) => {
    await page.goto(appUrlWithPlaywrightId('bankruptcy'));

    await expect(page.getByRole('link', { name: 'Bankruptcy title 1' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Bankruptcy title 2' })).toBeVisible();
  });
});
