// import type { Page } from '@playwright/test';
// import { appURLProfileLanding, appURLProfileNotifications, appURLProfileSettings } from '../..';
// import { expect, test } from '../../fixtures';

// test.describe('Profile Landing Page', () => {
//   test('Smoke test', async ({ page }: { page: Page }) => {
//     await page.goto(appURLProfileLanding);

//     await expect(page.getByRole('navigation').filter({ hasText: 'ForsideMin profil' })).toBeVisible();

//     await expect(page.getByRole('heading', { name: 'John Doe' })).toBeVisible();
//     await expect(page.getByRole('link', { name: 'Varsler er på' })).toBeVisible();
//     await expect(page.getByRole('link', { name: 'Flere innstillinger' })).toBeVisible();
//   });

//   test('Navigation redirects correctly', async ({ page }: { page: Page }) => {
//     await page.goto(appURLProfileLanding);

//     await page.getByRole('link', { name: 'Varsler er på' }).click();
//     expect(new URL(page.url()).pathname).toBe(new URL(appURLProfileNotifications).pathname);

//     await page.goBack();
//     await expect(page.getByRole('heading', { name: 'John Doe' })).toBeVisible();

//     await page.getByRole('link', { name: 'Flere innstillinger' }).click();
//     expect(new URL(page.url()).pathname).toBe(new URL(appURLProfileSettings).pathname);
//   });
// });
