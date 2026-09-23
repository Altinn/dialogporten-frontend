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

    // The same dispatch to several recipients is correlated into a single entry
    await expect(
      dialog.getByText('Varsel på e-post til kari.nordmann@example.com og post@firma-as.no ble levert.'),
    ).toBeVisible();
    // The same dispatch on another channel stays a separate entry
    await expect(dialog.getByText('Varsel på SMS til +4799887766 ble levert.')).toBeVisible();
    await expect(dialog.getByText('Påminnelse på e-post til kari.nordmann@example.com ble levert.')).toBeVisible();
    // Long recipient lists are capped so one dispatch cannot flood the log
    await expect(
      dialog.getByText(
        'Påminnelse på e-post til post@firma-as.no, regnskap@firma-as.no, daglig.leder@firma-as.no og 1 annen mottaker ble levert.',
      ),
    ).toBeVisible();
    // A notification tied to a transmission renders like any other, without naming it
    await expect(dialog.getByText('Varsel på e-post til kari.nordmann@example.com ble levert.')).toBeVisible();
  });

  test('label assignment log entries are merged into the activity log', async ({ page }) => {
    await page.goto(appUrlWithPlaywrightId('activity-history'));
    await page.getByRole('link', { name: 'This has a sender name defined' }).click();
    await page.getByRole('button', { name: 'Aktivitetslogg' }).first().click();

    const dialog = page.getByRole('dialog');

    // A move writes both a set and a remove; only the set is worth a sentence
    await expect(dialog.getByText('Fantasifull 2024 Søster flyttet meldingen til arkivet.')).toBeVisible();
    await expect(dialog.getByText('Fantasifull 2024 Søster flyttet meldingen til papirkurven.')).toBeVisible();
    await expect(dialog.getByText('flyttet meldingen ut av innboksen')).toHaveCount(0);

    // Whoever performed the change is named, with the same name handling as every other entry
    await expect(dialog.getByText('Ola Nordmann flyttet meldingen til innboksen.')).toHaveCount(1);

    // Read and unread are orthogonal to the folder, so both halves say something
    await expect(dialog.getByText('Fantasifull 2024 Søster markerte meldingen som ulest.')).toBeVisible();
    await expect(dialog.getByText('Fantasifull 2024 Søster markerte meldingen som lest.')).toBeVisible();

    // Sent is not something anyone filed, so it stays out of the log
    await expect(dialog.getByText('sendt av Fantasifull 2024 Søster')).toHaveCount(0);
  });

  test('filters the activity log by type of activity', async ({ page }) => {
    await page.goto(appUrlWithPlaywrightId('activity-history'));
    await page.getByRole('link', { name: 'This has a sender name defined' }).click();
    await page.getByRole('button', { name: 'Aktivitetslogg' }).first().click();

    const dialog = page.getByRole('dialog');
    const activityEntry = dialog.getByText('Skatteetaten: Meldingen ble sendt.');
    const notificationEntry = dialog.getByText('Varsel på SMS til +4799887766 ble levert.');
    const labelEntry = dialog.getByText('Fantasifull 2024 Søster flyttet meldingen til arkivet.');
    const transmissionEntry = dialog.getByRole('button', { name: 'Tittel', exact: true });
    const allTypes = dialog.getByRole('menuitemradio', { name: 'Alle typer' });

    // Every type is in the log until the filter narrows it
    await expect(dialog.getByRole('button', { name: 'Alle typer' })).toBeVisible();
    await expect(activityEntry).toBeVisible();
    await expect(notificationEntry).toBeVisible();
    await expect(labelEntry).toBeVisible();
    await expect(transmissionEntry).toBeVisible();

    await dialog.getByRole('button', { name: 'Alle typer' }).click();

    // One heading, on the first group only, with the kinds counted below the divider
    await expect(dialog.getByText('Velg type')).toHaveCount(1);
    await expect(allTypes).toBeChecked();

    // Ticking a kind unticks "Alle typer" — the two can never be on together
    await dialog.getByRole('menuitemcheckbox', { name: 'Varsler' }).click();
    await expect(allTypes).not.toBeChecked();
    await expect(dialog.getByRole('button', { name: 'Varsler' })).toBeVisible();
    await expect(notificationEntry).toBeVisible();
    await expect(activityEntry).toHaveCount(0);
    await expect(labelEntry).toHaveCount(0);
    await expect(transmissionEntry).toHaveCount(0);

    // The menu stays open for checkboxes, so a second kind can be added
    await dialog.getByRole('menuitemcheckbox', { name: 'Flytting og merking' }).click();
    await expect(dialog.getByRole('button', { name: '2 typer' })).toBeVisible();
    await expect(notificationEntry).toBeVisible();
    await expect(labelEntry).toBeVisible();
    await expect(activityEntry).toHaveCount(0);

    // Ticking every kind is the same as no filtering, so it collapses back
    await dialog.getByRole('menuitemcheckbox', { name: 'Aktiviteter' }).click();
    await dialog.getByRole('menuitemcheckbox', { name: 'Forsendelser' }).click();
    await expect(dialog.getByRole('button', { name: 'Alle typer' })).toBeVisible();
    await expect(allTypes).toBeChecked();
    await expect(activityEntry).toBeVisible();
    await expect(notificationEntry).toBeVisible();
    await expect(labelEntry).toBeVisible();
    await expect(transmissionEntry).toBeVisible();

    // The radio clears everything back to all types
    await dialog.getByRole('menuitemcheckbox', { name: 'Varsler' }).click();
    await expect(dialog.getByRole('button', { name: 'Varsler' })).toBeVisible();
    await dialog.getByRole('menuitemradio', { name: 'Alle typer' }).click();
    await expect(dialog.getByRole('button', { name: 'Alle typer' })).toBeVisible();
    await expect(activityEntry).toBeVisible();
  });

  test('searches the activity log across every type of entry', async ({ page }) => {
    await page.goto(appUrlWithPlaywrightId('activity-history'));
    await page.getByRole('link', { name: 'This has a sender name defined' }).click();
    await page.getByRole('button', { name: 'Aktivitetslogg' }).first().click();

    const dialog = page.getByRole('dialog');
    const search = dialog.getByRole('searchbox');
    const activityEntry = dialog.getByText('Skatteetaten: Meldingen ble sendt.');
    const notificationEntry = dialog.getByText('Varsel på SMS til +4799887766 ble levert.');

    // A term only the notification entries carry
    await search.fill('sms');
    await expect(notificationEntry).toBeVisible();
    await expect(activityEntry).toHaveCount(0);

    // Every term has to match, so an unrelated second term empties the log
    await search.fill('sms skatteetaten');
    await expect(dialog.getByText('Ingen treff')).toBeVisible();

    // Transmissions are searchable by title even though they render as expandable cards
    await search.fill('Språktest');
    await expect(dialog.getByRole('button', { name: 'Språktest: innhold per språk' })).toBeVisible();
    await expect(notificationEntry).toHaveCount(0);

    // Search and the type filter narrow together
    await search.fill('meldingen');
    await dialog.getByRole('button', { name: 'Alle typer' }).click();
    await dialog.getByRole('menuitemcheckbox', { name: 'Flytting og merking' }).click();
    // Checkboxes keep the menu open, so close it before touching the toolbar again
    await page.keyboard.press('Escape');
    await expect(dialog.getByRole('button', { name: 'Flytting og merking' })).toBeVisible();
    await expect(dialog.getByText('Fantasifull 2024 Søster flyttet meldingen til arkivet.')).toBeVisible();
    await expect(activityEntry).toHaveCount(0);

    await search.fill('');
    await expect(dialog.getByText('Ola Nordmann flyttet meldingen til innboksen.')).toBeVisible();
  });

  test('highlights the matched words, inside transmission cards too', async ({ page }) => {
    await page.goto(appUrlWithPlaywrightId('activity-history'));
    await page.getByRole('link', { name: 'This has a sender name defined' }).click();
    await page.getByRole('button', { name: 'Aktivitetslogg' }).first().click();

    const dialog = page.getByRole('dialog');
    const search = dialog.getByRole('searchbox');

    // Case-insensitive, and the actor keeps its bold with the mark nested inside
    await search.fill('SKATTEETATEN');
    await expect(dialog.locator('mark', { hasText: 'Skatteetaten' }).first()).toBeVisible();
    await expect(dialog.locator('strong mark').first()).toBeVisible();

    // A transmission renders its own card, and the title is marked inside it
    await search.fill('språktest');
    await expect(dialog.locator('mark', { hasText: 'Språktest' }).first()).toBeVisible();
  });

  test('says so plainly when nothing matches, without a heading or a reset button', async ({ page }) => {
    await page.goto(appUrlWithPlaywrightId('activity-history'));
    await page.getByRole('link', { name: 'This has a sender name defined' }).click();
    await page.getByRole('button', { name: 'Aktivitetslogg' }).first().click();

    const dialog = page.getByRole('dialog');
    const search = dialog.getByRole('searchbox');

    await search.fill('finnes ikke');
    await expect(dialog.getByText('Ingen treff')).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Ingen treff' })).toHaveCount(0);
    await expect(dialog.getByRole('button', { name: 'Nullstill alt' })).toHaveCount(0);

    // The search field's own clear button is the way back
    await search.fill('');
    await expect(dialog.getByText('Skatteetaten: Meldingen ble sendt.')).toBeVisible();
  });

  test('keeps the modal the same size while typing', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(appUrlWithPlaywrightId('activity-history'));
    await page.getByRole('link', { name: 'This has a sender name defined' }).click();
    await page.getByRole('button', { name: 'Aktivitetslogg' }).first().click();

    const dialog = page.getByRole('dialog');
    const search = dialog.getByRole('searchbox');
    await expect(search).toBeVisible();

    const before = await dialog.boundingBox();
    const searchBefore = await search.boundingBox();

    await search.fill('sms');
    await expect(dialog.getByText('Varsel på SMS til +4799887766 ble levert.')).toBeVisible();

    const after = await dialog.boundingBox();
    const searchAfter = await search.boundingBox();

    expect(Math.abs((after?.height ?? 0) - (before?.height ?? 0))).toBeLessThanOrEqual(1);
    expect(Math.abs((searchAfter?.y ?? 0) - (searchBefore?.y ?? 0))).toBeLessThanOrEqual(1);
  });

  test('hides the toolbar when there is no activity at all', async ({ page }) => {
    await page.goto(appUrlWithPlaywrightId('empty-activity-log'));
    await page.getByRole('link', { name: 'Dialog med tom aktivitetslogg' }).click();
    await page.getByRole('button', { name: 'Aktivitetslogg' }).first().click();

    const dialog = page.getByRole('dialog');

    await expect(dialog.getByText('Det er ikke registrert noen aktiviteter på denne meldingen.')).toBeVisible();
    await expect(dialog.getByRole('searchbox')).toHaveCount(0);
    await expect(dialog.getByRole('button', { name: 'Alle typer' })).toHaveCount(0);
  });

  test('hides the toolbar entirely when the filter feature flag is off', async ({ page }) => {
    await page.goto(appUrlWithPlaywrightId('activity-history-no-filter'));
    await page.getByRole('link', { name: 'This has a sender name defined' }).click();
    await page.getByRole('button', { name: 'Aktivitetslogg' }).first().click();

    const dialog = page.getByRole('dialog');

    await expect(dialog.getByRole('searchbox')).toHaveCount(0);
    await expect(dialog.getByRole('button', { name: 'Alle typer' })).toHaveCount(0);

    // The log itself is untouched, and still shows every type
    await expect(dialog.getByText('Skatteetaten: Meldingen ble sendt.')).toBeVisible();
    await expect(dialog.getByText('Varsel på SMS til +4799887766 ble levert.')).toBeVisible();
    await expect(dialog.getByText('Fantasifull 2024 Søster flyttet meldingen til arkivet.')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Tittel', exact: true })).toBeVisible();
  });

  test('shows a message when the activity log is empty', async ({ page }) => {
    await page.goto(appUrlWithPlaywrightId('empty-activity-log'));
    await page.getByRole('link', { name: 'Dialog med tom aktivitetslogg' }).click();
    await page.getByRole('button', { name: 'Aktivitetslogg' }).first().click();

    const dialog = page.getByRole('dialog');

    await expect(dialog.getByText('Det er ikke registrert noen aktiviteter på denne meldingen.')).toBeVisible();
  });
});
