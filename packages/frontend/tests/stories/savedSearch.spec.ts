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
      await page.keyboard.press('Escape');
    }

    await page.getByRole('button', { name: 'Lagre søk' }).click();
    await expect(page.getByText('Søk lagret')).toBeVisible();

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

    await page.getByText('Slett').click();
    await expect(page.getByText('Søk slettet')).toBeVisible();
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

  test('save search button is disabled when matching search exists also for predefined filters', async ({
    page,
    isMobile,
  }) => {
    await page.goto(defaultAppURL);

    /* Create saved search with Oslo kommune and status send from inbox */
    const toolbarArea = page.getByTestId('inbox-toolbar');

    await toolbarArea.getByRole('button', { name: 'add' }).click();
    await toolbarArea.getByText('Velg avsender').locator('visible=true').click();
    await toolbarArea.getByLabel('Oslo kommune').locator('visible=true').check();

    if (isMobile) {
      await page.getByRole('button', { name: 'Vis alle resultater' }).click();
    } else {
      await page.keyboard.press('Escape');
    }

    await toolbarArea.getByRole('button', { name: 'add' }).click();
    await toolbarArea.getByText('Velg status').locator('visible=true').click();
    await toolbarArea.getByLabel('Sendt').locator('visible=true').check();

    if (isMobile) {
      await page.getByRole('button', { name: 'Vis alle resultater' }).click();
    } else {
      await page.keyboard.press('Escape');
    }

    await page.getByRole('button', { name: 'Lagre søk' }).click();
    await expect(page.getByText('Søk lagret')).toBeVisible();

    /* Navigate to sent folder and add Oslo kommune as filter...
    It should not be possible to save search since a matching search already exists */
    await getSidebarMenuItem(page, PageRoutes.sent).click();
    await toolbarArea.getByRole('button', { name: 'add' }).click();
    await toolbarArea.getByText('Velg avsender').locator('visible=true').click();
    await toolbarArea.getByLabel('Oslo kommune').locator('visible=true').check();

    if (isMobile) {
      await page.getByRole('button', { name: 'Vis alle resultater' }).click();
    } else {
      await page.keyboard.press('Escape');
    }

    // Søk allerede lagret
    await expect(page.getByText('Lagret søk')).toBeVisible();
  });
});
