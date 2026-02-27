import { appUrlWithPlaywrightId } from '../';
import { PageRoutes } from '../../src/pages/routes';
import { expect, test } from '../fixtures';
import { expectIsCompanyPage, expectIsNeutralPage, expectIsPersonPage, getSidebarMenuItem } from './common';

test.describe('Message navigation', () => {
  const pageWithMockOrganizations = appUrlWithPlaywrightId('login-party-context');

  test('Back button navigates correctly and saves party', async ({ page }) => {
    await page.goto(pageWithMockOrganizations);
    await expectIsPersonPage(page);

    await expect(page.locator('#toolbar-menu-root')).toContainText('Test Testesen');
    await expect(page.getByRole('link', { name: 'Skatten din for 2022' })).toBeVisible();
    await page.getByRole('link', { name: 'Skatten din for 2022' }).click();
    await page.getByRole('link', { name: 'Tilbake', exact: true }).click();
    await expect(page.locator('#toolbar-menu-root')).toContainText('Test Testesen');

    await page.locator('#toolbar-menu-root > button').click();
    await page.locator('button[id="urn:altinn:organization:identifier-no:1"]').click();

    await expect(page.locator('#toolbar-menu-root')).toContainText('Firma AS');
    await expect(page.getByRole('link', { name: 'This is a message 1 for Firma AS' })).toBeVisible();
    await page.getByRole('link', { name: 'This is a message 1 for Firma' }).click();
    await page.getByRole('link', { name: 'Tilbake', exact: true }).click();

    await expect(page.locator('#toolbar-menu-root')).toContainText('Firma AS');
    await expectIsCompanyPage(page);

    expect(new URL(page.url()).searchParams.has('party')).toBe(true);

    await page.locator('#toolbar-menu-root > button').click();
    await page.getByRole('option', { name: 'Alle virksomheter' }).click();
    await expect(page.locator('#toolbar-menu-root')).toContainText('Alle virksomheter');

    await page.getByRole('link', { name: 'This is a message 1 for Firma' }).click();
    await page.getByRole('link', { name: 'Tilbake' }).click();

    await expect(page.locator('#toolbar-menu-root')).toContainText('Alle virksomheter');

    await expectIsPersonPage(page);
    expect(new URL(page.url()).searchParams.has('allParties')).toBe(true);
  });

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
    await expect(page.getByRole('heading', { name: 'i papirkurv' })).toBeVisible();
  });
});
