import { expect, type Page, test } from '@playwright/test';
import { appURLProfileParties } from '../..';

const PARTIES_HEADING = 'Aktører og favoritter';
const PARTY_BUTTON_NAME = 'Testbedrift AS Org. nr. :';
const SERVICES_ROW_NAME = 'Varsle kun om enkelttjenester';
const EXPIRED_BADGE = 'Utløpt';

const openServiceList = async (page: Page) => {
  await page.goto(appURLProfileParties);
  await expect(page.getByRole('heading', { name: PARTIES_HEADING, level: 1 })).toBeVisible();

  await page.getByRole('button', { name: PARTY_BUTTON_NAME }).click();
  await page.getByRole('button', { name: SERVICES_ROW_NAME }).click();

  const dialog = page.getByRole('dialog');
  await dialog.getByRole('switch', { name: SERVICES_ROW_NAME }).click();

  return dialog;
};

test.describe('Account Alerts - service notifications', () => {
  test('deprecated services are marked as expired', async ({ page }: { page: Page }) => {
    const dialog = await openServiceList(page);

    const search = dialog.getByRole('searchbox');
    const expiredServices = dialog.getByRole('switch', { name: EXPIRED_BADGE });

    await search.fill('Barnehagelister');
    await expect(dialog.getByRole('switch', { name: 'Barnehagelister (2)' })).toBeVisible();
    await expect(expiredServices).toHaveCount(1);
    await expect(dialog.getByRole('switch', { name: `Barnehagelister ${EXPIRED_BADGE}` })).toBeVisible();

    await search.fill('Bevillingsordning for tilvirkning av alkohol');
    await expect(
      dialog.getByRole('switch', { name: 'Bevillingsordning for tilvirkning av alkohol (1)' }),
    ).toBeVisible();
    await expect(expiredServices).toHaveCount(1);
    await expect(
      dialog.getByRole('switch', { name: `Bevillingsordning for tilvirkning av alkohol ${EXPIRED_BADGE}` }),
    ).toBeVisible();
  });

  test('rows do not overlap after typing in the search field', async ({ page }: { page: Page }) => {
    const dialog = await openServiceList(page);

    await dialog.getByRole('searchbox').pressSequentially('melding', { delay: 100 });
    await expect(dialog.getByRole('switch', { name: 'A01 a-melding Skatteetaten', exact: true })).toBeVisible();

    const misplacedRows = () =>
      dialog
        .locator('[data-index]')
        .evaluateAll((rows) =>
          rows
            .filter(
              (row, i) =>
                i > 0 && Math.abs(row.getBoundingClientRect().top - rows[i - 1].getBoundingClientRect().bottom) > 1,
            )
            .map((row) => row.textContent),
        );
    await expect.poll(misplacedRows).toEqual([]);
  });
});
