import { appUrlWithPlaywrightId } from '../';
import { PageRoutes } from '../../src/pages/routes';
import { expect, test } from '../fixtures';
import { expectIsCompanyPage, expectIsNeutralPage, expectIsPersonPage, getSidebarMenuItem } from './common';

test.describe('Message navigation', () => {
  const pageWithMockOrganizations = appUrlWithPlaywrightId('login-party-context');

  test('Back button navigates correctly and saves party', async ({ page }) => {
    const toolbar = page.locator('#toolbar-menu-root');

    await page.goto(pageWithMockOrganizations);
    await expectIsPersonPage(page);

    await expect(toolbar).toContainText('Test Testesen');
    await expect(page.getByRole('link', { name: 'Skatten din for 2022' })).toBeVisible();
    await page.getByRole('link', { name: 'Skatten din for 2022' }).click();
    await page.waitForURL((url) => url.pathname !== '/');
    await page.getByRole('link', { name: 'Tilbake', exact: true }).click();
    await page.waitForURL((url) => url.pathname === '/');
    await expect(toolbar).toContainText('Test Testesen');

    await toolbar.locator('button').first().click();
    await page.locator('button[id="urn:altinn:organization:identifier-no:1"]').click();

    await expect(toolbar).toContainText('Firma AS');
    await expect(page.getByRole('link', { name: 'This is a message 1 for Firma AS' })).toBeVisible();
    await page.getByRole('link', { name: 'This is a message 1 for Firma' }).click();
    await page.waitForURL((url) => url.pathname !== '/' && url.searchParams.has('party'));
    await page.getByRole('link', { name: 'Tilbake', exact: true }).click();
    await page.waitForURL((url) => url.pathname === '/' && url.searchParams.has('party'));

    await expect(toolbar).toContainText('Firma AS');
    await expectIsCompanyPage(page);

    expect(new URL(page.url()).searchParams.has('party')).toBe(true);

    await toolbar.locator('button').first().click();
    await page.getByRole('option', { name: 'Alle virksomheter' }).click();
    await expect(toolbar).toContainText('Alle virksomheter');
    await page.waitForURL((url) => url.searchParams.has('allParties'));
    // The dialog list refetches when switching to all-parties view. Wait for
    // the new list to settle before clicking so we don't hit a link that gets
    // unmounted mid-click by the incoming render.
    await page.waitForLoadState('networkidle');

    const messageLink = page.getByRole('link', { name: 'This is a message 1 for Firma' }).first();
    await expect(messageLink).toBeVisible();
    await messageLink.click();
    await page.waitForURL((url) => url.pathname !== '/' && url.searchParams.has('allParties'));
    await page.getByRole('link', { name: 'Tilbake', exact: true }).click();
    await page.waitForURL((url) => url.pathname === '/' && url.searchParams.has('allParties'));

    await expect(toolbar).toContainText('Alle virksomheter');

    await expectIsPersonPage(page);
    expect(new URL(page.url()).searchParams.has('allParties')).toBe(true);
  });

  /* Fix this later */
  test('Back button navigates to previous page the message has been opened from', async ({ page, isMobile }) => {
    await page.goto(pageWithMockOrganizations);

    await expect(page.locator('h2').filter({ hasText: /^Skatten din for 2022$/ })).toBeVisible();
    await page.getByRole('link', { name: 'Skatten din for 2022' }).click();
    await page
      .getByRole('button', { name: /flytt til papirkurv/i })
      .or(page.getByRole('menuitem', { name: /flytt til papirkurv/i }))
      .click();
    await expect(page.getByText(/flyttet til papirkurv/i)).toBeVisible();

    if (isMobile) {
      await page.getByRole('button', { name: 'Meny' }).click();
      await page.getByRole('link', { name: 'Papirkurv' }).click();
      await page.getByRole('button', { name: 'Meny' }).click();
    } else {
      await getSidebarMenuItem(page, PageRoutes.bin).click();
    }

    await page.getByRole('link', { name: 'Skatten din for 2022' }).click();
    await page.getByRole('link', { name: 'Tilbake', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Papirkurv', exact: true })).toBeVisible();
  });
});
