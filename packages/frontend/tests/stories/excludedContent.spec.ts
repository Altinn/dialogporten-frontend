import { expect, type Page, test } from '@playwright/test';
import { appUrlWithPlaywrightId, baseQueryParams, baseURL } from '../';

const story = 'excluded-content';
const hiddenTransmission = 'Forsendelse du ikke har tilgang til å se.';
const hiddenHint = 'Avsender har skjult disse fordi du ikke har tilgang.';

const openDialog = async (page: Page, id: string, title: string) => {
  await page.goto(`${baseURL}/inbox/${id}${baseQueryParams}&playwrightId=${story}`);
  await expect(page.getByRole('heading', { name: title, level: 2 })).toBeVisible();
};

const openCompanyDialog = (page: Page) =>
  openDialog(page, '019b0e1a-2c3d-7e4f-8a5b-000000000001', 'Innhold du ikke har tilgang til');

test.describe('Content the user is not allowed to see', () => {
  test('dialog attachments count only the visible ones and say how many are hidden', async ({ page }) => {
    await openCompanyDialog(page);

    await expect(page.getByRole('heading', { name: '1 vedlegg', level: 2 })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Vedtak.pdf' })).toBeVisible();

    const hidden = page.getByText('+ 2 vedlegg du ikke har tilgang til å se.');
    await expect(hidden).toBeVisible();
    await expect(hidden).toHaveAccessibleDescription(hiddenHint);
    await hidden.focus();
    await expect(page.getByText(hiddenHint)).toBeVisible();
  });

  test('a transmission lists its attachments under a heading and says how many are hidden', async ({ page }) => {
    await openCompanyDialog(page);

    const transmission = page.getByRole('button', { name: 'Vedtak om tilskudd' });
    await transmission.click();
    await expect(transmission).toHaveAttribute('aria-expanded', 'true');

    await expect(page.getByRole('heading', { name: '1 vedlegg', level: 3 })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Vedtaksbrev.pdf' })).toBeVisible();
    await expect(page.getByText('+ 3 vedlegg du ikke har tilgang til å se.')).toBeVisible();
  });

  test('a transmission with only hidden attachments is not shown as empty', async ({ page }) => {
    await openCompanyDialog(page);

    const transmission = page.getByRole('button', { name: 'Lønnsopplysninger' });
    await expect(transmission).not.toHaveAttribute('aria-disabled', 'true');
    await transmission.click();

    await expect(page.getByRole('heading', { name: 'Ingen vedlegg', level: 3 })).toBeVisible();
    await expect(page.getByText('1 vedlegg du ikke har tilgang til å se.', { exact: true })).toBeVisible();
    await expect(page.getByText('Denne forsendelsen har ikke synlig innhold.')).toHaveCount(0);
  });

  test('a hidden transmission is placed by date in the timeline and cannot be opened', async ({ page }) => {
    await openCompanyDialog(page);

    const newer = page.getByRole('button', { name: 'Vedtak om tilskudd' });
    const hidden = page.getByText(hiddenTransmission).filter({ visible: true });
    const older = page.getByRole('button', { name: 'Lønnsopplysninger' });

    await expect(hidden).toHaveCount(1);
    await expect(page.getByRole('button', { name: hiddenTransmission })).toHaveCount(0);
    await expect(page.getByText('8. oktober 2026 kl. 10.00', { exact: true }).filter({ visible: true })).toHaveCount(1);

    const [newerBox, hiddenBox, olderBox] = await Promise.all([
      newer.boundingBox(),
      hidden.boundingBox(),
      older.boundingBox(),
    ]);
    expect(hiddenBox!.y).toBeGreaterThan(newerBox!.y);
    expect(olderBox!.y).toBeGreaterThan(hiddenBox!.y);
  });

  test('the activity log shows the hidden transmission, but searching leaves it out', async ({ page }) => {
    await openCompanyDialog(page);
    await page.getByRole('button', { name: 'Aktivitetslogg' }).first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText(hiddenTransmission)).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Vedtak om tilskudd' })).toBeVisible();

    await dialog.getByRole('searchbox').fill('vedtak');
    await expect(dialog.getByRole('button', { name: 'Vedtak om tilskudd' })).toBeVisible();
    await expect(dialog.getByText(hiddenTransmission)).toHaveCount(0);
  });

  test('a private person gets the same hint, without a plus, when every attachment is hidden', async ({ page }) => {
    await page.goto(appUrlWithPlaywrightId(story));
    await page.getByRole('link', { name: 'Vedlegg du ikke har tilgang til' }).click();

    await expect(page.getByRole('heading', { name: 'Ingen vedlegg', level: 2 })).toBeVisible();
    const hidden = page.getByText('2 vedlegg du ikke har tilgang til å se.', { exact: true });
    await expect(hidden).toBeVisible();
    await expect(hidden).toHaveAccessibleDescription(hiddenHint);
  });

  test('masked attachments are listed and counted, hidden ones are only counted', async ({ page }) => {
    await openDialog(page, '019b0e1a-2c3d-7e4f-8a5b-000000000003', 'Synlige, maskerte og skjulte vedlegg');

    await expect(page.getByRole('heading', { name: '3 vedlegg', level: 2 })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Vedtak.pdf' })).toBeVisible();
    await expect(page.getByText('Lønnsoppgave.pdf')).toBeVisible();
    await expect(page.getByText('+ 3 vedlegg du ikke har tilgang til å se.')).toBeVisible();

    await page.getByRole('button', { name: 'Synlig, maskert og skjult vedlegg', exact: true }).click();
    await expect(page.getByRole('heading', { name: '2 vedlegg', level: 3 })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Vedtaksbrev.pdf' })).toBeVisible();
    await expect(page.getByText('Lønnsslipp.pdf')).toBeVisible();
    await expect(page.getByText('+ 2 vedlegg du ikke har tilgang til å se.')).toBeVisible();

    await page.getByRole('button', { name: 'Vis mer' }).click();
    await page.getByRole('button', { name: 'Mange skjulte vedlegg', exact: true }).click();
    await expect(page.getByText('12 vedlegg du ikke har tilgang til å se.', { exact: true })).toBeVisible();
  });

  test('hidden transmissions sit by date among visible and disabled ones', async ({ page }) => {
    await openDialog(page, '019b0e1a-2c3d-7e4f-8a5b-000000000004', 'Flere skjulte forsendelser');
    const hidden = page.getByText(hiddenTransmission).filter({ visible: true });

    await expect(hidden).toHaveCount(2);
    await page.getByRole('button', { name: 'Vis mer' }).click();
    await expect(hidden).toHaveCount(4);

    await expect(page.getByRole('button', { name: 'Forsendelse uten tilgang' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await expect(page.getByRole('button', { name: 'Svar på skjult forespørsel' })).toBeVisible();

    const [newestHidden, purring] = await Promise.all([
      hidden.first().boundingBox(),
      page.getByRole('button', { name: 'Purring' }).boundingBox(),
    ]);
    expect(purring!.y).toBeGreaterThan(newestHidden!.y);
  });

  test('a dialog where every transmission is hidden shows only the hidden rows', async ({ page }) => {
    await openDialog(page, '019b0e1a-2c3d-7e4f-8a5b-000000000005', 'Bare skjulte forsendelser');

    await expect(page.getByText(hiddenTransmission).filter({ visible: true })).toHaveCount(3);
    await expect(page.getByRole('button', { name: 'Vis mer' })).toHaveCount(0);
  });

  test('hidden actions are counted below the buttons, next to a disabled one', async ({ page }) => {
    await openDialog(page, '019b0e1a-2c3d-7e4f-8a5b-000000000007', 'Handlinger du ikke har tilgang til');

    await expect(page.getByRole('link', { name: 'Til skjema' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send inn' })).toBeDisabled();
    await expect(page.getByRole('link', { name: 'Last ned kvittering' })).toBeVisible();

    const hidden = page.getByText('+ 2 handlinger du ikke har tilgang til.');
    await expect(hidden).toBeVisible();
    await expect(hidden).toHaveAccessibleDescription(hiddenHint);

    const [button, hiddenBox] = await Promise.all([
      page.getByRole('link', { name: 'Til skjema' }).boundingBox(),
      hidden.boundingBox(),
    ]);
    expect(hiddenBox!.y).toBeGreaterThan(button!.y + button!.height);
  });

  test('a dialog where every action is hidden still says so, without a plus', async ({ page }) => {
    await openDialog(page, '019b0e1a-2c3d-7e4f-8a5b-000000000008', 'Bare skjulte handlinger');

    await expect(page.getByText('1 handling du ikke har tilgang til.', { exact: true })).toBeVisible();
  });

  test('a private person gets the same hint for hidden actions', async ({ page }) => {
    await page.goto(appUrlWithPlaywrightId(story));
    await page.getByRole('link', { name: 'Skjulte handlinger for privatperson' }).click();

    const hidden = page.getByText('+ 1 handling du ikke har tilgang til.', { exact: true });
    await expect(hidden).toBeVisible();
    await expect(hidden).toHaveAccessibleDescription(hiddenHint);
  });

  test('hidden navigational actions are counted below the transmission buttons', async ({ page }) => {
    await openDialog(page, '019b0e1a-2c3d-7e4f-8a5b-000000000007', 'Handlinger du ikke har tilgang til');
    await page.getByRole('button', { name: 'Forsendelse med navigasjonshandlinger' }).click();

    const available = page.getByRole('link', { name: 'Gå til kvittering' });
    await expect(available).toBeVisible();
    await expect(page.getByRole('button', { name: 'Se vedtaket' })).toBeDisabled();

    const hidden = page.getByText('+ 3 handlinger du ikke har tilgang til.');
    await expect(hidden).toBeVisible();
    await expect(hidden).toHaveAccessibleDescription(hiddenHint);

    const [button, hiddenBox] = await Promise.all([available.boundingBox(), hidden.boundingBox()]);
    expect(hiddenBox!.y).toBeGreaterThan(button!.y + button!.height);
  });

  test('a transmission with only hidden navigational actions is not shown as empty', async ({ page }) => {
    await openDialog(page, '019b0e1a-2c3d-7e4f-8a5b-000000000007', 'Handlinger du ikke har tilgang til');
    await page.getByRole('button', { name: 'Bare skjulte navigasjonshandlinger' }).click();

    await expect(page.getByText('1 handling du ikke har tilgang til.', { exact: true })).toBeVisible();
    await expect(page.getByText('Denne forsendelsen har ikke synlig innhold.')).toHaveCount(0);
  });
});
