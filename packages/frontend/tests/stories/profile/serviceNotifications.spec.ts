import { expect, type Page, test } from '@playwright/test';
import { appURLProfileParties } from '../..';

const PARTIES_HEADING = 'Aktører og favoritter';
const PARTY_BUTTON_NAME = 'Testbedrift AS Org. nr. :';
const SERVICES_ROW_NAME = 'Varsle kun om enkelttjenester';
const EXPIRED_BADGE = 'Utløpt';

test.describe('Account Alerts - service notifications', () => {
  test('services that are deprecated or withdrawn in the resource registry are marked as expired', async ({
    page,
  }: {
    page: Page;
  }) => {
    await page.goto(appURLProfileParties);
    await expect(page.getByRole('heading', { name: PARTIES_HEADING, level: 1 })).toBeVisible();

    await page.getByRole('button', { name: PARTY_BUTTON_NAME }).click();
    await page.getByRole('button', { name: SERVICES_ROW_NAME }).click();

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('switch', { name: SERVICES_ROW_NAME }).click();

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
});
