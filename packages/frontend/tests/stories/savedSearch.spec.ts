import { defaultAppURL } from '../';
import { PageRoutes } from '../../src/pages/routes';
import { expect, test } from '../fixtures';
import { expectIsCompanyPage, getSidebarMenuItem, performSearch } from './common';

test.describe('Saved search', () => {
  test('Create and delete saved search', async ({ page, isMobile }) => {
    await page.goto(defaultAppURL);
    const toolbarArea = page.getByTestId('inbox-toolbar');
    await toolbarArea.getByRole('button', { name: /legg til/i }).click();
    await toolbarArea.getByRole('menuitem', { name: 'Velg tjenesteeier' }).first().click();
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
    const parentLi = page.locator('a[href*="org=ok"]').locator('xpath=ancestor::li[1]');
    await parentLi.getByRole('button').click();

    await parentLi.getByText('Slett søk').click();
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

    await performSearch(page, 'skatten din');

    await expect(page.getByRole('button', { name: 'Lagret søk' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Lagre søk' })).toBeVisible();
  });

  test('Saved search link shows correct result', async ({ page, isMobile }) => {
    await page.goto(defaultAppURL);

    await page.getByTestId('inbox-toolbar').getByRole('button', { name: 'Test Testesen' }).click();
    await page.getByRole('option', { name: 'Testbedrift As Avd Oslo' }).click();
    await page.getByTestId('searchbar-input').click();
    await page.getByTestId('searchbar-input').fill('innkalling');
    await page.getByTestId('searchbar-input').press('Enter');
    await page.getByRole('button', { name: 'Lagre søk' }).click();

    await page
      .getByRole('link', { name: /Lagrede søk/i })
      .or(page.getByRole('menuitem', { name: /Lagrede søk/i }))
      .first()
      .click();

    // Wait for saved search to appear, then find the link
    await expect(page.getByRole('main')).toContainText('1 lagret søk');
    // The component may use "Lagret søk" as the title when there's no name
    const savedSearchLink = page.getByRole('main').getByRole('link', { name: 'Lagret søk' });
    await expect(savedSearchLink).toBeVisible();

    await savedSearchLink.click();
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
    await page.getByLabel('Velg tjenesteeier').click();
    await page.getByRole('searchbox', { name: 'Søk' }).fill('Oslo');
    await page.locator('li').filter({ hasText: 'Oslo kommune' }).nth(1).click();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Legg til' }).click();
    await page.getByLabel('Velg status').click();
    await page.locator('#SENT').click();
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: 'Lagre søk' }).click();
    await expect(page.getByText('Søket ditt er lagret')).toBeVisible();

    await page.getByRole('button', { name: 'Fjern alle filtre' }).click();

    await page.getByRole('button', { name: 'Legg til filter' }).click();
    await page.getByLabel('Velg tjenesteeier').click();
    await page.getByRole('searchbox', { name: 'Søk' }).fill('Oslo');
    await page.locator('li').filter({ hasText: 'Oslo kommune' }).nth(1).click();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Legg til' }).click();
    await page.getByLabel('Velg status').click();
    await page.locator('#SENT').click();
    await page.keyboard.press('Escape');

    /* Navigate to sent folder and add Oslo kommune as filter...
    It should not be possible to save search since a matching search already exists */

    // Søk allerede lagret
    await expect(page.getByText('Lagret søk')).toBeVisible();
  });
});
