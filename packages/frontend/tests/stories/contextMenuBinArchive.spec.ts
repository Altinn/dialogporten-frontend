import { expect, test } from '@playwright/test';
import { PageRoutes } from '../../src/pages/routes';
import { defaultAppURL } from '../index';
import { getSidebarMenuItem } from './common';

test('Move to bin and archive', async ({ page, isMobile }) => {
  await page.goto(defaultAppURL);
  /* use context menu to transfer dialog to archive */
  await page.getByRole('button', { name: 'Kontekstmeny for dialog med tittel Melding om bortkjøring av snø' }).click();
  await page.getByRole('button', { name: 'Flytt til arkiv' }).click();

  const archiveLink = getSidebarMenuItem(page, PageRoutes.archive);
  const binLink = getSidebarMenuItem(page, PageRoutes.bin);

  if (isMobile) {
    await page.getByRole('button', { name: 'Meny' }).click();
    await page.getByRole('link', { name: 'Arkiv' }).click();
    await page.getByRole('button', { name: 'Meny' }).click();
  } else {
    await archiveLink.click();
  }

  await expect(page.getByRole('heading', { name: 'Melding om bortkjøring av snø' })).toBeVisible();

  /* use context menu to transfer dialog to bin */
  await page.getByRole('button', { name: 'Kontekstmeny for dialog med tittel Melding om bortkjøring av snø' }).click();
  await page.getByRole('button', { name: 'Flytt til papirkurv' }).click();

  if (isMobile) {
    await page.getByRole('button', { name: 'Meny' }).click();
    await page.getByRole('link', { name: 'Papirkurv' }).click();
    await page.getByRole('button', { name: 'Meny' }).click();
  } else {
    await binLink.click();
  }
  await expect(page.getByRole('heading', { name: 'Melding om bortkjøring av snø' })).toBeVisible();
});
