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
    const toolbar = page.getByTestId('inbox-toolbar');
    await toolbar.getByRole('button', { name: /legg til/i }).click();
    const addMenu = toolbar.locator('#tool-filter-add');

    await addMenu.locator('button[data-id="status"], button#status').click();
    await page
      .getByRole('menuitemcheckbox', { name: /til behandling/i })
      .or(page.getByRole('checkbox', { name: /til behandling/i }))
      .first()
      .click();
    await page.keyboard.press('Escape');
    expect(new URL(page.url()).searchParams.get('status')).toEqual('AWAITING');
    await expect(page.getByRole('heading', { name: 'Mock Dialog Awaiting', level: 2 })).toBeVisible();
  });

  test('Can filter to show only awaiting status dialogs', async ({ page }) => {
    const toolbar = page.getByTestId('inbox-toolbar');
    await toolbar.getByRole('button', { name: /legg til/i }).click();
    await toolbar.locator('#tool-filter-add').locator('button[data-id="status"], button#status').click();
    await page
      .getByRole('menuitemcheckbox', { name: /til behandling/i })
      .or(page.getByRole('checkbox', { name: /til behandling/i }))
      .first()
      .click();
    await page.keyboard.press('Escape');

    expect(new URL(page.url()).searchParams.get('status')).toEqual('AWAITING');

    await expect(page.getByRole('heading', { name: 'Mock Dialog Awaiting', level: 2 })).toBeVisible();
  });
});
