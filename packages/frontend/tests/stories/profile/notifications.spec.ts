import type { Page } from '@playwright/test';
import { appURLProfileNotifications } from '../..';
import { expect, test } from '../../fixtures';

test.describe('Profile Notifications Page', () => {
  test('displays the primary SMS and email notification addresses', async ({ page }: { page: Page }) => {
    await page.goto(appURLProfileNotifications);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Varslingsadresser', level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Varslinger på SMS' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Varslinger på e-post' })).toBeVisible();
  });

  test('opening an address shows the KRR-sourced contact info in a dialog', async ({ page }: { page: Page }) => {
    await page.goto(appURLProfileNotifications);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Varslinger på SMS' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Kontakt- og reservasjonsregisteret')).toBeVisible();
    await expect(dialog.getByRole('link', { name: 'Endre kontaktinformasjon' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });
});
