import { appURLProfileParties } from '../..';
import { expect, test } from '../../fixtures';

test.describe('Parties Overview Page', () => {
  test('displays the list of parties grouped by favorites and organizations', async ({ page }) => {
    await page.goto(appURLProfileParties);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Aktører og favoritter', level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Favoritter', level: 2 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Virksomheter', level: 2 })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Firma AS Org. nr. :' })).toBeVisible();
  });

  test('search narrows the list down to matching parties', async ({ page }) => {
    await page.goto(appURLProfileParties);
    await page.waitForLoadState('networkidle');

    await page.getByRole('searchbox', { name: 'Søk i aktører' }).fill('Firma');

    await expect(page.getByRole('heading', { name: '1 treff', level: 2 })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Firma AS Org. nr. :' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Testbedrift AS Org. nr. :' })).not.toBeVisible();
  });

  test('filtering to persons hides organizations and the deleted-entities switch', async ({ page }) => {
    await page.goto(appURLProfileParties);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Alle aktører' }).click();
    await page.getByRole('menuitemradio', { name: 'Personer' }).click();

    const main = page.getByRole('main');
    await expect(page.getByRole('button', { name: 'Personer' })).toBeVisible();
    await expect(main.getByRole('button', { name: 'Test Testesen' })).toBeVisible();
    await expect(main.getByRole('button', { name: 'Firma AS Org. nr. :' })).not.toBeVisible();
    await expect(page.getByRole('switch', { name: 'Vis slettede' })).not.toBeVisible();
  });

  test('expanding a party reveals its notification settings and org number', async ({ page }) => {
    await page.goto(appURLProfileParties);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Testbedrift AS Org. nr. :' }).first().click();

    await expect(page.getByRole('link', { name: 'Gå til innboks' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Informasjon om virksomheten' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Kopier' })).toBeVisible();
  });

  test('toggling favorite moves a party into the Favoritter group', async ({ page }) => {
    await page.goto(appURLProfileParties);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Legg til Testbedrift AS som favorittaktør' }).first().click();

    await expect(page.getByRole('button', { name: 'Fjern Testbedrift AS som favorittaktør' }).first()).toBeVisible();
  });

  test('setting a party as preselected updates its context menu action', async ({ page }) => {
    await page.goto(appURLProfileParties);
    await page.waitForLoadState('networkidle');

    const orgListItem = page.getByRole('listitem').filter({ hasText: 'Testbedrift AS' }).first();
    await orgListItem.getByRole('button', { name: 'Åpne meny' }).click();
    await page.getByRole('menuitem', { name: 'Sett som forhåndsvalgt aktør' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('Er du sikker på at du vil åpne Testbedrift AS neste gang du logger inn?');
    await page.getByRole('button', { name: 'Ja' }).click();

    await expect(page.getByRole('button', { name: 'Fjern som forhåndsvalgt aktør' }).first()).toBeVisible();
  });
});
