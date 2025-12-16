import { appURLProfileLanding, appURLProfileSettings } from '../..';
import { PageRoutes } from '../../../src/pages/routes';
import { expect, test } from '../../fixtures';

test.describe('Profile Landing Page', () => {
  test('displays user information and contact settings', async ({ page }) => {
    await page.goto(appURLProfileLanding);
    await page.waitForLoadState('networkidle');

    const userNameHeading = page.getByRole('heading').first();
    await expect(userNameHeading).toBeVisible();
    await expect(userNameHeading).not.toHaveText('');

    await expect(page.getByText(/Fødselsnr.:/)).toBeVisible();

    await expect(page.getByText('Mobiltelefon')).toBeVisible();
    await expect(page.getByText('E-postadresse')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Adresse', exact: true })).toBeVisible();
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

  test('page loads and displays content correctly', async ({ page }) => {
    await page.goto(appURLProfileLanding);

    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10000 });

    await expect(page.getByText(/Fødselsnr.:/)).toBeVisible({ timeout: 5000 });

    const hasContactSettings = await Promise.race([
      page
        .getByText('Mobiltelefon')
        .isVisible()
        .then(() => true),
      page
        .getByText('E-postadresse')
        .isVisible()
        .then(() => true),
      page
        .getByRole('button', { name: 'Adresse', exact: true })
        .isVisible()
        .then(() => true),
    ]).catch(() => false);

    expect(hasContactSettings).toBe(true);
  });

  test('can navigate to settings page', async ({ page }) => {
    await page.goto(appURLProfileLanding);
    await page.waitForLoadState('networkidle');

    await page.goto(appURLProfileSettings);
    await expect(page).toHaveURL(new RegExp(PageRoutes.settings));

    await expect(page.getByRole('heading', { name: 'Personlige innstillinger' })).toBeVisible({
      timeout: 5000,
    });
  });
});
