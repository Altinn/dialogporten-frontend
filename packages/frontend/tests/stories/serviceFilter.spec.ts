import { appUrlWithPlaywrightId } from '../';
import { expect, test } from '../fixtures';

const appURL = appUrlWithPlaywrightId('service-filter');

test.describe('Service resource filter with > 100 parties', () => {
  test('shows "Vis flere" when all parties are selected with a service filter, and updates the count after paging', async ({
    page,
  }) => {
    await page.goto(appURL);

    await page.locator('#toolbar-menu-root > button').click();
    await expect(page.locator('#toolbar-menu-listbox')).toBeVisible();
    await page.getByRole('option', { name: 'Alle virksomheter' }).click();
    await expect(page).toHaveURL(/group=ALL_COMPANIES/);

    await page.getByRole('button', { name: /^Legg til( filter)?$/ }).click();
    await page.locator('#service').click();
    await page.getByRole('searchbox', { name: /Søk/ }).last().fill('Mock service journey');
    await page.locator('#toolbar-filter-menu-item-0').click();
    await page.keyboard.press('Escape');

    await expect(page.getByText('Mer enn 100 treff')).toBeVisible();

    const fetchMore = page.getByRole('button', { name: 'Hent og vis flere dialoger' });
    await expect(fetchMore).toBeVisible();
    await fetchMore.click();

    await expect(page.getByText('120 treff')).toBeVisible();
    await expect(fetchMore).toBeHidden();
  });
});
