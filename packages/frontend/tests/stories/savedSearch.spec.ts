import { defaultAppURL } from '../';
import { PageRoutes } from '../../src/pages/routes';
import { expect, test } from '../fixtures';
import { expectIsCompanyPage, getSidebarMenuItem, performSearch } from './common';

test.describe('Saved search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(defaultAppURL);
    await page.waitForLoadState('networkidle');
  });

  test('Create and delete saved search', async ({ page }) => {
    const toolbarArea = page.getByTestId('inbox-toolbar');
    await toolbarArea.getByRole('button', { name: /legg til/i }).click();
    await toolbarArea.locator('#tool-filter-add').getByRole('menuitem', { name: 'Tjenesteeier' }).click();
    await page.getByRole('option', { name: 'Oslo kommune' }).click();
    await page.getByRole('option', { name: 'Oslo kommune' }).press('Escape');

    await page.getByRole('button', { name: 'Lagre søk' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Lagre søk' }).click();
    await expect(page.getByText('Søket ditt er lagret')).toBeVisible();

    await getSidebarMenuItem(page, PageRoutes.savedSearches).click();
    await page.waitForLoadState('networkidle');

    const savedSearchItem = page.locator('li', { has: page.locator('a[href*="org=ok"]') }).first();
    await expect(savedSearchItem).toBeVisible();

    await savedSearchItem.getByRole('button', { name: 'Åpne meny' }).click();
    await page.getByLabel('Slett søk').click();

    await expect(page.getByText('Søket ditt ble slettet')).toBeVisible();
    await expect(page.getByRole('main')).toContainText('Ingen lagrede søk');
  });

  test('Saved search based on searchbar value', async ({ page, isMobile }) => {
    await page.goto(defaultAppURL);

    await performSearch(page, 'skatten', 'enter');

    await page.getByRole('button', { name: 'Lagre søk' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Lagre søk' }).click();
    await expect(page.getByRole('button', { name: 'Lagret søk' })).toBeVisible();

    test.skip(isMobile, 'Sidebar is desktop-only');
    await getSidebarMenuItem(page, PageRoutes.savedSearches).click();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('a', { hasText: 'skatten' })).toBeVisible();
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
    await page.waitForURL((url) => url.searchParams.get('party') === 'urn:altinn:organization:identifier-sub:2');
    await page.waitForLoadState('networkidle');
    await page.getByRole('combobox', { name: 'Søk' }).click();
    await page.getByRole('combobox', { name: 'Søk' }).fill('innkalling');
    await page.getByRole('combobox', { name: 'Søk' }).press('Enter');
    await page.getByRole('button', { name: 'Lagre søk' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Lagre søk' }).click();
    await expect(page.getByText('Søket ditt er lagret')).toBeVisible();

    await page.getByTestId('sidebar-saved-searches').click();
    await page.waitForLoadState('networkidle');
    await page.getByRole('link', { name: '« innkalling »' }).click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('link', { name: 'Innkalling til sesjon' })).toBeVisible({ timeout: 10000 });
    await expectIsCompanyPage(page);
  });

  test('save search button is disabled when matching search exists also for predefined filters', async ({ page }) => {
    await page.goto(defaultAppURL);

    /* Create saved search with Oslo kommune and folder=Archive (systemLabel) from inbox */

    await page.getByRole('button', { name: 'Legg til filter' }).click();
    await page.locator('#tool-filter-add').getByRole('menuitem', { name: 'Tjenesteeier' }).click();
    await page.locator('input[aria-controls="toolbar-filter-menu-org-listbox"]').fill('Oslo');
    await page.getByRole('option', { name: 'Oslo kommune' }).click();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Legg til' }).click();
    await page.locator('#tool-filter-add').getByRole('menuitem', { name: 'Mappe' }).click();
    await page.getByRole('menuitemradio', { name: 'Arkiv' }).click();
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: 'Lagre søk' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Lagre søk' }).click();
    await expect(page.getByText('Søket ditt er lagret')).toBeVisible();

    await page.getByRole('button', { name: 'Nullstill' }).click();

    await page.getByRole('button', { name: 'Legg til filter' }).click();
    await page.locator('#tool-filter-add').getByRole('menuitem', { name: 'Tjenesteeier' }).click();
    await page.locator('input[aria-controls="toolbar-filter-menu-org-listbox"]').fill('Oslo');
    await page.getByRole('option', { name: 'Oslo kommune' }).click();
    await page.getByRole('option', { name: 'Oslo kommune' }).press('Escape');
    await page.getByRole('button', { name: 'Legg til' }).click();
    await page.locator('#tool-filter-add').getByRole('menuitem', { name: 'Mappe' }).click();
    await page.getByRole('menuitemradio', { name: 'Arkiv' }).click();
    await page.keyboard.press('Escape');

    /* Navigate to sent folder and add Oslo kommune as filter...
    It should not be possible to save search since a matching search already exists */

    // Søk allerede lagret
    await expect(page.getByText('Lagret søk')).toBeVisible();
  });
});
