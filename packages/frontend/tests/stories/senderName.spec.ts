import { expect, test } from '@playwright/test';
import { defaultAppURL } from '../';

test.describe('Testing Sender Name', () => {
  test('Should display sender name if provided and org if not provided', async ({ page }) => {
    const contextPage = `${defaultAppURL}&playwrightId=sender-name`;
    await page.goto(contextPage);

    const link = page.getByRole('link', { name: 'This has a sender name' });

    await expect(link).toBeVisible();
    await expect(page.getByRole('main')).toContainText('SENDER NAME Oslo Kommune to Test Testesensender');
  });

  test('If provided, sender name should be overwritten inside a dialog', async ({ page }) => {
    const contextPage = `${defaultAppURL}&playwrightId=sender-name`;
    await page.goto(contextPage);

    await page.getByRole('link', { name: 'This has a sender name' }).click();
    await expect(page.getByRole('heading', { name: 'This has a sender name defined' })).toBeVisible();
    await expect(page.getByText('SENDER NAME Oslo Kommune')).toBeVisible();
  });
});
