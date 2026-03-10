import { defaultAppURL } from '../';
import { PageRoutes } from '../../src/pages/routes';
import { expect, test } from '../fixtures';
import { getSidebarMenuItem, openContextMenuForDialog } from './common';

test.describe('Move dialogs between archive and bin', () => {
  test('Move to bin and archive', async ({ page, isMobile }) => {
    await page.goto(defaultAppURL);
    await page.waitForLoadState('networkidle');

    const title = 'Melding om bortkjøring av snø';

    const { menuRoot: defaultRoot } = await openContextMenuForDialog(page, title);
    await defaultRoot.locator('button[role="menuitem"][aria-label="Flytt til arkivet"]').click();

    const archiveLink = getSidebarMenuItem(page, PageRoutes.archive);

    await archiveLink.click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: title })).toBeVisible();

    const { menuRoot: archivedRoot } = await openContextMenuForDialog(page, title);
    await archivedRoot.locator('button[role="menuitem"][aria-label="Flytt til papirkurven"]').click();
    const binLink = getSidebarMenuItem(page, PageRoutes.bin);
    await binLink.click();

    await expect(page.getByRole('heading', { name: title })).toBeVisible();
  });
});
