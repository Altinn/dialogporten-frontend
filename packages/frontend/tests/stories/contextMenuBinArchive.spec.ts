import { expect, test } from '@playwright/test';
import { PageRoutes } from '../../src/pages/routes';
import { defaultAppURL } from '../index';
import { getSidebarMenuItemBadge } from './common';

test('test', async ({ page }) => {
  await page.goto(defaultAppURL);
  /* use context menu to transfer dialog to archive */
  await page.getByRole('button', { name: 'Kontekstmeny for dialog med tittel Melding om bortkjøring av snø' }).click();
  await page.getByRole('button', { name: 'Flytt til arkiv' }).click();
  await expect(getSidebarMenuItemBadge(page, PageRoutes.archive)).toContainText('1');
  await page.getByRole('link', { name: 'Arkiv' }).click();

  /* use context menu to transfer dialog to bin */
  await page.getByRole('button', { name: 'Kontekstmeny for dialog med tittel Melding om bortkjøring av snø' }).click();
  await page.getByRole('button', { name: 'Flytt til papirkurv' }).click();
  await expect(getSidebarMenuItemBadge(page, PageRoutes.bin)).toContainText('1');
});
