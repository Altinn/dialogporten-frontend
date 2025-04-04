import { expect, test } from '@playwright/test';
import { appUrlWithPlaywrightId } from '../';

test.describe('Activity history - transmissions and activities', () => {
  test('basic navigation', async ({ page }) => {
    await page.goto(appUrlWithPlaywrightId('activity-history'));
    // Go to details for dialog with activity history
    await page.getByRole('link', { name: 'This has a sender name defined' }).click();
    await page.locator('a').filter({ hasText: 'Aktivitetslogg' }).click();
    await page.getByText('Skatteetaten: Meldingen ble sendt.').click();
    await expect(page.getByText('Skatteetaten: Meldingen ble sendt.')).toBeVisible();
    await page.getByText('Skatteetaten: Meldingen ble åpnet.').click();
    await page.getByRole('button', { name: 'Tittel', exact: true }).click();
    await page.getByText('Oppsummering').click();
    await page.getByText('Skatteetaten: Denne meldingen er utløpt.').click();
    /* Click on link to scroll to transmission-2 */
    await page.getByRole('button', { name: 'Svar på Tittel 2' }).click();
    expect(page.getByRole('button', { name: 'Tittel 2', exact: true }));
  });
});
