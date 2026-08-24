import { expect, type Page, test } from '@playwright/test';
import { appUrlWithPlaywrightId } from '../';

/**
 * Declining a gui action's confirmation prompt sends nothing and mutates nothing, so no dialog
 * update will ever be pushed for that click. The action must therefore be left usable.
 */
const actionButton = (page: Page) => page.getByRole('button', { name: 'Send inn' });

const openDialog = async (page: Page) => {
  await page.goto(appUrlWithPlaywrightId('gui-action-prompt'));
  await page.getByRole('link', { name: 'Dialog med bekreftelsesdialog' }).click();
  await expect(page.getByRole('link', { name: 'Tilbake', exact: true })).toBeVisible();
};

test.describe('Gui action with a confirmation prompt', () => {
  test('asks for confirmation before submitting', async ({ page }) => {
    await openDialog(page);
    await expect(actionButton(page)).toBeEnabled();

    // The handler has to dismiss inline: click() does not resolve while a JS dialog is open
    let seen: { type: string; message: string } | undefined;
    page.once('dialog', (confirm) => {
      seen = { type: confirm.type(), message: confirm.message() };
      void confirm.dismiss();
    });

    await actionButton(page).click();

    expect(seen).toEqual({ type: 'confirm', message: 'Er du sikker på at du vil sende inn?' });
  });

  test('leaves the action usable after the prompt is declined', async ({ page }) => {
    await openDialog(page);
    page.on('dialog', (confirm) => confirm.dismiss());

    await actionButton(page).click();

    await expect(actionButton(page)).toBeEnabled();
  });
});
