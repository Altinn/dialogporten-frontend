import { PageRoutes } from '../../src/pages/routes';
import { expect, test } from '../fixtures';
import { appURLDrafts, appURLInbox, defaultAppURL, matchPathName } from '../index';
import { getSidebarMenuItem } from './common';

test('should navigate to inbox when changing account from global menu', async ({ page, isMobile }) => {
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

  await page.getByLabel('Test Testesen').click();
  await page.locator('a').filter({ hasText: 'FFirma ASOrg.nr:' }).click();

  expect(new URL(page.url()).searchParams.get('party')).toBe('urn%3Aaltinn%3Aorganization%3Aidentifier-no%3A1');
  expect(matchPathName(page.url(), appURLInbox)).toBe(true);
});
