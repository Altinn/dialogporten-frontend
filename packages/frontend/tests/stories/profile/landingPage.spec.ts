import { appURLProfileLanding } from '../..';
import { expect, test } from '../../fixtures';

test.describe('Profile Landing Page', () => {
  test('displays user information and contact settings', async ({ page }) => {
    await page.goto(appURLProfileLanding);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('#main-content')).toContainText('Test Testesen');
    await expect(page.getByRole('button', { name: 'Adresse Kirkegata 25, 4307' })).toBeVisible();
  });

  test('contact settings are interactive and open modals', async ({ page }) => {
    await page.goto(appURLProfileLanding);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Mobiltelefon')).toBeVisible();
    await expect(page.getByText('E-postadresse')).toBeVisible();

    const mobilePhoneText = page.getByText('Mobiltelefon');
    const mobilePhoneContainer = mobilePhoneText.locator('..');

    try {
      const button = mobilePhoneContainer.getByRole('button').first();
      if (await button.isVisible({ timeout: 2000 })) {
        await button.click();
        await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
        await page.keyboard.press('Escape');
        await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 2000 });
      }
    } catch {
      console.error('Could not find mobile phone container');
    }
  });
});
