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
});
