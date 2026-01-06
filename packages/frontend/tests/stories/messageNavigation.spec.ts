import { appUrlWithPlaywrightId } from '../';
import { PageRoutes } from '../../src/pages/routes';
import { expect, test } from '../fixtures';
import { expectIsCompanyPage, expectIsNeutralPage, expectIsPersonPage, getSidebarMenuItem } from './common';

test.describe('Message navigation', () => {
  const pageWithMockOrganizations = appUrlWithPlaywrightId('login-party-context');

  test('Back button navigates correctly and saves party', async ({ page }) => {
    await page.goto(pageWithMockOrganizations);
    await expectIsPersonPage(page);

    await expect(page.getByTestId('account-menu-button')).toContainText('Test Testesen');
    await expect(page.getByRole('link', { name: 'Skatten din for 2022' })).toBeVisible();
    await page.getByRole('link', { name: 'Skatten din for 2022' }).click();
    await page.getByRole('link', { name: 'Tilbake', exact: true }).click();
    await expect(page.getByTestId('account-menu-button')).toContainText('Test Testesen');

    await page.getByTestId('account-menu-button').click();

    await page.locator('a').filter({ hasText: 'FFirma ASOrg. nr. :' }).click();
    await expect(page.getByTestId('account-menu-button')).toContainText('Firma AS');
    await expect(page.getByRole('link', { name: 'This is a message 1 for Firma AS' })).toBeVisible();
    await page.getByRole('link', { name: 'This is a message 1 for Firma' }).click();
    await page.getByRole('link', { name: 'Tilbake', exact: true }).click();
    await expect(page.getByTestId('account-menu-button')).toContainText('Firma AS');
    await expectIsCompanyPage(page);
    expect(new URL(page.url()).searchParams.has('party')).toBe(true);

    await page.getByTestId('account-menu-button').click();
    await page.locator('a').filter({ hasText: 'TTT5Alle virksomheter' }).click();
    await expect(page.getByTestId('account-menu-button')).toContainText('Alle virksomheter');
    await page.getByRole('link', { name: 'This is a message 1 for Firma' }).click();
    await page.getByRole('link', { name: 'Tilbake' }).click();
    await expect(page.getByTestId('account-menu-button')).toContainText('Alle virksomheter');
    await expectIsPersonPage(page);
    expect(new URL(page.url()).searchParams.has('allParties')).toBe(true);
  });

  test('Back button navigates to previous page the message has been opened from', async ({ page, isMobile }) => {
    await page.goto(pageWithMockOrganizations);

    await expect(page.locator('h2').filter({ hasText: /^Skatten din for 2022$/ })).toBeVisible();
    await page.getByRole('link', { name: 'Skatten din for 2022' }).click();
    await page.getByRole('button', { name: 'Flytt til papirkurv' }).click();
    await expect(page.getByText('Flyttet til papirkurv')).toBeVisible();

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
