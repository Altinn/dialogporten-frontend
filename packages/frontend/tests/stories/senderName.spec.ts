import type { Page } from '@playwright/test';
import { appUrlWithPlaywrightId } from '../';
import { expect, test } from '../fixtures';

test.describe('Testing Sender Name', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    const dateScenarioPage = appUrlWithPlaywrightId('sender-name');
    await page.goto(dateScenarioPage);
  });
  test('Should display sender name if provided and org if not provided', async ({ page }) => {
    const link = page.getByRole('link', { name: 'This has a sender name' });
    await expect(link).toBeVisible();
    await expect(page.getByRole('main')).toContainText('SENDER NAME Oslo Kommune to Test Testesensender');
  });

  test('If provided, sender name should be overwritten inside a dialog', async ({ page }) => {
    await page.getByRole('link', { name: 'This has a sender name' }).click();
    await expect(page.getByRole('heading', { name: 'This has a sender name defined' })).toBeVisible();
    await expect(page.getByText('SENDER NAME Oslo Kommune')).toBeVisible();
  });
});
