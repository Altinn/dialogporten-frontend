import { expect, test } from '@playwright/test';
import { defaultAppURL } from '../';

test.describe('Front channel embed time zone', () => {
  test.use({ timezoneId: 'America/New_York' });

  test("Main content is fetched with the end user's time zone in the Prefer header", async ({ page }) => {
    await page.goto(defaultAppURL);
    await page.getByRole('link', { name: 'Skatten din for 2022' }).click();

    await expect(page.getByText('Prefer timezone: America/New_York', { exact: true })).toBeVisible();
  });
});
