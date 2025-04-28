import { defaultAppURL } from '../';
import { PageRoutes } from '../../src/pages/routes';
import { expect, test } from '../fixtures';
import { expectIsCompanyPage, getSidebarMenuItem, getSidebarMenuItemBadge, performSearch } from './common';

test.describe('Saved search', () => {
  test('Create and delete saved search', async ({ page, isMobile }) => {
    await page.goto(defaultAppURL);
    const toolbarArea = page.getByTestId('inbox-toolbar');
    await toolbarArea.getByRole('button', { name: 'add' }).click();

    await toolbarArea.getByText('Velg avsender').locator('visible=true').click();
    await toolbarArea.getByLabel('Oslo kommune').locator('visible=true').check();

    if (isMobile) {
      await page.getByRole('button', { name: 'Vis alle resultater' }).click();
    } else {
      await page.mouse.click(200, 0, { button: 'left' });
    }

    await page.getByRole('button', { name: 'Lagre søk' }).click();
    await expect(page.getByText('Søk lagret')).toBeVisible();

    if (isMobile) {
      await page.getByRole('button', { name: 'Meny' }).click();
      await expect(getSidebarMenuItemBadge(page, PageRoutes.savedSearches)).toContainText('1');
      await page.getByRole('link', { name: 'Lagrede søk' }).click();
      await page.getByRole('button', { name: 'Meny' }).click();
    } else {
      await expect(getSidebarMenuItemBadge(page, PageRoutes.savedSearches)).toContainText('1');
      await getSidebarMenuItem(page, PageRoutes.savedSearches).click();
    }

    await expect(page.getByRole('main')).toContainText('1 lagret søk');
    await expect(page.locator('header').filter({ hasText: 'Oslo kommune' })).toBeVisible();
    await page.locator('header').filter({ hasText: 'Oslo kommune' }).getByRole('button').click();

    await page.getByText('Slett').click();
    await expect(page.getByText('Søk slettet')).toBeVisible();
    await expect(page.getByRole('main')).toContainText('Du har ingen lagrede søk');
  });

  test('Saved search based on searchbar value', async ({ page }) => {
    await page.goto(defaultAppURL);

    await performSearch(page, 'skatten');

    await page.getByRole('button', { name: 'Lagre søk' }).click();
    await expect(page.getByRole('button', { name: 'Lagret søk' })).toBeVisible();

    await expect(getSidebarMenuItemBadge(page, PageRoutes.savedSearches)).toContainText('1');

    await performSearch(page, 'skatten din');

    await expect(page.getByRole('button', { name: 'Lagret søk' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Lagre søk' })).toBeVisible();
  });

  test('Saved search link shows correct result', async ({ page, isMobile }) => {
    await page.goto(defaultAppURL);

    await page.getByRole('button', { name: 'Test Testesen' }).click();
    const toolbarArea = page.getByTestId('inbox-toolbar');
    await toolbarArea.getByText('Testbedrift AS Avd Oslo').locator('visible=true').click();
    await expectIsCompanyPage(page);
    await expect(page.getByRole('link', { name: 'Innkalling til sesjon' })).toBeVisible();

    await performSearch(page, 'innkalling', 'enter');

    await page.getByRole('button', { name: 'Lagre søk' }).click();

    if (isMobile) {
      await page.getByRole('button', { name: 'Meny' }).click();
      await page.getByRole('link', { name: 'Lagrede søk' }).click();
      await page.getByRole('button', { name: 'Meny' }).click();
    } else {
      await getSidebarMenuItem(page, PageRoutes.savedSearches).click();
    }

    await expect(page.getByRole('link', { name: 'Gi søket et navn' })).toBeVisible();

    await page.getByRole('link', { name: 'Gi søket et navn' }).click();
    await expect(page.getByRole('link', { name: 'Innkalling til sesjon' })).toBeVisible();
    await expectIsCompanyPage(page);
  });
});
