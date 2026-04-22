import { appUrlWithPlaywrightId } from '../';
import { expect, test } from '../fixtures';

test.describe('Transmissions and dialog history', () => {
  test('basic navigation', async ({ page }) => {
    await page.goto(appUrlWithPlaywrightId('transmissions'));
    // Go to details for dialog with transmissions
    await page.getByRole('link', { name: 'This has no sender name' }).click();

    /* Check that the transmissions are displayed */
    await expect(page.getByRole('button', { name: 'Tittel 4' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tittel 3' })).toBeVisible();
    await page.getByRole('button', { name: 'Tittel 4' }).click();
    await expect(page.getByRole('heading', { name: 'Info i markdown for' })).toBeVisible();
    await page.getByRole('button', { name: 'Tittel 2' }).click();
    await expect(
      page.getByRole('heading', { name: 'Info i markdown for transmission (id=ttransmission-2)' }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tittel', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Tittel 4' }).click();
  });

  test('help section should show', async ({ page }) => {
    await page.goto(appUrlWithPlaywrightId('transmissions'));
    await page.getByRole('link', { name: 'This has no sender name' }).click();
    await expect(page.getByRole('heading', { name: 'Trenger du hjelp?' })).toBeVisible();
  });

  test('unauthorized transmission is shown as disabled and cannot be expanded', async ({ page }) => {
    await page.goto(appUrlWithPlaywrightId('transmissions'));
    await page.getByRole('link', { name: 'This has no sender name' }).click();

    const disabledTransmission = page.getByRole('button', { name: 'Tittel 3' }); //disabled, isAuthorized=false
    await expect(disabledTransmission).toBeVisible();
    await expect(disabledTransmission).toHaveAttribute('aria-disabled', 'true');

    await disabledTransmission.click({ force: true });
    await expect(disabledTransmission).not.toHaveAttribute('aria-expanded', 'true');

    await expect(page.getByRole('button', { name: 'Tittel 4' })).not.toHaveAttribute('aria-disabled', 'true');
  });
});
