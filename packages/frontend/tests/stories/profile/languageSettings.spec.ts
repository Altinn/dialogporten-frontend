import { appURLProfileLanding } from '../..';
import { expect, test } from '../../fixtures';

test.describe('Profile Language Settings', () => {
  test('changing the language updates the UI and persists the choice', async ({ page }) => {
    await page.goto(appURLProfileLanding);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Språk/language' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('radio', { name: 'Bokmål' })).toBeChecked();

    await dialog.getByRole('radio', { name: 'Nynorsk' }).click();
    await dialog.getByRole('button', { name: 'Lagre' }).click();

    await expect(page.getByRole('heading', { name: 'Dine innstillingar i Altinn', level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Språk/language Nynorsk' })).toBeVisible();
  });

  test('cancelling the language dialog keeps the current language', async ({ page }) => {
    await page.goto(appURLProfileLanding);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Språk/language' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('radio', { name: 'English' }).click();
    await dialog.getByRole('button', { name: 'Avbryt' }).click();

    await expect(page.getByRole('heading', { name: 'Dine innstillinger i Altinn', level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Språk/language Bokmål' })).toBeVisible();
  });
});
