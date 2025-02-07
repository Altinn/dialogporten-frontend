import { expect, test } from '@playwright/test';
import { defaultAppURL } from '../';
import { PageRoutes } from '../../src/pages/routes';
import { expectIsCompanyPage, getSidebarMenuItem, getSidebarMenuItemBadge, performSearch } from './common';

test.describe('Saved search', () => {
  test('Create and delete saved search', async ({ page }) => {
    await page.goto(defaultAppURL);
    const toolbarArea = page.getByTestId('inbox-toolbar');
    await toolbarArea.getByRole('button', { name: 'add' }).click();

    await toolbarArea.getByText('Velg avsender').locator('visible=true').click();
    await toolbarArea.getByLabel('Oslo kommune').locator('visible=true').check();

    await page.mouse.click(200, 0, { button: 'left' });

    await page.getByRole('button', { name: 'Lagre søk' }).click();
    await expect(page.getByText('Søk lagret')).toBeVisible();

    await expect(getSidebarMenuItemBadge(page, PageRoutes.savedSearches)).toContainText('1');

    await getSidebarMenuItem(page, PageRoutes.savedSearches).click();
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

  test('Saved search link shows correct result', async ({ page }) => {
    await page.goto(defaultAppURL);

    await page.getByRole('button', { name: 'Test Testesen' }).click();
    const toolbarArea = page.getByTestId('inbox-toolbar');
    await toolbarArea.getByText('Testbedrift AS Avd Oslo').locator('visible=true').click();
    await expectIsCompanyPage(page);
    await expect(page.getByRole('link', { name: 'Innkalling til sesjon' })).toBeVisible();

    await performSearch(page, 'innkalling');

    await page.getByRole('button', { name: 'Lagre søk' }).click();

    await getSidebarMenuItem(page, PageRoutes.savedSearches).click();

    await expect(page.getByRole('link', { name: '«innkalling»' })).toBeVisible();

    await page.getByRole('link', { name: '«innkalling»' }).click();
    await expect(page.getByRole('link', { name: 'Innkalling til sesjon' })).toBeVisible();
    await expectIsCompanyPage(page);
  });
});
