import { defaultAppURL } from '../';
import { PageRoutes } from '../../src/pages/routes';
import { expect, test } from '../fixtures';
import { getSidebarMenuItem } from './common';

test.describe('Sidebar menu', () => {
  test('Checking all items in sidebar', async ({ page, isMobile }) => {
    await page.goto(defaultAppURL);

    await getSidebarMenuItem(page, PageRoutes.drafts).click();
    await expect(page.getByRole('heading', { name: 'Utkast', level: 1 })).toBeVisible();

    await getSidebarMenuItem(page, PageRoutes.sent).click();
    await expect(page.getByRole('link', { name: 'Melding om hull i veien' })).toBeVisible();

    await getSidebarMenuItem(page, PageRoutes.archive).click();
    await expect(page.getByText('Arkivet er tomt')).toBeVisible();

    await getSidebarMenuItem(page, PageRoutes.bin).click();
    await expect(page.getByText('Papirkurven er tom')).toBeVisible();

    await getSidebarMenuItem(page, PageRoutes.inbox).click();
    await expect(page.getByRole('link', { name: 'Melding om bortkjøring av sn' })).toBeVisible();

    await getSidebarMenuItem(page, PageRoutes.savedSearches).click();
    await expect(page.getByText('Du legger til et søk')).toBeVisible();
  });
});
