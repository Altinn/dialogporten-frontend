import { expect, test } from '@playwright/test';
import { appUrlWithPlaywrightId } from '../index';

test.describe('deleted parties', () => {
  test('Should render deleted parties switch and filter out deleted parties', async ({ page }) => {
    test.slow();
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
    test.slow();
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
    test.slow();
    await page.goto(appUrlWithPlaywrightId('deleted-parties'));

    const belongsToDeletedParties = [
      'Varsel om sletting',
      'Siste skatteoppgjør',
      'Avslutning av arbeidsforhold',
      'Konkurserklæring',
      'Avslutning av virksomhet',
      'Siste MVA-oppgjør',
    ];

    const dialogsRegion = page.locator('main');

    await page.locator('#toolbar-menu-root > button').click();
    await page.getByRole('option', { name: 'Alle virksomheter' }).click();

    for (const dialogTitle of belongsToDeletedParties) {
      await expect(dialogsRegion.getByRole('link', { name: dialogTitle })).toBeVisible();
    }

    const accountSelectorButton = page.getByLabel('Uglesett Ask');
    const showDeletedSwitch = page.getByRole('switch', { name: 'Vis slettede' });

    await accountSelectorButton.click();
    await showDeletedSwitch.click();
    await expect(showDeletedSwitch).not.toBeChecked();
    await page.locator('#header-account').click();

    for (const dialogTitle of belongsToDeletedParties) {
      await expect(dialogsRegion.getByRole('link', { name: dialogTitle })).not.toBeVisible();
    }
  });
});
