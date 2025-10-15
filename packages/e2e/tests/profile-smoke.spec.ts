import { expect, test } from '@playwright/test';
import { loginUser } from './utils/auth';

test.describe('Profile smoke tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test.afterEach(async ({ page }) => {
    await page.close();
  });

  test('should navigate to profile from inbox', async ({ page, baseURL }) => {
    await expect(page).toHaveURL(`${baseURL}/`);
    await page.getByRole('button', { name: 'Prøv ny innboks' }).click();
    await page.getByRole('button', { name: 'Lukk' }).click();

    await page.getByRole('button', { name: 'Meny', exact: true }).click();
    await page.getByRole('link', { name: 'Min profil' }).click();
    await expect(page).toHaveURL(`${baseURL}/profile`);
    await expect(page.getByRole('heading', { name: 'Ustabil Konditor' })).toBeVisible();
    await expect(page.getByText('Fødselsnr: 159152')).toBeVisible();
  });

  test('should enable notifications', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/profile?mock=true`);

    await page.getByRole('link', { name: 'Mine varsler' }).click();
    await page.getByRole('button', { name: 'Konge Glad Tiger AS' }).first().click();
    await page.getByRole('switch', { name: 'Varsle på E-post' }).check();
    expect(page.getByRole('button', { name: 'Lagre' })).not.toBeDisabled();
    await page.getByRole('button', { name: 'Lagre' }).click();
    expect(page.getByRole('alert')).toBeVisible();

    await page.getByText('KKonge Glad Tiger ASnullstillt@default.digdir.no').click();
    await page.getByRole('switch', { name: 'Varsle på E-post' }).uncheck();
    await page.getByRole('button', { name: 'Lagre' }).click();

    await expect(page.locator('section').filter({ hasText: 'Varslingsprofil for e-' })).toBeVisible();
  });
});
