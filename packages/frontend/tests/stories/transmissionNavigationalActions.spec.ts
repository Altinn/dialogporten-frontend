import { expect, test } from '@playwright/test';
import { appUrlWithPlaywrightId } from '../';

test.describe('Transmission navigational actions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(appUrlWithPlaywrightId('transmission-navigational-actions'));
    await page.getByRole('link', { name: 'Navigasjonshandlinger i forsendelser' }).click();
  });

  test('renders actions as buttons after the attachments, disabling unauthorized and expired ones', async ({
    page,
  }) => {
    const transmission = page.getByRole('button', { name: 'På tide å utføre en oppgave' });
    await transmission.click();
    await expect(transmission).toHaveAttribute('aria-expanded', 'true');

    const available = page.getByRole('link', { name: 'Gå til kvitteringsvisning' });
    await expect(available).toHaveAttribute('href', 'https://info.altinn.no/');

    const unauthorized = page.getByRole('button', { name: 'Se vedtaket' });
    await expect(unauthorized).toBeDisabled();
    await expect(unauthorized.locator('svg')).toHaveCount(1);

    const expired = page.getByRole('button', { name: 'Fyll ut skjema' });
    await expect(expired).toBeDisabled();
    await expect(expired.locator('svg')).toHaveCount(0);

    const attachmentBox = await page.getByRole('link', { name: 'Dokument.pdf' }).boundingBox();
    const actionBox = await available.boundingBox();
    expect(actionBox!.y).toBeGreaterThan(attachmentBox!.y + attachmentBox!.height);
  });

  test('explains why an action is disabled in a tooltip', async ({ page }) => {
    await page.getByRole('button', { name: 'På tide å utføre en oppgave' }).click();

    const unauthorized = page.getByRole('button', { name: 'Se vedtaket' });
    await expect(unauthorized).toHaveAccessibleDescription('Du har ikke tilgang');
    await unauthorized.hover();
    await expect(page.getByText('Du har ikke tilgang', { exact: true })).toBeVisible();

    const expired = page.getByRole('button', { name: 'Fyll ut skjema' });
    await expect(expired).toHaveAccessibleDescription('Fristen er utløpt');
    await expired.focus();
    await expect(page.getByText('Fristen er utløpt', { exact: true })).toBeVisible();

    await expect(page.getByRole('link', { name: 'Gå til kvitteringsvisning' })).not.toHaveAttribute('data-tooltip');
  });

  test('a transmission with only navigational actions is expandable and not shown as empty', async ({ page }) => {
    const transmission = page.getByRole('button', { name: 'Kvittering for innsending' });
    await expect(transmission).not.toHaveAttribute('aria-disabled', 'true');

    await transmission.click();
    await expect(page.getByRole('link', { name: 'Åpne kvitteringen' })).toBeVisible();
    await expect(page.getByText('Denne forsendelsen har ikke synlig innhold.')).not.toBeVisible();
  });

  test('an unauthorized transmission with navigational actions is shown as disabled', async ({ page }) => {
    const transmission = page.getByRole('button', { name: 'Forsendelse uten tilgang' });
    await expect(transmission).toHaveAttribute('aria-disabled', 'true');
  });
});
