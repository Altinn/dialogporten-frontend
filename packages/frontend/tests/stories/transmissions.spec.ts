import { expect, test } from '@playwright/test';
import { appUrlWithPlaywrightId } from '../';

test.describe('Transmissions and dialog history', () => {
  test('basic navigation', async ({ page }) => {
    await page.goto(appUrlWithPlaywrightId('transmissions'));
    // Go to details for dialog with transmissions
    await page.getByRole('link', { name: 'This has no sender name' }).click();
    /* Check that the tabs hiding tranmissions for dialog are displayed and working */
    await expect(page.locator('a').filter({ hasText: 'Siste aktivitet' })).toBeVisible();
    await expect(page.locator('a').filter({ hasText: 'Tilleggsinformasjon' })).toBeVisible();
    await expect(page.locator('a').filter({ hasText: 'Aktivitetslogg' })).toBeVisible();

    await page.locator('a').filter({ hasText: 'Tilleggsinformasjon' }).click();
    await expect(page.getByText('Denne setningen inneholder')).toBeVisible();

    /* Check that the transmissions are displayed */
    await page.locator('a').filter({ hasText: 'Siste aktivitet' }).click();
    await expect(page.getByRole('button', { name: 'Tittel 4' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tittel 3' })).toBeVisible();
    await page.getByRole('button', { name: 'Tittel 4' }).click();
    await expect(page.getByRole('heading', { name: 'Info i markdown for' })).toBeVisible();
    await page.getByRole('button', { name: 'Svar på Tittel' }).click();
    await page.getByRole('button', { name: 'Tittel 2' }).click();
    await expect(
      page.getByRole('heading', { name: 'Info i markdown for transmission (id=ttransmission-2)' }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tittel', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Skjul historikk' }).click();
    await page.getByRole('button', { name: 'Tittel 4' }).click();
  });
});
