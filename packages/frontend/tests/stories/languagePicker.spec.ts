import { defaultAppURL } from '../';
import { expect, test } from '../fixtures';

test.describe('Language picker', () => {
  test('Check language picker functionality and query', async ({ page, isMobile }) => {
    await page.goto(defaultAppURL);

    const listItem = page.getByRole('listitem').filter({ hasText: 'Melding om bortkjøring av snø' });
    await expect(listItem).toContainText('Oslo kommune til Test Testesen');

    await expect(page.getByTestId('searchbar-input')).toHaveAttribute('placeholder', 'Søk i innboksen');
    await expect(page.getByRole('button', { name: 'add' })).toHaveText('Legg til filter');

    if (isMobile) {
      await page.getByRole('button', { name: 'Meny' }).click();
      await expect(page.getByRole('link', { name: 'Lagrede søk' })).toBeVisible();
      await page.getByRole('button', { name: 'Meny' }).click();
    } else {
      await expect(page.getByRole('link', { name: 'Lagrede søk' })).toBeVisible();
    }

    await page.getByRole('button', { name: 'Meny', exact: true }).click();
    await page.locator('a').filter({ hasText: 'Språk/language' }).first().click();
    await expect(
      page.getByTestId('locale-switcher').locator('div').filter({ hasText: 'Språk/language' }),
    ).toBeVisible();

    await expect(page.locator('a').filter({ hasText: 'Bokmål' })).toBeVisible();
    await expect(page.locator('a').filter({ hasText: 'Nynorsk' })).toBeVisible();
    await expect(page.locator('a').filter({ hasText: 'English' })).toBeVisible();

    await page.locator('a').filter({ hasText: 'English' }).click();

    await expect(page.getByTestId('searchbar-input')).toHaveAttribute('placeholder', 'Search in inbox');
    await expect(page.getByRole('button', { name: 'add' })).toHaveText('Add filter');
    await expect(listItem).toContainText('City of Oslo to Test Testesen');

    if (isMobile) {
      await page.getByRole('button', { name: 'Menu' }).click();
      await expect(page.getByRole('link', { name: 'Lagrede søk' })).not.toBeVisible();
      await expect(page.getByRole('link', { name: 'Saved Searches' })).toBeVisible();
    } else {
      await expect(page.getByRole('link', { name: 'Lagrede søk' })).not.toBeVisible();
      await expect(page.getByRole('link', { name: 'Saved Searches' })).toBeVisible();
    }
  });
});
