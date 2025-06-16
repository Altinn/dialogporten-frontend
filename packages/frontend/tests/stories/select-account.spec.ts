import { PageRoutes } from '../../src/pages/routes';
import { expect, test } from '../fixtures';
import { appURLDrafts, appURLInbox, defaultAppURL, matchPathName } from '../index';
import { getSidebarMenuItem } from './common';

test('should navigate to inbox when account is chosen from global menu', async ({ page, isMobile }) => {
  await page.goto(defaultAppURL);
  /* click navigate to draft page */
  if (isMobile) {
    await page.getByRole('button', { name: 'Meny' }).click();
    await page.getByRole('link', { name: 'Utkast' }).click();
    await page.getByRole('button', { name: 'Meny' }).click();
  } else {
    await getSidebarMenuItem(page, PageRoutes.drafts).click();
  }

  expect(page.url()).toEqual(appURLDrafts);
  /* chose all organizations from the global menu */
  await page.getByRole('button', { name: 'Meny' }).click();
  await page.getByRole('banner').getByRole('button', { name: 'Test Testesen' }).click();
  await page.locator('a').filter({ hasText: 'FTT4Alle virksomheter1' }).click();

  expect(new URL(page.url()).searchParams.get('allParties')).toBe('true');
  expect(new URL(page.url()).searchParams.get('party')).toBe(null);
  expect(matchPathName(page.url(), appURLInbox)).toBe(true);
});
