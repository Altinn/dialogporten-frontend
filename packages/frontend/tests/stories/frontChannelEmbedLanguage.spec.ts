import { expect, type Page, test } from '@playwright/test';
import { appUrlWithPlaywrightId, defaultAppURL } from '../';

const selectLanguage = async (page: Page, menuLabel: string, languageLabel: string) => {
  await page.getByRole('button', { name: menuLabel, exact: true }).click();
  await page.getByRole('navigation').getByLabel('Språk/language').click();
  await page.getByRole('menuitemradio', { name: languageLabel }).click();
};

test.describe('Front channel embed language', () => {
  test('Main content is re-fetched in the selected language when the language changes', async ({ page }) => {
    await page.goto(defaultAppURL);
    await page.getByRole('link', { name: 'Arbeidsavklaringspenger' }).click();

    await expect(page.getByRole('heading', { name: 'Innhold hentet fra bokmåls-URL' })).toBeVisible();

    await selectLanguage(page, 'Meny', 'English');

    await expect(page.getByRole('heading', { name: 'Content fetched from the English URL' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Innhold hentet fra bokmåls-URL' })).toBeHidden();

    await selectLanguage(page, 'Menu', 'Bokmål');

    await expect(page.getByRole('heading', { name: 'Innhold hentet fra bokmåls-URL' })).toBeVisible();
  });

  test('Transmission content is re-fetched in the selected language when the language changes', async ({ page }) => {
    await page.goto(appUrlWithPlaywrightId('transmissions'));
    await page.getByRole('link', { name: 'This has no sender name' }).click();

    const transmission = page.getByRole('button', { name: 'Språktest: innhold per språk' });
    await transmission.click();
    await expect(transmission).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('heading', { name: 'Innhold hentet fra bokmåls-URL (id=language-fce)' })).toBeVisible();

    await selectLanguage(page, 'Meny', 'English');

    await expect(
      page.getByRole('heading', { name: 'Content fetched from the English URL (id=language-fce)' }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Innhold hentet fra bokmåls-URL (id=language-fce)' })).toBeHidden();
  });

  test('Main content without a language-specific URL keeps rendering after a language change', async ({ page }) => {
    await page.goto(defaultAppURL);
    await page.getByRole('link', { name: 'Skatten din for 2022' }).click();

    await expect(page.getByRole('heading', { name: 'Grunnleggende konsepter fra markdown' })).toBeVisible();

    await selectLanguage(page, 'Meny', 'English');

    await expect(page.getByRole('heading', { name: 'Grunnleggende konsepter fra markdown' })).toBeVisible();
  });
});
