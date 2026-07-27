import { expect, test } from '@playwright/test';
import { PageRoutes } from '../../src/pages/routes';
import { defaultAppURL } from '../';
import { getSidebarMenuItem } from './common';

test.describe('DialogDetailsPage', () => {
  test('GUI action with isAuthorized=false is visible but disabled', async ({ page }) => {
    await page.goto(defaultAppURL);
    await page.getByRole('link', { name: 'Skatten din for 2022' }).click();
    const button = page.getByRole('button', { name: 'Til skjema' });
    await expect(button).toBeVisible();
    await expect(button).toBeDisabled();
  });

  test('Check message opening, archiving and deleting', async ({ page }) => {
    const archiveLink = getSidebarMenuItem(page, PageRoutes.archive);
    const binLink = getSidebarMenuItem(page, PageRoutes.bin);

    await page.goto(defaultAppURL);
    await expect(page.locator('h2').filter({ hasText: /^Skatten din for 2022$/ })).toBeVisible();
    await page.getByRole('link', { name: 'Skatten din for 2022' }).click();

    await page
      .locator('h2')
      .filter({ hasText: /^Grunnleggende konsepter fra markdown$/ })
      .waitFor();
    await expect(page.locator('h2').filter({ hasText: /^Grunnleggende konsepter fra markdown$/ })).toBeVisible();

    await page
      .getByRole('button', { name: /flytt til arkiv/i })
      .or(page.getByRole('menuitem', { name: /flytt til arkiv/i }))
      .click();
    await expect(page.getByText(/flyttet til arkiv/i)).toBeVisible();

    await archiveLink.click();

    await expect(page.getByRole('link', { name: 'Skatten din for 2022' })).toBeVisible();

    await page.getByRole('link', { name: 'Skatten din for 2022' }).click();
    await page
      .getByRole('button', { name: /flytt til papirkurv/i })
      .or(page.getByRole('menuitem', { name: /flytt til papirkurv/i }))
      .click();
    await expect(page.getByText(/flyttet til papirkurv/i)).toBeVisible({ timeout: 10000 });

    await binLink.click();

    await expect(page.getByRole('link', { name: 'Skatten din for 2022' })).toBeVisible();

    await archiveLink.click();
    await expect(page.getByText('Arkivet er tomt')).toBeVisible();
  });
});
