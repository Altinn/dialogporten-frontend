import { defaultAppURL } from '../';
import { PageRoutes } from '../../src/pages/routes';
import { expect, test } from '../fixtures';
import { getSidebarMenuItem } from './common';

test.describe('Testing filter bar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(defaultAppURL);

    const toolbar = page.getByTestId('inbox-toolbar');
    await toolbar.getByRole('button', { name: /legg til/i }).click();
    await toolbar.locator('#tool-filter-add').locator('button[data-id="org"], button#org').click();
    await page
      .getByRole('menuitemcheckbox', { name: 'Skatteetaten' })
      .or(page.getByRole('checkbox', { name: 'Skatteetaten' }))
      .first()
      .click();
    await page.keyboard.press('Escape');
  });

  test('should filter when selecting sender filter and status filter', async ({ page }) => {
    expect(new URL(page.url()).searchParams.get('org')).toEqual('skd');
    await expect(page.getByRole('link', { name: 'Skatten din for 2022' })).toBeVisible();

    const removeOrgFilter = page
      .locator('[data-id="filter-button-org"]')
      .locator('..')
      .locator('button[popovertarget]')
      .or(page.getByRole('button', { name: /fjern filter/i }));
    await removeOrgFilter.click();

    expect(new URL(page.url()).searchParams.has('org')).toEqual(false);

    await page
      .getByTestId('inbox-toolbar')
      .getByRole('button', { name: /legg til/i })
      .click();

    await page
      .getByTestId('inbox-toolbar')
      .locator('#tool-filter-add')
      .locator('button[data-id="status"], button#status')
      .click();
    const statusMenu = page.getByTestId('filter-base-toolbar-filter-status');
    const completedOption = statusMenu
      .locator('[data-id="COMPLETED"]')
      .or(page.getByRole('menuitemcheckbox', { name: /avsluttet|fullført|ferdig/i }))
      .or(page.getByRole('checkbox', { name: /avsluttet|fullført|ferdig/i }));
    await completedOption.first().click();
    expect(new URL(page.url()).searchParams.get('status')).toEqual('COMPLETED');

    await page.keyboard.press('Escape');
    await expect(page.getByRole('link', { name: 'Skatten din for 2022' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Søknad om personlig bilskilt' })).toBeVisible();
  });

  test('should remove filters when changing view types', async ({ page, isMobile }) => {
    expect(new URL(page.url()).searchParams.get('org')).toEqual('skd');
    await expect(page.getByRole('link', { name: 'Skatten din for 2022' })).toBeVisible();

    if (isMobile) {
      await page.getByRole('button', { name: 'Meny' }).click();
      await page.getByRole('link', { name: 'Utkast' }).click();
      await page.getByRole('button', { name: 'Meny' }).click();
    } else {
      await getSidebarMenuItem(page, PageRoutes.drafts).click();
    }
    expect(new URL(page.url()).searchParams.has('org')).toEqual(false);
  });

  test('should keep filters when returning to a filtered inbox from ', async ({ page }) => {
    expect(new URL(page.url()).searchParams.get('org')).toEqual('skd');

    await page.getByRole('link', { name: 'Skatten din for 2022' }).click();

    await page.getByRole('link', { name: 'Tilbake', exact: true }).click();

    expect(new URL(page.url()).searchParams.get('org')).toEqual('skd');
  });
});
