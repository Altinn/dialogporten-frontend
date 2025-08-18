import type { Page } from '@playwright/test';
import { appURLProfileNotifications } from '../..';
import { expect, test } from '../../fixtures';

test.describe('Profile Notifications Page', () => {
  test('Smoke test', async ({ page }: { page: Page }) => {
    await page.goto(appURLProfileNotifications);

    await expect(page.getByRole('heading', { name: 'Varselinnstillinger' })).toBeVisible();

    await expect(page.getByText('Varsler er på', { exact: false })).toBeVisible();
    await expect(page.getByText('E-postadresse for varsler', { exact: false })).toBeVisible();
    await expect(page.getByText('SMS-varsler', { exact: false })).toBeVisible();

    await expect(page.getByRole('button', { name: 'Kristian Haugen' })).toBeVisible();
  });

  test('Notifications switch', async ({ page }: { page: Page }) => {
    await page.goto(appURLProfileNotifications);

    await page.getByRole('switch', { name: 'Skru av' }).uncheck();
    await expect(page.getByRole('switch', { name: 'Skru på' })).toBeVisible();

    await expect(page.locator('div').filter({ hasText: /^Ingen varsler$/ })).toBeVisible();

    await expect(page.getByText('Varsler er på', { exact: false })).not.toBeVisible();
    await expect(page.getByText('E-postadresse for varsler', { exact: false })).not.toBeVisible();
    await expect(page.getByText('SMS-varsler', { exact: false })).not.toBeVisible();

    await page.getByRole('switch', { name: 'Skru på' }).check();

    await expect(page.getByText('Varsler er på', { exact: false })).toBeVisible();
    await expect(page.getByText('E-postadresse for varsler', { exact: false })).toBeVisible();
    await expect(page.getByText('SMS-varsler', { exact: false })).toBeVisible();
  });

  test('Actor shows options on click', async ({ page }: { page: Page }) => {
    await page.goto(appURLProfileNotifications);

    await expect(page.getByText('Varsle på SMS')).not.toBeVisible();
    await page.getByRole('button', { name: 'Kristian Haugen' }).click();
    await expect(page.getByText('Varsle på SMS')).toBeVisible();

    await expect(page.getByPlaceholder('Mobiltelefon')).not.toBeVisible();
    await expect(page.getByRole('textbox', { name: 'E-postadresse' })).not.toBeVisible();

    await page.getByRole('switch', { name: 'Varsle på SMS' }).check();
    await page.getByRole('switch', { name: 'Varsle på e-post' }).check();

    await expect(page.getByPlaceholder('Mobiltelefon')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'E-postadresse' })).toBeVisible();
  });
});
