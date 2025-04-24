import { defaultAppURL } from '../';
import { PageRoutes } from '../../src/pages/routes';
import { expect, test } from '../fixtures';
import { getSidebarMenuItem } from './common';

test.describe('Sidebar menu', () => {
  test('Checking all items in sidebar', async ({ page, isMobile }) => {
    await page.goto(defaultAppURL);

    if (isMobile) {
      await page.getByRole('button', { name: 'Meny' }).click();
      await page.getByRole('link', { name: 'Utkast' }).click();
      await page.getByRole('button', { name: 'Meny' }).click();
    } else {
      await getSidebarMenuItem(page, PageRoutes.drafts).click();
    }
    await expect(page.getByRole('heading', { name: 'utkast' })).toBeVisible();

    if (isMobile) {
      await page.getByRole('button', { name: 'Meny' }).click();
      await page.getByRole('link', { name: 'Sendt' }).click();
      await page.getByRole('button', { name: 'Meny' }).click();
    } else {
      await getSidebarMenuItem(page, PageRoutes.sent).click();
    }
    await expect(page.getByRole('heading', { name: 'sendt' })).toBeVisible();

    if (isMobile) {
      await page.getByRole('button', { name: 'Meny' }).click();
      await page.getByRole('link', { name: 'Lagrede søk' }).click();
      await page.getByRole('button', { name: 'Meny' }).click();
    } else {
      await getSidebarMenuItem(page, PageRoutes.savedSearches).click();
    }
    await expect(page.getByText('Du har ingen lagrede søk')).toBeVisible();

    if (isMobile) {
      await page.getByRole('button', { name: 'Meny' }).click();
      await page.getByRole('link', { name: 'Arkiv' }).click();
      await page.getByRole('button', { name: 'Meny' }).click();
    } else {
      await getSidebarMenuItem(page, PageRoutes.archive).click();
    }
    await expect(page.getByRole('heading', { name: 'Ingen arkiverte meldinger' })).toBeVisible();

    if (isMobile) {
      await page.getByRole('button', { name: 'Meny' }).click();
      await page.getByRole('link', { name: 'Papirkurv' }).click();
      await page.getByRole('button', { name: 'Meny' }).click();
    } else {
      await getSidebarMenuItem(page, PageRoutes.bin).click();
    }
    await expect(page.getByRole('heading', { name: 'Ingen meldinger i papirkurv' })).toBeVisible();

    if (isMobile) {
      await page.getByRole('button', { name: 'Meny' }).click();
      await page.getByRole('link', { name: 'Innboks 7' }).click();
    } else {
      await getSidebarMenuItem(page, PageRoutes.inbox).click();
    }
    await expect(page.getByRole('link', { name: 'Melding om bortkjøring av sn' })).toBeVisible();
  });
});
