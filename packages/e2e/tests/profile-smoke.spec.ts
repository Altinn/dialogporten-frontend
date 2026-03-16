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

    await page.goto(`${baseURL}/profile`);
    await expect(page).toHaveURL(`${baseURL}/profile`);
    const closeButton = page.getByRole('button', { name: 'Lukk' });
    if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeButton.click();
    }
    await expect(page.getByRole('heading', { name: 'Ustabil Konditor' })).toBeVisible();
    await expect(page.getByText('Fødselsnr.: 159152')).toBeVisible();
  });

  /* TODO: We need to find a better test case */
  test.skip('should enable notifications', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/profile`);
    const closeButton = page.getByRole('button', { name: 'Lukk' });
    if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeButton.click();
    }

    await page
      .getByRole('link', { name: 'Varsler' })
      .or(page.getByRole('menuitem', { name: 'Varsler' }))
      .first()
      .click();
    await page.getByRole('button', { name: 'Konge Glad Tiger AS' }).first().click();
    const switchLocator = page.getByRole('switch', { name: /varsle på e-post/i });

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
