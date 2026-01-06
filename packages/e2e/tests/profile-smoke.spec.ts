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

    await page.getByRole('button', { name: 'Meny', exact: true }).click();
    await page.getByRole('link', { name: 'Din profil' }).click();
    await expect(page).toHaveURL(`${baseURL}/profile`);
    await page.getByRole('button', { name: 'Lukk' }).click();
    await expect(page.getByRole('heading', { name: 'Ustabil Konditor' })).toBeVisible();
    await expect(page.getByText('Fødselsnr.: 159152')).toBeVisible();
  });

  test('should enable notifications', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/profile`);
    await page.getByRole('button', { name: 'Lukk' }).click();

    await page.getByRole('button', { name: 'Meny', exact: true }).click();
    await page.getByRole('link', { name: 'Din profil' }).first().click();

    await page.getByRole('link', { name: 'Varsler' }).click();
    await page.getByRole('button', { name: 'Konge Glad Tiger AS' }).first().click();
    const switchLocator = page.getByRole('switch', { name: 'Varsle på E-post' });

    const isChecked = await switchLocator.isChecked();

    if (!isChecked) {
      await switchLocator.check();
    } else {
      await switchLocator.uncheck();
    }

    await page.getByRole('button', { name: 'Lagre' }).click();
    await page.getByText('Varslinger ble endret').click();
  });
});
