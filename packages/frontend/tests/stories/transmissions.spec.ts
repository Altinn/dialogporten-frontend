import { appUrlWithPlaywrightId } from '../';
import { expect, test } from '../fixtures';

test.describe('Transmissions and dialog history', () => {
  test('basic navigation', async ({ page }) => {
    await page.goto(appUrlWithPlaywrightId('transmissions'));
    // Go to details for dialog with transmissions
    await page.getByRole('link', { name: 'This has no sender name' }).click();

    // The mock has 11 transmissions (4 "Tittel" + 7 "Sak"), so "Vis mer" is always rendered.
    // .click() auto-waits up to the test timeout — no manual hydration wait needed.
    await page.getByRole('button', { name: 'Vis mer' }).click();

    /* Check that the transmissions are displayed */
    const tittel4 = page.getByRole('button', { name: 'Tittel 4' });
    const tittel3 = page.getByRole('button', { name: 'Tittel 3' });
    const tittel2 = page.getByRole('button', { name: 'Tittel 2' });
    await expect(tittel4).toBeVisible();
    await expect(tittel3).toBeVisible();

    await tittel4.click();
    await expect(tittel4).toHaveAttribute('aria-expanded', 'true');
    await expect(
      page.getByRole('heading', { name: 'Info i markdown for transmission (id=ttransmission-4)' }),
    ).toBeVisible();

    await tittel2.click();
    await expect(tittel2).toHaveAttribute('aria-expanded', 'true');
    await expect(
      page.getByRole('heading', { name: 'Info i markdown for transmission (id=ttransmission-2)' }),
    ).toBeVisible();

    await expect(page.getByRole('button', { name: 'Tittel', exact: true })).toBeVisible();
    await tittel4.click();
    await expect(tittel4).toHaveAttribute('aria-expanded', 'false');
  });

  test('help section should show', async ({ page }) => {
    await page.goto(appUrlWithPlaywrightId('transmissions'));
    await page.getByRole('link', { name: 'This has no sender name' }).click();
    await expect(page.getByRole('heading', { name: 'Trenger du hjelp?' })).toBeVisible();
  });

  // Case 1: isAuthorized=false + API-only attachment → A: filter (not shown anywhere in transmission list)
  test('case 1 — isAuthorized=false, API-only attachment: filtered from list, shown as text in activity log', async ({
    page,
  }) => {
    await page.goto(appUrlWithPlaywrightId('transmissions'));
    await page.getByRole('link', { name: 'This has no sender name' }).click();

    await expect(
      page.getByRole('button', { name: /Sak 1: filtreres.*isAuthorized=false.*API-vedlegg/ }),
    ).not.toBeVisible();

    await page.getByRole('button', { name: /aktivitetslogg/i }).click();
    // Case 1 and Case 3 both emit this activity-log entry — assert both are present
    // rather than .first() so a regression that drops one is actually caught.
    await expect(page.getByText('Forsendelse kun med maskinlesbart vedlegg')).toHaveCount(2);
  });

  // Case 2: isAuthorized=false + has GUI attachment → B: disabled (shown but cannot expand)
  test('case 2 — isAuthorized=false, GUI attachment: shown as disabled, cannot expand', async ({ page }) => {
    await page.goto(appUrlWithPlaywrightId('transmissions'));
    await page.getByRole('link', { name: 'This has no sender name' }).click();

    await page.getByRole('button', { name: 'Vis mer' }).click();

    const disabled = page.getByRole('button', { name: /Sak 2: deaktiveres/ });
    await expect(disabled).toBeVisible();
    await expect(disabled).toHaveAttribute('aria-disabled', 'true');

    await disabled.click({ force: true });
    await expect(disabled).not.toHaveAttribute('aria-expanded', 'true');
  });

  // Case 3: isAuthorized=true + API-only attachment → A: filter (not shown anywhere in transmission list)
  test('case 3 — isAuthorized=true, API-only attachment: filtered from list, shown as text in activity log', async ({
    page,
  }) => {
    await page.goto(appUrlWithPlaywrightId('transmissions'));
    await page.getByRole('link', { name: 'This has no sender name' }).click();

    await expect(
      page.getByRole('button', { name: /Sak 3: filtreres.*isAuthorized=true.*API-vedlegg/ }),
    ).not.toBeVisible();

    await page.getByRole('button', { name: /aktivitetslogg/i }).click();
    // Case 1 and Case 3 both emit this activity-log entry — assert both are present
    // rather than .first() so a regression that drops one is actually caught.
    await expect(page.getByText('Forsendelse kun med maskinlesbart vedlegg')).toHaveCount(2);
  });

  // Case 4: isAuthorized=true + visible content → visible (expandable, shows content)
  test('case 4 — isAuthorized=true, visible content: shown and expandable', async ({ page }) => {
    await page.goto(appUrlWithPlaywrightId('transmissions'));
    await page.getByRole('link', { name: 'This has no sender name' }).click();

    await page.getByRole('button', { name: 'Vis mer' }).click();

    const visible = page.getByRole('button', { name: /Sak 4: vises/ });
    await expect(visible).toBeVisible();
    await expect(visible).not.toHaveAttribute('aria-disabled', 'true');
  });

  // Case 5: isAuthorized=true + no visible content → C: expandable, shows empty-state explanation
  test('case 5 — isAuthorized=true, no visible content: shown with empty-state message on expand', async ({ page }) => {
    await page.goto(appUrlWithPlaywrightId('transmissions'));
    await page.getByRole('link', { name: 'This has no sender name' }).click();

    const empty = page.getByRole('button', { name: /Sak 5: tom melding.*ingen innhold/ });
    await expect(empty).toBeVisible();
    await expect(empty).not.toHaveAttribute('aria-disabled', 'true');

    await empty.click();
    await expect(page.getByText('Denne forsendelsen har ikke synlig innhold.')).toBeVisible();
  });

  // Case 6: isAuthorized=true + only unauthorized GUI link → expandable, shows disabled link
  test('case 6 — isAuthorized=true, unauthorized GUI link: shown and expandable, link is disabled', async ({
    page,
  }) => {
    await page.goto(appUrlWithPlaywrightId('transmissions'));
    await page.getByRole('link', { name: 'This has no sender name' }).click();

    const case6 = page.getByRole('button', { name: /Sak 6: deaktivert lenke.*uautorisert lenke/ });
    await expect(case6).toBeVisible();
    await expect(case6).not.toHaveAttribute('aria-disabled', 'true');

    await case6.click();
    await expect(page.getByRole('link', { name: 'Dokument (ikke tilgjengelig)' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  // Case 7: isAuthorized=true + summary and GUI attachment → visible and expandable, attachment link works
  test('case 7 — isAuthorized=true, summary and GUI attachment: shown and expandable', async ({ page }) => {
    await page.goto(appUrlWithPlaywrightId('transmissions'));
    await page.getByRole('link', { name: 'This has no sender name' }).click();

    const case7 = page.getByRole('button', { name: /Sak 7: vises.*summary og GUI-vedlegg/ });
    await expect(case7).toBeVisible();
    await expect(case7).not.toHaveAttribute('aria-disabled', 'true');

    await case7.click();
    const link = page.getByRole('link', { name: 'tilbakemelding' });
    await expect(link).toBeVisible();
    await expect(link).not.toHaveAttribute('aria-disabled', 'true');
  });
});
