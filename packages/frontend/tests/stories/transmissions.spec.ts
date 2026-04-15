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

  test('help section - no contact buttons when org has no contact info', async ({ page }) => {
    await page.goto(appUrlWithPlaywrightId('transmissions'));
    // nav org has no contact info in mock data
    await page.getByRole('link', { name: 'This has no sender name' }).click();

    await expect(page.getByRole('heading', { name: 'Trenger du hjelp?' })).toBeVisible();
    await expect(page.getByText('Spørsmål om innholdet')).not.toBeVisible();
    await expect(page.getByRole('link', { name: 'Kontakt avsender' })).not.toBeVisible();
    await expect(page.getByRole('link', { name: 'Hjelp meg å forstå meldingen' })).toBeVisible();
  });

  test('help section - shows contact buttons when org has contact info', async ({ page }) => {
    await page.goto(appUrlWithPlaywrightId('transmissions'));
    // ok (Oslo kommune) org has contact phone + url in mock data
    await page.getByRole('link', { name: 'This has a sender name' }).click();

    await expect(page.getByRole('heading', { name: 'Trenger du hjelp?' })).toBeVisible();
    await expect(
      page.getByText('Spørsmål om innholdet må du stille til den som har sendt deg meldingen.'),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Kontakt SENDER NAME Oslo Kommune' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ring 21 80 21 80' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Hjelp meg å forstå meldingen' })).toBeVisible();
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
