import { expect, test } from '@playwright/test';
import { appUrlWithPlaywrightId } from '../index';

test('Should render deleted parties switch and filter out deleted parties', async ({ page }) => {
  const dateScenarioPage = appUrlWithPlaywrightId('deleted-parties');
  await page.goto(dateScenarioPage);

  await page.getByLabel('Uglesett Ask').click();
  await expect(page.getByText('Vis slettede')).toBeVisible();
  await expect(page.getByRole('switch', { name: 'Vis slettede' })).toBeChecked();

  await page.getByRole('button', { name: 'Lukk kontomeny' }).click();

  await page.getByTestId('account-menu-button').click();
  await expect(page.locator('a').filter({ hasText: 'AAvviklet Forretning Tiger' })).toBeVisible(); // Deleted party

  await page.keyboard.press('Escape');

  await page.getByLabel('Uglesett Ask').click();
  await page.getByRole('switch', { name: 'Vis slettede' }).click();
  await page.getByRole('button', { name: 'Lukk kontomeny' }).click();

  await page.getByTestId('account-menu-button').click();
  await expect(page.locator('a').filter({ hasText: 'AAvviklet Forretning Tiger' })).not.toBeVisible();
});

test('Should render deleted parties if added to favourites', async ({ page }) => {
  const dateScenarioPage = appUrlWithPlaywrightId('deleted-parties');
  await page.goto(dateScenarioPage);

  await page.getByTestId('account-menu-button').click();
  await expect(page.locator('a').filter({ hasText: 'AAvviklet Forretning Tiger' })).toBeVisible(); //deleted
  await expect(page.locator('a').filter({ hasText: 'NNedlagt Underenhet Fjellrev' })).toBeVisible(); //deleted

  await page.keyboard.press('Escape');

  await page.getByLabel('Uglesett Ask').click();
  await page
    .locator('span')
    .filter({ hasText: 'AAvviklet Forretning Tiger' })
    .getByLabel('Legg til i favorittar')
    .click();

  await page.getByRole('switch', { name: 'Vis slettede' }).click();
  await expect(page.getByRole('switch', { name: 'Vis slettede' })).not.toBeChecked();
  await page.getByRole('button', { name: 'Lukk kontomeny' }).click();

  await page.getByTestId('account-menu-button').click();
  await expect(page.locator('a').filter({ hasText: 'AAvviklet Forretning Tiger' })).toBeVisible(); //deleted but favourited
  await expect(page.locator('a').filter({ hasText: 'NNedlagt Underenhet Fjellrev' })).not.toBeVisible(); //deleted
});

test('Should exclude dialogs from deleted organizations when filter is OFF', async ({ page }) => {
  const dateScenarioPage = appUrlWithPlaywrightId('deleted-parties');
  await page.goto(dateScenarioPage);

  // Dialogs from deleted organizations
  const deletedOrgDialogs = [
    'Varsel om sletting',
    'Siste skatteoppgjør',
    'Avslutning av arbeidsforhold',
    'Konkurserklæring',
    'Avslutning av virksomhet',
    'Siste MVA-oppgjør',
  ];

  await page.getByLabel('Uglesett Ask').click();
  await page.getByRole('switch', { name: 'Vis slettede' }).click();
  await expect(page.getByRole('switch', { name: 'Vis slettede' })).not.toBeChecked();

  await page.getByRole('button', { name: 'Lukk kontomeny' }).click();

  await page.getByTestId('account-menu-button').click();
  await page.locator('a').filter({ hasText: 'Alle virksomheter' }).click();

  await page.waitForLoadState('networkidle');

  for (const dialogTitle of deletedOrgDialogs) {
    await expect(page.getByRole('link', { name: dialogTitle })).not.toBeVisible();
  }

  await page.getByLabel('Uglesett Ask').click();
  await page.getByRole('switch', { name: 'Vis slettede' }).click();
  await expect(page.getByRole('switch', { name: 'Vis slettede' })).toBeChecked();

  await page.getByRole('button', { name: 'Lukk kontomeny' }).click();

  await page.getByTestId('account-menu-button').click();
  await page.locator('a').filter({ hasText: 'Alle virksomheter' }).click();

  await page.waitForLoadState('networkidle');

  for (const dialogTitle of deletedOrgDialogs) {
    await expect(page.getByRole('link', { name: dialogTitle })).toBeVisible();
  }
});
