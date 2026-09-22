import { expect, type Page, test } from '@playwright/test';
import { appURLProfileParties } from '../..';

const PARTIES_HEADING = 'Aktører og favoritter';
const PARTY_BUTTON_NAME = 'Testbedrift AS Org. nr. :';
const SERVICES_ROW_NAME = 'Varsle kun om enkelttjenester';
const EXPIRED_BADGE = 'Utløpt';
const ALL_GROUP = 'Alle tjenester';

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

  test('selected services fill a group on top without moving the list, and survive save and reopen', async ({
    page,
  }: {
    page: Page;
  }) => {
    const dialog = await openServiceList(page);
    const scroller = dialog.locator('div[style*="overflow: auto"]');
    const groupHeadings = () => dialog.locator('[data-index] h3').allTextContents();
    const selectedRows = dialog.locator('[data-row-group="selected"]');

    await expect(dialog.locator('[data-index]').first()).toBeVisible();
    expect(await groupHeadings()).toEqual(['Ingen tjenester valgt']);

    const allRowPositions = () =>
      scroller.evaluate((el) =>
        Object.fromEntries(
          [...el.querySelectorAll<HTMLElement>('[data-row-group="all"]')].map((row) => [
            row.dataset.rowKey,
            Math.round(row.getBoundingClientRect().top),
          ]),
        ),
      );
    const nextUnselectedRow = () =>
      scroller.evaluate((el) => {
        const box = el.getBoundingClientRect();
        const row = [...el.querySelectorAll<HTMLElement>('[data-row-group="all"]')].find((candidate) => {
          const input = candidate.querySelector<HTMLInputElement>('input[role="switch"]');
          const rect = candidate.getBoundingClientRect();
          return input !== null && !input.checked && rect.top >= box.top && rect.bottom <= box.bottom;
        });
        return row?.dataset.rowKey ?? null;
      });

    for (const expectedCount of [1, 2, 3]) {
      const rowKey = await nextUnselectedRow();
      expect(rowKey).not.toBeNull();
      const before = await allRowPositions();

      await dialog.locator(`[data-row-key="${rowKey?.replaceAll(':', '\\:')}"] input[role="switch"]`).check();

      await expect(selectedRows).toHaveCount(expectedCount);
      expect(await groupHeadings()).toEqual([
        expectedCount === 1 ? '1 tjeneste valgt' : `${expectedCount} tjenester valgt`,
        ALL_GROUP,
      ]);

      const after = await allRowPositions();
      for (const [key, top] of Object.entries(before)) {
        if (key in after) expect(after[key], `row ${key} moved`).toBe(top);
      }
    }

    const search = dialog.getByRole('searchbox');
    await search.fill('melding');
    await expect(selectedRows).toHaveCount(0);
    await expect.poll(groupHeadings).toEqual([expect.stringMatching(/^\d+ treff$/)]);

    await search.fill('ingentingheter');
    await expect.poll(groupHeadings).toEqual(['Ingen treff']);
    await expect(dialog.locator('[data-row-group="all"]')).toHaveCount(0);

    await search.fill('');
    await expect(selectedRows).toHaveCount(3);
    expect(await groupHeadings()).toEqual(['3 tjenester valgt', ALL_GROUP]);

    await dialog.getByRole('button', { name: 'Lagre' }).click();
    await expect(dialog).toBeHidden();

    await page.getByRole('button', { name: SERVICES_ROW_NAME }).click();
    await expect(selectedRows).toHaveCount(3);
    expect((await groupHeadings())[0]).toBe('3 tjenester valgt');
  });
});
