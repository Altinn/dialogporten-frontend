import { appURLProfileLanding } from '../..';
import { expect, test } from '../../fixtures';

const appURLUsernameManagement = `${appURLProfileLanding}&playwrightId=username-management`;

test.describe('Profile Username Management', () => {
  test('creates a username and shows it in the settings list', async ({ page }) => {
    await page.goto(appURLUsernameManagement);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Brukernavn' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox', { name: 'Skriv inn brukernavn' }).fill('ola.nordmann');
    await dialog.getByRole('button', { name: 'Lagre' }).click();

    await expect(page.getByRole('button', { name: 'Brukernavn ola.nordmann' })).toBeVisible();
  });

  test('shows a format error for an invalid username', async ({ page }) => {
    await page.goto(appURLUsernameManagement);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Brukernavn' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox', { name: 'Skriv inn brukernavn' }).fill('ab');
    await dialog.getByRole('button', { name: 'Lagre' }).click();

    await expect(
      dialog.getByText(
        'Brukernavnet må være 6–64 tegn, starte med en bokstav, og kan kun inneholde bokstaver (A-Z), tall, punktum, understrek, bindestrek eller @.',
      ),
    ).toBeVisible();
  });

  test('shows a taken message when the username is already in use', async ({ page }) => {
    await page.goto(appURLUsernameManagement);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Brukernavn' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox', { name: 'Skriv inn brukernavn' }).fill('taken.username');
    await dialog.getByRole('button', { name: 'Lagre' }).click();

    await expect(dialog.getByText('I bruk - velg et annet brukernavn')).toBeVisible();
  });

  test('removes an existing username', async ({ page }) => {
    await page.goto(appURLUsernameManagement);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Brukernavn' }).click();
    const createDialog = page.getByRole('dialog');
    await createDialog.getByRole('textbox', { name: 'Skriv inn brukernavn' }).fill('ola.nordmann');
    await createDialog.getByRole('button', { name: 'Lagre' }).click();

    await page.getByRole('button', { name: 'Brukernavn ola.nordmann' }).click();
    const editDialog = page.getByRole('dialog');
    await editDialog.getByRole('button', { name: 'Fjern' }).click();

    await expect(page.getByRole('button', { name: 'Brukernavn' })).toBeVisible();
  });
});
