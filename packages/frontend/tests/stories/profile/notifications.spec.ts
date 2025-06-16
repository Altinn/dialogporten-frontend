import type { Page } from '@playwright/test';
import { appURLProfileNotifications } from '../..';
import { expect, test } from '../../fixtures';

test.describe('Profile Notifications Page', () => {
  test('Smoke test', async ({ page }: { page: Page }) => {
    await page.goto(appURLProfileNotifications);

    await expect(page.getByRole('heading', { name: 'Varslingsinnstillinger' })).toBeVisible();

    await expect(page.locator('div').filter({ hasText: /^Varslinger er på$/ })).toBeVisible();
    await expect(page.locator('div').filter({ hasText: /^Varslingsadresse for e-post$/ })).toBeVisible();
    await expect(page.locator('div').filter({ hasText: /^SMS-varslinger$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Kristian Haugen' })).toBeVisible();
  });

  test('Notifications switch', async ({ page }: { page: Page }) => {
    await page.goto(appURLProfileNotifications);

    await page.getByRole('switch', { name: 'Skru av' }).uncheck();
    await expect(page.getByRole('switch', { name: 'Skru på' })).toBeVisible();

    await expect(page.locator('div').filter({ hasText: /^Ingen varslinger$/ })).toBeVisible();

    await expect(page.locator('div').filter({ hasText: /^Varslinger er på$/ })).not.toBeVisible();
    await expect(page.locator('div').filter({ hasText: /^Varslingsadresse for e-post$/ })).not.toBeVisible();
    await expect(page.locator('div').filter({ hasText: /^SMS-varslinger$/ })).not.toBeVisible();

    await page.getByRole('switch', { name: 'Skru på' }).check();
    await expect(page.locator('div').filter({ hasText: /^Varslinger er på$/ })).toBeVisible();
    await expect(page.locator('div').filter({ hasText: /^Varslingsadresse for e-post$/ })).toBeVisible();
    await expect(page.locator('div').filter({ hasText: /^SMS-varslinger$/ })).toBeVisible();
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
