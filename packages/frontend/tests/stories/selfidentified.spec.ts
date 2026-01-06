import { expect, test } from '@playwright/test';
import { appUrlWithPlaywrightId } from '../index';

test('self-identified user should be supported', async ({ page }) => {
  await page.goto(appUrlWithPlaywrightId('self-identified'));
  await expect(page.getByRole('heading', { name: 'Ikke tilgjengelig' })).toBeVisible();
});
