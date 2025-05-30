import type { Page } from '@playwright/test';
import { appUrlWithPlaywrightId } from '../';
import { expect, test } from '../fixtures';

test.describe('Testing Sender Name', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    const dateScenarioPage = appUrlWithPlaywrightId('sender-name');
    await page.goto(dateScenarioPage);
  });
  test('Should display sender name if provided and org if not provided', async ({ page }) => {
    const listItem = page.getByRole('listitem').filter({ hasText: 'This has a sender name defined' });
    const timeElement = listItem.locator('time').filter({
      hasText: 'SENDER NAME Oslo Kommune',
    });

    await expect(timeElement).toHaveText('SENDER NAME Oslo Kommune til Test Testesen');
  });

  test('If provided, sender name should be overwritten inside a dialog', async ({ page }) => {
    await page.getByRole('link', { name: 'This has a sender name' }).click();
    await expect(page.getByRole('heading', { name: 'This has a sender name defined' })).toBeVisible();
    await expect(page.getByText('SENDER NAME Oslo Kommune')).toBeVisible();
  });
});
