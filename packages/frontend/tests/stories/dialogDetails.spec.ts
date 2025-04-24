import { defaultAppURL } from '../';
import { PageRoutes } from '../../src/pages/routes';
import { expect, test } from '../fixtures';
import { getSidebarMenuItem } from './common';

test.describe('Dialog details', () => {
  test('Checking that opening a dialog details page shows the correct number of messages', async ({
    page,
    isMobile,
  }) => {
    await page.goto(defaultAppURL);
    if (isMobile) {
      await page.getByRole('button', { name: 'Meny' }).click();
      await expect(page.getByRole('link', { name: 'Innboks 7' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Innboks 7' }).locator('[data-color="alert"]')).toContainText('2');
      await page.getByRole('button', { name: 'Meny' }).click();
      await page.getByRole('link', { name: 'Arbeidsavklaringspenger' }).click();
      await page.getByRole('button', { name: 'Meny' }).click();
      await expect(page.getByRole('link', { name: 'Innboks 7' }).locator('[data-color="alert"]')).toContainText('1');
    } else {
      await expect(getSidebarMenuItem(page, PageRoutes.inbox)).toBeVisible();
      await expect(getSidebarMenuItem(page, PageRoutes.inbox).locator('[data-color="alert"]')).toContainText('2');
      await page.getByRole('link', { name: 'Arbeidsavklaringspenger' }).click();
      await expect(getSidebarMenuItem(page, PageRoutes.inbox)).toContainText('1');
    }
  });
});
