import { expect, test } from '@playwright/test';
import { PageRoutes } from '../../src/pages/routes';
import { defaultAppURL } from '../index';
import { getSidebarMenuItem, openContextMenuForDialog } from './common';

test('Move to bin and archive', async ({ page, isMobile }) => {
  await page.goto(defaultAppURL);

  const title = 'Melding om bortkjøring av snø';

  const { menuRoot: defaultRoot } = await openContextMenuForDialog(page, title);
  await defaultRoot.locator('button[role="menuitem"][aria-label="Flytt til arkivet"]').click();

  // Go to archive
  const archiveLink = getSidebarMenuItem(page, PageRoutes.archive);
  const binLink = getSidebarMenuItem(page, PageRoutes.bin);

  if (isMobile) {
    await page.getByRole('button', { name: 'Meny' }).click();
    await page.getByRole('link', { name: 'Arkiv' }).click();
    await page.getByRole('button', { name: 'Meny' }).click();
  } else {
    await archiveLink.click();
  }

  await expect(page.getByRole('heading', { name: title })).toBeVisible();

  // Move to bin from archive
  const { menuRoot: archivedRoot } = await openContextMenuForDialog(page, title);
  await archivedRoot.locator('button[role="menuitem"][aria-label="Flytt til papirkurven"]').click();

  // Go to bin
  if (isMobile) {
    await page.getByRole('button', { name: 'Meny' }).click();
    await page.getByRole('link', { name: 'Papirkurv' }).click();
    await page.getByRole('button', { name: 'Meny' }).click();
  } else {
    await binLink.click();
  }

  await expect(page.getByRole('heading', { name: title })).toBeVisible();
});
