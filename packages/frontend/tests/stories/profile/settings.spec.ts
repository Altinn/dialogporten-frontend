import type { Page } from '@playwright/test';
import { appURLProfileNotifications, appURLProfileSettings } from '../..';
import { expect, test } from '../../fixtures';

test.describe('Profile Settings Page', () => {
  test('Smoke test', async ({ page }: { page: Page }) => {
    await page.goto(appURLProfileSettings);

    await expect(page.getByRole('heading', { name: 'Kontaktinformasjon' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Flere innstillinger' })).toBeVisible();
  });

  test('Navigations redirects', async ({ page }: { page: Page }) => {
    await page.goto(appURLProfileSettings);

    await expect(page.getByRole('link', { name: 'Varselinnstillinger' })).toBeVisible();
    await page.getByRole('link', { name: 'Varselinnstillinger' }).click();
    expect(new URL(page.url()).pathname).toBe(new URL(appURLProfileNotifications).pathname);
  });
});
