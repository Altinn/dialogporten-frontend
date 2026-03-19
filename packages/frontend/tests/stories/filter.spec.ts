import { defaultAppURL } from '../';
import { PageRoutes } from '../../src/pages/routes';
import { expect, test } from '../fixtures';
import { getSidebarMenuItem } from './common';

test.describe('Testing filter bar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(defaultAppURL);
  });

  test('should filter when selecting sender filter and status filter', async ({ page }) => {
    await page.getByRole('button', { name: 'Legg til filter' }).click();
    await page.getByLabel('Tjenesteeier').click();
    await page.locator('#skd').click();
    await expect(page).toHaveURL(/[?&]org=skd/);

    await expect(page.getByRole('link', { name: 'Skatten din for 2022' })).toBeVisible();

    await page.locator('#skd').press('Escape');
    await page.getByRole('button', { name: 'Nullstill' }).click();

    await expect(page).not.toHaveURL(/[?&]org=/);

    await page.getByRole('button', { name: 'Legg til filter' }).click();
    await page.getByRole('menuitem', { name: 'Status' }).first().click();
    await page.locator('#COMPLETED').click();
    await expect(page).toHaveURL(/[?&]status=COMPLETED/);
    await page.locator('#COMPLETED').getByRole('checkbox', { name: 'Avsluttet' }).press('Escape');

    await expect(page.getByRole('link', { name: 'Skatten din for 2022' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Søknad om personlig bilskilt' })).toBeVisible();
  });

  test('should remove filters when changing view types', async ({ page, isMobile }) => {
    await page.getByRole('button', { name: 'Legg til filter' }).click();
    await page.getByLabel('Tjenesteeier').click();
    await page.locator('#skd').click();
    await expect(page).toHaveURL(/[?&]org=skd/);
    await page.locator('#skd').press('Escape');

    await expect(page.getByRole('link', { name: 'Skatten din for 2022' })).toBeVisible();

    await getSidebarMenuItem(page, PageRoutes.drafts).click();
    await expect(page).not.toHaveURL(/[?&]org=/);
  });

  test('should keep filters when returning to a filtered inbox from dialog details', async ({ page }) => {
    await page.getByRole('button', { name: 'Legg til filter' }).click();
    await page.getByLabel('Tjenesteeier').click();
    await page.locator('#skd').click();
    await expect(page).toHaveURL(/[?&]org=skd/);
    await page.locator('#skd').press('Escape');

    await page.getByRole('link', { name: 'Skatten din for 2022' }).click();

    await page.getByRole('link', { name: 'Tilbake', exact: true }).click();

    await expect(page).toHaveURL(/[?&]org=skd/);
  });
});
