import { appUrlWithPlaywrightId } from '..';
import { expect, test } from '../fixtures';

test.describe('Sent and Awaiting status', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(appUrlWithPlaywrightId('awaiting-dialogs'));
  });

  test('Shows dialogs with awaiting status', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Mock Dialog Awaiting', level: 2 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Melding om bortkjøring av snø i 2024', level: 2 })).toBeVisible();
  });

  test('Can filter by awaiting status using status filter', async ({ page }) => {
    await page.getByRole('button', { name: 'Legg til filter' }).click();
    await page.getByLabel('Status').click();
    await page.getByRole('menuitemcheckbox', { name: 'Til behandling' }).click();
    expect(new URL(page.url()).searchParams.get('status')).toEqual('AWAITING');
    await expect(page.getByRole('heading', { name: 'Mock Dialog Awaiting', level: 2 })).toBeVisible();
  });
});
