import type { Page } from '@playwright/test';
import { defaultAppURL } from '../';
import { PageRoutes } from '../../src/pages/routes';
import { expect, test } from '../fixtures';
import { getSidebarMenuItem, getSidebarMenuItemBadge } from './common';

test.describe('DialogDetailsPage', () => {
  test('Check message opening, archiving and deleting', async ({
    page,
    isMobile,
  }: { page: Page; isMobile: boolean }) => {
    const archiveLink = getSidebarMenuItem(page, PageRoutes.archive);
    const archiveLinkCount = archiveLink.locator('span:text("1")');

    const binLink = getSidebarMenuItem(page, PageRoutes.bin);
    const binLinkCount = binLink.locator('span:text("1")');

    await page.goto(defaultAppURL);
    await expect(page.locator('h2').filter({ hasText: /^Skatten din for 2022$/ })).toBeVisible();
    await page.getByRole('link', { name: 'Skatten din for 2022' }).click();

    await page
      .locator('h2')
      .filter({ hasText: /^Grunnleggende konsepter fra markdown$/ })
      .waitFor();
    await expect(page.locator('h2').filter({ hasText: /^Grunnleggende konsepter fra markdown$/ })).toBeVisible();

    await page.getByRole('button', { name: 'Flytt til arkiv' }).click();
    page.locator('span').filter({ hasText: /^Flyttet til arkiv$/ });

    if (isMobile) {
      await page.getByRole('button', { name: 'Meny' }).click();
      await expect(page.getByRole('link', { name: 'Arkiv' }).locator('span:text("1")')).toBeVisible();
      await page.getByRole('link', { name: 'Arkiv' }).click();
      await page.getByRole('button', { name: 'Meny' }).click();
    } else {
      await expect(archiveLinkCount).toBeVisible();
      await archiveLink.click();
    }

    await expect(page.getByRole('heading', { name: 'arkivert' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Skatten din for 2022' })).toBeVisible();

    await page.getByRole('link', { name: 'Skatten din for 2022' }).click();
    await page.getByRole('button', { name: 'Flytt til papirkurv' }).click();
    page.locator('span').filter({ hasText: /^Flyttet til papirkurv$/ });

    if (isMobile) {
      await page.getByRole('button', { name: 'Meny' }).click();
      await expect(page.getByRole('link', { name: 'Arkiv' }).locator('span:text("1")')).not.toBeVisible();
      await expect(page.getByRole('link', { name: 'Papirkurv' }).locator('span:text("1")')).toBeVisible();
      await page.getByRole('link', { name: 'Papirkurv' }).click();
      await page.getByRole('button', { name: 'Meny' }).click();
    } else {
      await expect(archiveLinkCount).not.toBeVisible();
      await expect(binLinkCount).toBeVisible();
      await binLink.click();
      await expect(getSidebarMenuItemBadge(page, PageRoutes.bin)).toContainText('1');
    }

    await expect(page.getByRole('link', { name: 'Skatten din for 2022' })).toBeVisible();

    if (isMobile) {
      await page.getByRole('button', { name: 'Meny' }).click();
      await page.getByRole('link', { name: 'Arkiv' }).click();
      await page.getByRole('button', { name: 'Meny' }).click();
    } else {
      await archiveLink.click();
    }
    await expect(page.getByRole('heading', { name: 'Ingen arkiverte meldinger' })).toBeVisible();
  });
});
