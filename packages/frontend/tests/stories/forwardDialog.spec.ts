import { expect, type Page, test } from '@playwright/test';
import { appURLInbox } from '../';

const FORWARDABLE_DIALOG_TITLE = 'Melding om bortkjøring av snø';
const NON_FORWARDABLE_DIALOG_TITLE = 'Melding om hull i veien';

const openForwardModal = async (page: Page, dialogTitle: string) => {
  await page.goto(appURLInbox);
  await page.getByRole('link', { name: dialogTitle }).click();
  await expect(page.getByRole('heading', { name: dialogTitle }).first()).toBeVisible();
  await page.locator('#dialog-context-menu-root').getByRole('button', { name: 'Åpne meny' }).click();
  await page.getByRole('menuitem', { name: 'Videresend på e-post' }).click();
  return page.getByRole('dialog');
};

test.describe('Forward dialog by email', () => {
  test('forwards the message with a personal note and closes the modal', async ({ page }) => {
    const modal = await openForwardModal(page, FORWARDABLE_DIALOG_TITLE);

    await expect(modal.getByRole('heading', { name: 'Videresend på e-post' })).toBeVisible();
    await expect(modal.getByRole('button', { name: 'Videresend' })).toBeVisible();
    await expect(modal.getByRole('button', { name: 'Avbryt' })).toBeVisible();

    await expect(modal.getByText('Skill flere e-postadresser med semikolon (;).')).toBeVisible();
    await modal.getByRole('button', { name: 'Videresend' }).click();
    await expect(modal.getByText('Skriv inn minst én e-postadresse.')).toBeVisible();

    await modal.getByLabel('E-postadresse').fill('kari@example');
    await modal.getByRole('button', { name: 'Videresend' }).click();
    await expect(modal.getByText('Denne e-postadressen er ikke gyldig: kari@example')).toBeVisible();

    await modal.getByLabel('E-postadresse').fill('kari.nordmann@example.com');
    await modal.getByLabel('Personlig melding (valgfritt)').fill('Kan du se på denne?');
    await expect(modal.getByText('181 tegn igjen')).toBeVisible();
    await modal.getByRole('button', { name: 'Videresend' }).click();

    await expect(page.getByText('Meldingen er videresendt til kari.nordmann@example.com.').first()).toBeVisible();
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('keeps the form open and explains when Correspondence rejects the forward', async ({ page }) => {
    const modal = await openForwardModal(page, FORWARDABLE_DIALOG_TITLE);

    await modal.getByLabel('E-postadresse').fill('allerede.videresendt@example.com');
    await modal.getByRole('button', { name: 'Videresend' }).click();

    await expect(
      page.getByText('Meldingen er allerede videresendt til allerede.videresendt@example.com.').first(),
    ).toBeVisible();
    await expect(modal).toBeVisible();
    await expect(modal.getByLabel('E-postadresse')).toHaveValue('allerede.videresendt@example.com');
  });

  test('forwards to several recipients separated by semicolons', async ({ page }) => {
    const modal = await openForwardModal(page, FORWARDABLE_DIALOG_TITLE);

    await modal.getByLabel('E-postadresse').fill('kari@example.com; ola@example; per');
    await modal.getByRole('button', { name: 'Videresend' }).click();
    await expect(modal.getByText('Disse e-postadressene er ikke gyldige: ola@example og per')).toBeVisible();

    await modal.getByLabel('E-postadresse').fill('kari@example.com; ola@example.com;');
    await modal.getByRole('button', { name: 'Videresend' }).click();

    await expect(page.getByText('Meldingen er videresendt til 2 mottakere.').first()).toBeVisible();
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('keeps only the rejected recipients when some of them fail', async ({ page }) => {
    const modal = await openForwardModal(page, FORWARDABLE_DIALOG_TITLE);

    await modal.getByLabel('E-postadresse').fill('kari@example.com; allerede.videresendt@example.com');
    await modal.getByRole('button', { name: 'Videresend' }).click();

    await expect(page.getByText('Meldingen er videresendt til kari@example.com.').first()).toBeVisible();
    await expect(
      page.getByText('Meldingen er allerede videresendt til allerede.videresendt@example.com.').first(),
    ).toBeVisible();
    await expect(modal).toBeVisible();
    await expect(modal.getByLabel('E-postadresse')).toHaveValue('allerede.videresendt@example.com');
  });

  test('counts the recipients in the snackbar when several of them fail the same way', async ({ page }) => {
    const modal = await openForwardModal(page, FORWARDABLE_DIALOG_TITLE);

    await modal.getByLabel('E-postadresse').fill('allerede.videresendt@example.com; allerede.videresendt@example.no');
    await modal.getByRole('button', { name: 'Videresend' }).click();

    await expect(page.getByText('Meldingen er allerede videresendt til 2 mottakere.').first()).toBeVisible();
    await expect(modal.getByLabel('E-postadresse')).toHaveValue(
      'allerede.videresendt@example.com; allerede.videresendt@example.no',
    );
  });

  test('clears the form when cancelled', async ({ page }) => {
    const modal = await openForwardModal(page, FORWARDABLE_DIALOG_TITLE);

    await modal.getByLabel('E-postadresse').fill('kari.nordmann@example.com');
    await modal.getByRole('button', { name: 'Avbryt' }).click();
    await expect(page.getByRole('dialog')).toBeHidden();

    await page.locator('#dialog-context-menu-root').getByRole('button', { name: 'Åpne meny' }).click();
    await page.getByRole('menuitem', { name: 'Videresend på e-post' }).click();
    await expect(page.getByRole('dialog').getByLabel('E-postadresse')).toHaveValue('');
  });

  test('explains when the message cannot be forwarded', async ({ page }) => {
    const modal = await openForwardModal(page, NON_FORWARDABLE_DIALOG_TITLE);

    await expect(modal.getByRole('heading', { name: 'Videresending er ikke mulig' })).toBeVisible();
    await expect(modal.getByText(/taushetsbelagte.*10 MB.*«Del og gi fullmakt»/)).toBeVisible();
    await expect(modal.getByLabel('E-postadresse')).toHaveCount(0);
    await expect(modal.getByRole('button', { name: 'Videresend' })).toHaveCount(0);

    await modal.getByRole('button', { name: 'Lukk' }).last().click();
    await expect(page.getByRole('dialog')).toBeHidden();
  });
});
