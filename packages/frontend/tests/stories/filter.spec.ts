import { expect, test } from '@playwright/test';
import { defaultAppURL } from '../';
import { PageRoutes } from '../../src/pages/routes';
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
    await page.getByTestId('inbox-toolbar').getByRole('group').getByText('checkboxSkatteetaten1').click();
    await page.mouse.click(200, 0, { button: 'left' });
  });

  test('should filter when selecting sender filter and status filter', async ({ page }) => {
    expect(new URL(page.url()).searchParams.get('sender')).toEqual('Skatteetaten');
    await expect(page.getByRole('link', { name: 'Skatten din for 2022' })).toBeVisible();

    await page.getByRole('button', { name: 'Fjern filter' }).click();

    expect(new URL(page.url()).searchParams.has('sender')).toEqual(false);

    await page.getByRole('button', { name: 'add' }).click();

    await page.getByTestId('inbox-toolbar').getByRole('group').locator('a').filter({ hasText: 'Velg status' }).click();
    await page.getByTestId('inbox-toolbar').getByRole('group').getByText('checkboxAvsluttet2').click();
    expect(new URL(page.url()).searchParams.get('status')).toEqual('COMPLETED');

    await page.mouse.click(200, 0, { button: 'left' });
    await expect(page.getByRole('link', { name: 'Skatten din for 2022' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Søknad om personlig bilskilt' })).toBeVisible();
  });

  test('should remove filters when changing view types', async ({ page }) => {
    expect(new URL(page.url()).searchParams.get('sender')).toEqual('Skatteetaten');
    await expect(page.getByRole('link', { name: 'Skatten din for 2022' })).toBeVisible();

    await getSidebarMenuItem(page, PageRoutes.drafts).click();
    expect(new URL(page.url()).searchParams.has('sender')).toEqual(false);
  });

  test('should keep filters when returning to a filtered inbox from ', async ({ page }) => {
    expect(new URL(page.url()).searchParams.get('sender')).toEqual('Skatteetaten');

    await page.getByRole('link', { name: 'Skatten din for 2022' }).click();

    await page.getByRole('link', { name: 'Tilbake' }).click();

    expect(new URL(page.url()).searchParams.get('sender')).toEqual('Skatteetaten');
  });
});
