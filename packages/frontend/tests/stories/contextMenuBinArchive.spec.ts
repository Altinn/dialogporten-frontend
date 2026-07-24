import type { Page } from '@playwright/test';
import { PageRoutes } from '../../src/pages/routes';
import { appURLSent, appUrlWithPlaywrightId, defaultAppURL } from '../';
import { expect, test } from '../fixtures';
import { getSidebarMenuItem, openContextMenuForDialog } from './common';

const clickDialogAction = (page: Page, name: RegExp) =>
  page.getByRole('button', { name }).or(page.getByRole('menuitem', { name })).click();

const openDialog = async (page: Page, link: ReturnType<Page['getByRole']>) => {
  await link.click();
  await page.waitForURL((url) => url.pathname.startsWith('/inbox/'));
};

test.describe('Move dialogs between archive and bin', () => {
  test('Move to bin and archive', async ({ page }) => {
    await page.goto(defaultAppURL);
    await page.waitForLoadState('networkidle');

    const title = 'Melding om bortkjøring av snø';

    const { menuRoot: defaultRoot } = await openContextMenuForDialog(page, title);
    await defaultRoot.locator('button[role="menuitem"][aria-label="Flytt til arkivet"]').click();

    const archiveLink = getSidebarMenuItem(page, PageRoutes.archive);

    await archiveLink.click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: title }).first()).toBeVisible();

    const { menuRoot: archivedRoot } = await openContextMenuForDialog(page, title);
    await archivedRoot.locator('button[role="menuitem"][aria-label="Flytt til papirkurven"]').click();
    const binLink = getSidebarMenuItem(page, PageRoutes.bin);
    await binLink.click();

    await expect(page.getByRole('heading', { name: title }).first()).toBeVisible();
  });
});

test.describe('Returning to the originating list after moving a dialog', () => {
  test('Moving to archive from the dialog details returns to the inbox', async ({ page }) => {
    await page.goto(defaultAppURL);
    await page.waitForLoadState('networkidle');

    const title = 'Melding om bortkjøring av snø';
    await openDialog(page, page.getByRole('link', { name: title }).first());

    await clickDialogAction(page, /flytt til arkivet/i);

    await page.waitForURL((url) => url.pathname === PageRoutes.inbox);
    await expect(page.getByText(/flyttet til arkivet/i)).toBeVisible();
    await expect(page.getByRole('link', { name: title })).toHaveCount(0);
  });

  test('Moving to archive from a dialog opened in Sent returns to Sent', async ({ page }) => {
    await page.goto(appURLSent);
    await page.waitForLoadState('networkidle');

    const title = 'Melding om hull i veien';
    await openDialog(page, page.getByRole('link', { name: title }).first());

    await clickDialogAction(page, /flytt til arkivet/i);

    await page.waitForURL((url) => url.pathname === PageRoutes.sent);
    await expect(page.getByText(/flyttet til arkivet/i)).toBeVisible();
  });

  test('Moving to bin from the dialog details returns to the inbox', async ({ page }) => {
    await page.goto(defaultAppURL);
    await page.waitForLoadState('networkidle');

    const title = 'Melding om bortkjøring av snø';
    await openDialog(page, page.getByRole('link', { name: title }).first());

    await clickDialogAction(page, /flytt til papirkurven/i);

    await page.waitForURL((url) => url.pathname === PageRoutes.inbox);
    await expect(page.getByText(/flyttet til papirkurven/i)).toBeVisible();
    await expect(page.getByRole('link', { name: title })).toHaveCount(0);
  });

  test('Marking as unread returns to the list and scrolls back to the dialog', async ({ page }) => {
    await page.goto(appUrlWithPlaywrightId('dialogs-bulk'));
    await page.waitForLoadState('networkidle');

    const readDialogs = page.locator('li[id^="019241f7-bulk-"][data-unread="false"]');
    const target = readDialogs.nth(20);
    const dialogId = await target.getAttribute('id');
    await expect(target).not.toBeInViewport();

    await openDialog(page, target.getByRole('link').first());

    await clickDialogAction(page, /marker som ulest/i);

    await page.waitForURL((url) => url.pathname === PageRoutes.inbox);
    await expect(page.locator(`[id="${dialogId}"]`)).toBeInViewport();
  });
});
