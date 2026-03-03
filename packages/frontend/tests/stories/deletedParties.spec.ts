import { expect, test } from '@playwright/test';
import { appUrlWithPlaywrightId } from '../index';

test('Should render deleted parties switch and filter out deleted parties', async ({ page }) => {
  const dateScenarioPage = appUrlWithPlaywrightId('deleted-parties');
  await page.goto(dateScenarioPage);

  const header = page.locator('header');
  await header.getByRole('button', { name: 'Uglesett Ask' }).click();
  await expect(header.getByText('Vis slettede')).toBeVisible();
  await expect(header.getByRole('switch', { name: 'Vis slettede' })).toBeChecked();

  await expect(header.getByText('AAvviklet Forretning Tiger')).toBeVisible(); // Deleted party

  await header.getByRole('switch', { name: 'Vis slettede' }).click();
  await expect(header.getByRole('switch', { name: 'Vis slettede' })).not.toBeChecked();
  await expect(header.getByText('AAvviklet Forretning Tiger')).not.toBeVisible();
});

test('Should render deleted parties if added to favourites', async ({ page }) => {
  const dateScenarioPage = appUrlWithPlaywrightId('deleted-parties');
  await page.goto(dateScenarioPage);

  const header = page.locator('header');
  await header.getByRole('button', { name: 'Uglesett Ask' }).click();
  await expect(header.getByText('AAvviklet Forretning Tiger')).toBeVisible(); //deleted
  await expect(header.getByText('NNedlagt Underenhet Fjellrev')).toBeVisible(); //deleted

  await header
    .getByText('AAvviklet Forretning Tiger')
    .locator('..')
    .getByLabel(/legg til i favorittar/i)
    .click();

  await header.getByRole('switch', { name: 'Vis slettede' }).click();
  await expect(header.getByRole('switch', { name: 'Vis slettede' })).not.toBeChecked();

  await expect(header.getByText('AAvviklet Forretning Tiger')).toBeVisible(); //deleted but favourited
  await expect(header.getByText('NNedlagt Underenhet Fjellrev')).not.toBeVisible(); //deleted
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

  await page.locator('#toolbar-menu-root > button').click();
  await page.locator('button[aria-label="Alle virksomheter"]').click();

  await page.waitForLoadState('networkidle');

  for (const dialogTitle of deletedOrgDialogs) {
    await expect(page.getByRole('link', { name: dialogTitle })).not.toBeVisible();
  }

  await page.getByLabel('Uglesett Ask').click();
  await page.getByRole('switch', { name: 'Vis slettede' }).click();
  await expect(page.getByRole('switch', { name: 'Vis slettede' })).toBeChecked();

  await page.getByRole('button', { name: 'Lukk kontomeny' }).click();

  await page.getByRole('button', { name: 'Alle virksomheter' }).click();

  await page.waitForLoadState('networkidle');

  for (const dialogTitle of deletedOrgDialogs) {
    await expect(page.getByRole('link', { name: dialogTitle })).toBeVisible();
  }
});
