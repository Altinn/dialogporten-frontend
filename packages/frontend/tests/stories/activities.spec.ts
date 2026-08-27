import { expect, test } from '@playwright/test';
import { appUrlWithPlaywrightId } from '../';

test.describe('Activity history - transmissions and activities', () => {
  test('basic navigation', async ({ page }) => {
    await page.goto(appUrlWithPlaywrightId('activity-history'));
    // Go to details for dialog with activity history
    await page.getByRole('link', { name: 'This has a sender name defined' }).click();
    await expect(page.getByRole('link', { name: 'Tilbake', exact: true })).toBeVisible();

    // Open modal dialog with activity history

    await page.getByRole('button', { name: 'Aktivitetslogg' }).first().click();

    const dialog = page.getByRole('dialog');

    await dialog.getByText('Skatteetaten: Meldingen ble sendt.').click();
    await expect(dialog.getByText('Skatteetaten: Meldingen ble sendt.')).toBeVisible();
    await dialog.getByText('Skatteetaten: Meldingen ble åpnet.').click();
    await dialog.getByRole('button', { name: 'Tittel', exact: true }).click();
    await dialog.getByText('Oppsummering').click();
    await dialog.getByText('Skatteetaten: Denne meldingen er utløpt.').click();

    await dialog.getByRole('button', { name: 'Lukk' }).click();
    await expect(dialog).not.toBeVisible;
  });

  test('notification log entries are merged into the activity log', async ({ page }) => {
    await page.goto(appUrlWithPlaywrightId('activity-history'));
    await page.getByRole('link', { name: 'This has a sender name defined' }).click();
    await page.getByRole('button', { name: 'Aktivitetslogg' }).first().click();

    const dialog = page.getByRole('dialog');

    // The same dispatch to several recipients is correlated into a single entry, and the
    // prefixed and unprefixed forms of the same status resolve to the same label
    await expect(
      dialog.getByText('Varsel på e-post til kari.nordmann@example.com og post@firma-as.no ble levert.'),
    ).toBeVisible();
    // The same dispatch on another channel stays a separate entry
    await expect(dialog.getByText('Varsel på SMS til +4799887766 ble sendt.')).toBeVisible();
    // A recipient that failed is not folded into the delivered ones, and keeps its own reason
    await expect(dialog.getByText('Påminnelse på e-post til kari.nordmann@example.com ble levert.')).toBeVisible();
    await expect(dialog.getByText('Påminnelse på e-post til post@firma-as.no kom i retur.')).toBeVisible();
    // A time-to-live expiry keeps its own wording rather than a generic failure
    await expect(dialog.getByText('Varsel på SMS til +4791122334 utløp før levering.')).toBeVisible();
    // Long recipient lists are capped so one dispatch cannot flood the log
    await expect(
      dialog.getByText(
        'Påminnelse på e-post til post@firma-as.no, regnskap@firma-as.no, daglig.leder@firma-as.no og 1 annen mottaker ble levert.',
      ),
    ).toBeVisible();
    // Instant and Composed dispatches are real notifications and must not be hidden
    await expect(dialog.getByText('Varsel på SMS til +4790011223 ble levert.')).toBeVisible();
    // A notification tied to a transmission renders like any other, without naming it
    await expect(dialog.getByText('Varsel på e-post til kari.nordmann@example.com ble sendt.')).toBeVisible();
    // In-flight notifications are not shown at all
    await expect(dialog.getByText('er under utsending')).toHaveCount(0);
  });

  test('label assignment log entries are merged into the activity log', async ({ page }) => {
    await page.goto(appUrlWithPlaywrightId('activity-history'));
    await page.getByRole('link', { name: 'This has a sender name defined' }).click();
    await page.getByRole('button', { name: 'Aktivitetslogg' }).first().click();

    const dialog = page.getByRole('dialog');

    // A move writes both a set and a remove; only the set is worth a sentence
    await expect(dialog.getByText('Dialogen ble flyttet til arkivet av Fantasifull 2024 Søster.')).toBeVisible();
    await expect(dialog.getByText('Dialogen ble flyttet til papirkurven av Fantasifull 2024 Søster.')).toBeVisible();
    await expect(dialog.getByText('Dialogen ble tatt ut av arkivet')).toHaveCount(0);
    await expect(dialog.getByText('Dialogen ble tatt ut av innboksen')).toHaveCount(0);

    // Whoever performed the change is named, with the same name handling as every other entry
    await expect(dialog.getByText('Dialogen ble flyttet til innboksen av Ola Nordmann.')).toBeVisible();

    // Read and unread are orthogonal to the folder, so both halves say something
    await expect(dialog.getByText('Dialogen ble markert som ulest av Fantasifull 2024 Søster.')).toBeVisible();
    await expect(dialog.getByText('Dialogen ble markert som lest av Fantasifull 2024 Søster.')).toBeVisible();

    // Sent is not something anyone filed, so it stays out of the log
    await expect(dialog.getByText('sendt av Fantasifull 2024 Søster')).toHaveCount(0);
  });
});
