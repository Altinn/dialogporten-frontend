import { appUrlWithPlaywrightId } from '../';
import { PageRoutes } from '../../src/pages/routes';
import { expect, test } from '../fixtures';
import { expectIsCompanyPage, expectIsNeutralPage, expectIsPersonPage, getSidebarMenuItem } from './common';

test.describe('Message navigation', () => {
  const pageWithMockOrganizations = appUrlWithPlaywrightId('login-party-context');

  test('Back button navigates correctly and saves party', async ({ page }) => {
    await page.goto(pageWithMockOrganizations);
    const toolbarArea = page.getByTestId('inbox-toolbar');
    await expect(toolbarArea.getByRole('button', { name: 'Test Testesen' })).toBeVisible();
    await expectIsPersonPage(page);

    await expect(page.getByRole('link', { name: 'Skatten din for 2022' })).toBeVisible();
    await page.getByRole('link', { name: 'Skatten din for 2022' }).click();
    await page.getByRole('link', { name: 'Tilbake', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Test Testesen' })).toBeVisible();

    await page.getByRole('button', { name: 'Test Testesen' }).click();
    await toolbarArea.locator('li').filter({ hasText: 'Firma AS' }).locator('visible=true').click();

    await expect(page.getByTestId('inbox-toolbar').getByRole('button', { name: 'Firma AS' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'This is a message 1 for Firma AS' })).toBeVisible();
    await page.getByRole('link', { name: 'This is a message 1 for Firma AS' }).click();
    await page.getByRole('link', { name: 'Tilbake', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Firma AS' }).first()).toBeVisible();
    await expectIsCompanyPage(page);
    expect(new URL(page.url()).searchParams.has('party')).toBe(true);

    await page.getByRole('button', { name: 'Firma AS' }).first().click();

    await toolbarArea.locator('a').filter({ hasText: 'Alle virksomheter' }).locator('visible=true').click();
    await expect(page.getByRole('button', { name: 'Alle virksomheter' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'This is a message 1 for Firma AS' })).toBeVisible();
    await page.getByRole('link', { name: 'This is a message 1 for Firma AS' }).click();
    await page.getByRole('link', { name: 'Tilbake', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Alle virksomheter' })).toBeVisible();
    await expectIsPersonPage(page);
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
