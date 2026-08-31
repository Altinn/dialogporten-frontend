import { expect, type Locator, type Page, test } from '@playwright/test';
import { appUrlWithPlaywrightId } from '../';

/**
 * A transmission the end user sent themselves must never be presented as unread — see the rule
 * documented on `isTransmissionUnread`. This story covers a dialog that carries transmissions but
 * an empty activity list, which a dialog is not required to have.
 */
const transmission = (page: Page, title: string): Locator =>
  page.locator('li[data-variant]').filter({ hasText: title }).filter({ visible: true });

const expectUnread = async (item: Locator, unread: boolean) => {
  await expect(item).toHaveCount(1);
  await expect(item).toHaveAttribute('data-variant', unread ? 'subtle' : 'default');
  await expect(item.locator('span[data-weight]:has(h2)')).toHaveAttribute('data-weight', unread ? 'bold' : 'normal');
};

test.describe('Unread transmissions in a dialog without activities', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(appUrlWithPlaywrightId('transmissions-without-activities'));
    await page.getByRole('link', { name: 'Dialog uten aktivitetslogg' }).click();
    await expect(page.getByRole('link', { name: 'Tilbake', exact: true })).toBeVisible();
  });

  test('marks the message from the service owner as unread', async ({ page }) => {
    // Control: nothing has been opened, so the incoming message is genuinely unread
    await expectUnread(transmission(page, 'Melding fra etaten'), true);
  });

  test('does not mark the end user own submission as unread', async ({ page }) => {
    await expectUnread(transmission(page, 'Mitt svar til etaten'), false);
  });
});
