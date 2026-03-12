import { beforeEach } from 'vitest';
import { defaultAppURL } from '../';
import { PageRoutes } from '../../src/pages/routes';
import { expect, test } from '../fixtures';
import { expectIsCompanyPage, getSidebarMenuItem, performSearch } from './common';

test.describe('Saved search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(defaultAppURL);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
      localStorage.setItem('arbeidsflate:inbox-onboarding-displayed', 'true');
      localStorage.setItem('arbeidsflate:beta-modal-displayed', 'true');
      localStorage.setItem('arbeidsflate:profile-main-onboarding-completed', 'true');
      localStorage.setItem('arbeidsflate:profile-parties-onboarding-completed', 'true');
    });
  });

  test('Create and delete saved search', async ({ page, isMobile }) => {
    const toolbarArea = page.getByTestId('inbox-toolbar');
    await toolbarArea.getByRole('button', { name: /legg til/i }).click();
    await toolbarArea.locator('#tool-filter-add').locator('button[data-id="org"], button#org').click();
    await page.locator('li').filter({ hasText: 'Oslo kommune' }).nth(1).click();

    if (isMobile) {
      await page.getByRole('button', { name: 'Vis alle resultater' }).click();
    } else {
      await page.keyboard.press('Escape');
    }

    await page.getByRole('button', { name: 'Lagre søk' }).click();
    await expect(page.getByText('Søket ditt er lagret')).toBeVisible();

    if (isMobile) {
      await page.getByRole('button', { name: 'Meny' }).click();
      await page.getByRole('link', { name: 'Lagrede søk' }).click();
      await page.getByRole('button', { name: 'Meny' }).click();
    } else {
      await getSidebarMenuItem(page, PageRoutes.savedSearches).click();
    }

    await expect(page.getByRole('main')).toContainText('1 lagret søk');
    await expect(page.locator('a[href*="org=ok"]')).toBeVisible();

    await page.getByRole('button', { name: 'Åpne meny' }).click();
    await page.getByLabel('Slett søk').click();

    await expect(page.getByText('Søket ditt ble slettet')).toBeVisible();
    await expect(page.getByRole('main')).toContainText('Du har ingen lagrede søk');
  });

  test('Saved search based on searchbar value', async ({ page, isMobile }) => {
    await page.goto(defaultAppURL);

    await performSearch(page, 'skatten', 'enter');

    await page.getByRole('button', { name: 'Lagre søk' }).click();
    await expect(page.getByRole('button', { name: 'Lagret søk' })).toBeVisible();

    if (isMobile) {
      await page.getByRole('button', { name: 'Meny' }).click();
      await page.getByRole('link', { name: 'Lagrede søk' }).click();
      await page.getByRole('button', { name: 'Meny' }).click();
    } else {
      await getSidebarMenuItem(page, PageRoutes.savedSearches).click();
    }

    await expect(page.getByRole('main')).toContainText('1 lagret søk');
    await getSidebarMenuItem(page, PageRoutes.inbox).click();

    await performSearch(page, 'skatten din', 'click');

    await expect(page.getByRole('button', { name: 'Lagret søk' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Lagre søk' })).toBeVisible();
  });

  test('Saved search link shows correct result', async ({ page }) => {
    test.slow();

    await page.goto(defaultAppURL);
    await page.waitForLoadState('networkidle');

    await page.getByTestId('inbox-toolbar').getByRole('button', { name: 'Test Testesen' }).click();
    await page.getByRole('option', { name: 'Testbedrift As Avd Oslo' }).click();
    await page.getByRole('combobox', { name: 'Søk' }).click();
    await page.getByRole('combobox', { name: 'Søk' }).fill('innkalling');
    await page.getByRole('combobox', { name: 'Søk' }).press('Enter');
    await page.getByRole('button', { name: 'Lagre søk' }).click();

    await page.getByTestId('sidebar-saved-searches').click();
    await page.getByRole('link', { name: '«innkalling»' }).click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('link', { name: 'Innkalling til sesjon' })).toBeVisible();
    await expectIsCompanyPage(page);
  });

  test('save search button is disabled when matching search exists also for predefined filters', async ({
    page,
    isMobile,
  }) => {
    await page.goto(defaultAppURL);

    /* Create saved search with Oslo kommune and status send from inbox */

    await page.getByRole('button', { name: 'Legg til filter' }).click();
    await page.locator('#tool-filter-add').locator('button[data-id="org"], button#org').click();
    await page.locator('input[aria-controls="toolbar-filter-menu-listbox"]').fill('Oslo');
    await page.locator('li').filter({ hasText: 'Oslo kommune' }).nth(1).click();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Legg til' }).click();
    await page.locator('#tool-filter-add').locator('button[data-id="status"], button#status').click();
    await page.locator('#SENT').click();
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: 'Lagre søk' }).click();
    await expect(page.getByText('Søket ditt er lagret')).toBeVisible();

    await page.getByRole('button', { name: 'Nullstill' }).click();

    await page.getByRole('button', { name: 'Legg til filter' }).click();
    await page.locator('#tool-filter-add').locator('button[data-id="org"], button#org').click();
    await page.locator('input[aria-controls="toolbar-filter-menu-listbox"]').fill('Oslo');
    await page.locator('li').filter({ hasText: 'Oslo kommune' }).nth(1).click();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Legg til' }).click();
    await page.locator('#tool-filter-add').locator('button[data-id="status"], button#status').click();
    await page.locator('#SENT').click();
    await page.keyboard.press('Escape');

    /* Navigate to sent folder and add Oslo kommune as filter...
    It should not be possible to save search since a matching search already exists */

    // Søk allerede lagret
    await expect(page.getByText('Lagret søk')).toBeVisible();
  });
});
