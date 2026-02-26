import { PageRoutes } from '../../src/pages/routes';
import { expect, test } from '../fixtures';
import { defaultAppURL } from '../index';
import { getSidebarMenuItem } from './common';

test('test', async () => {});

test.describe('Breadcrumbs', () => {
  test('if expected breadcrumps are there', async ({ page }) => {
    await page.goto(defaultAppURL);

    await expect(page.getByRole('navigation', { name: 'Du er her:' })).toBeVisible();

    await getSidebarMenuItem(page, PageRoutes.drafts).click();
    await expect(page.getByRole('link', { name: 'Utkast' })).toBeVisible();

    await getSidebarMenuItem(page, PageRoutes.sent).click();
    await expect(page.getByRole('link', { name: 'Sendt' })).toBeVisible();

    await getSidebarMenuItem(page, PageRoutes.savedSearches).click();
    await expect(page.getByRole('link', { name: 'Lagrede søk' })).toBeVisible();

    await getSidebarMenuItem(page, PageRoutes.inbox).click();
    await getSidebarMenuItem(page, PageRoutes.drafts).click();
    await page.getByRole('link', { name: 'Klage på EU-kontroll' }).click();
    await expect(page.getByRole('link', { name: 'Klage på EU-kontroll' })).toBeVisible();
  });
});
