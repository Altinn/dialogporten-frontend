import { expect, type Page, test } from '@playwright/test';
import { appUrlWithPlaywrightId } from '../';

const openReceipt = async (page: Page) => {
  await page.goto(appUrlWithPlaywrightId('fce-definition-list'));
  await page.getByRole('link', { name: 'Kvittering for innsendt skjema' }).click();
  await expect(page.getByRole('term').first()).toBeVisible();
};

const boxOf = async (page: Page, role: 'term' | 'definition', name: string) => {
  const box = await page.getByRole(role).filter({ hasText: name }).boundingBox();
  expect(box).not.toBeNull();
  return box!;
};

const expectSideBySide = async (page: Page, term: string, definition: string) => {
  const termBox = await boxOf(page, 'term', term);
  const definitionBox = await boxOf(page, 'definition', definition);
  expect(definitionBox.y).toBeCloseTo(termBox.y, 0);
  expect(definitionBox.x).toBeGreaterThanOrEqual(termBox.x + termBox.width - 1);
};

test.describe('Front channel embed definition list', () => {
  test('Label/value pairs are terms and definitions, not a table', async ({ page }) => {
    await openReceipt(page);

    await expect(page.locator('dl')).toMatchAriaSnapshot(`
      - term: Dato sendt
      - definition: 06.10.2026 / 14:09
      - term: Avsender
      - definition: 029147*****-Ola Nordmann
      - term: Organisasjonsnummer
      - definition: 912 345 678
      - term: Vedlegg
      - definition: Situasjonsplan.pdf
      - definition: Fullmakt.pdf
    `);
    await expect(page.getByRole('table')).toHaveCount(0);
  });

  for (const viewport of [
    { width: 1280, height: 900 },
    { width: 360, height: 800 },
  ]) {
    test.describe(`at ${viewport.width}px`, () => {
      test.use({ viewport });

      test('Labels and values are laid out as two columns', async ({ page }) => {
        await openReceipt(page);

        await expectSideBySide(page, 'Dato sendt', '06.10.2026 / 14:09');
        await expectSideBySide(page, 'Organisasjonsnummer', '912 345 678');
        await expectSideBySide(page, 'Vedlegg', 'Situasjonsplan.pdf');

        const firstAttachment = await boxOf(page, 'definition', 'Situasjonsplan.pdf');
        const secondAttachment = await boxOf(page, 'definition', 'Fullmakt.pdf');
        expect(secondAttachment.x).toBeCloseTo(firstAttachment.x, 0);
        expect(secondAttachment.y).toBeGreaterThan(firstAttachment.y);

        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      });
    });
  }
});
