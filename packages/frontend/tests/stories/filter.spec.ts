import { defaultAppURL } from '../';
import { PageRoutes } from '../../src/pages/routes';
import { expect, test } from '../fixtures';
import { getSidebarMenuItem } from './common';

test.describe('Testing filter bar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(defaultAppURL);

    await page.getByRole('button', { name: 'add' }).click();
    await page
      .getByTestId('inbox-toolbar')
      .getByRole('group')
      .locator('a')
      .filter({ hasText: 'Velg avsender' })
      .click();
    await page.getByTestId('inbox-toolbar').getByRole('group').getByText('Skatteetaten').click();
    await page.keyboard.press('Escape');
  });

  test('should filter when selecting sender filter and status filter', async ({ page }) => {
    expect(new URL(page.url()).searchParams.get('org')).toEqual('skd');
    await expect(page.getByRole('link', { name: 'Skatten din for 2022' })).toBeVisible();

    await page.getByRole('button', { name: 'Fjern filter' }).nth(1).click();

    expect(new URL(page.url()).searchParams.has('org')).toEqual(false);

    await page.getByRole('button', { name: 'add' }).click();

    await page.getByTestId('inbox-toolbar').getByRole('group').locator('a').filter({ hasText: 'Velg status' }).click();
    await page.getByTestId('inbox-toolbar').getByRole('group').getByText('Avsluttet').click();
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
