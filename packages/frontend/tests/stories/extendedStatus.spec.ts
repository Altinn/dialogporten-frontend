import { expect, test } from '@playwright/test';
import { defaultAppURL } from '..';

test('Should display extended status', async ({ page }) => {
  await page.goto(defaultAppURL);

  await expect(page.getByText('Extended status')).toBeVisible();
});
