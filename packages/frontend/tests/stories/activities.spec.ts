import { appUrlWithPlaywrightId } from '../';
import { expect, test } from '../fixtures';

test.describe('Activity history - transmissions and activities', () => {
  test('basic navigation', async ({ page }) => {
    await page.goto(appUrlWithPlaywrightId('activity-history'));
    // Go to details for dialog with activity history
    await page.getByRole('link', { name: 'This has a sender name defined' }).click();
    await expect(page.getByRole('link', { name: 'Tilbake' })).toBeVisible();

    // Open modal dialog with activity history

    await page.getByRole('button', { name: 'Aktivitetslogg' }).first().click();

    const dialog = page.getByRole('dialog');

    await dialog.getByText('Skatteetaten: Meldingen ble sendt.').click();
    await expect(dialog.getByText('Skatteetaten: Meldingen ble sendt.')).toBeVisible();
    await dialog.getByText('Skatteetaten: Meldingen ble åpnet.').click();
    await dialog.getByRole('button', { name: 'Tittel', exact: true }).click();
    await dialog.getByText('Oppsummering').click();
    await dialog.getByText('Skatteetaten: Denne meldingen er utløpt.').click();

    await dialog.getByRole('button', { name: 'Lukk' }).click();
    await expect(dialog).not.toBeVisible;
  });
});
