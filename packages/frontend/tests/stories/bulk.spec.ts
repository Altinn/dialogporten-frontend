import { expect, test } from '@playwright/test';
import { defaultAppURL } from '../index';

test('should select dialogs move them to bin - a smoke test', async ({ page }) => {
  await page.goto(defaultAppURL);

  await page
    .locator('#dialog-context-menu-019241f7-5fa0-7336-934d-716a8e5bbb49-root')
    .getByRole('button', { name: 'Åpne meny' })
    .click();
  await page.locator('#dialog-context-menu-019241f7-5fa0-7336-934d-716a8e5bbb49').getByLabel('Velg flere').click();
  await page.getByRole('button', { name: 'Nabovarsel for Louises gate' }).click();
  await page.getByRole('button', { name: 'Undersøkelse om levekår' }).click();
  await page.getByRole('button', { name: 'Arbeidsavklaringspenger' }).click();
  await page.getByRole('button', { name: 'Flytt til papirkurven' }).click();
  await expect(page.getByText('Flyttet 4 elementer til')).toBeVisible();
});
