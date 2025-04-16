import { expect, test } from '@playwright/test';
import { defaultAppURL } from '../';

test.describe('Language picker', () => {
  test('Check language picker functionality and query', async ({ page }) => {
    await page.goto(defaultAppURL);

    await expect(page.getByTestId('searchbar-input')).toHaveAttribute('placeholder', 'Søk');
    await expect(page.getByRole('button', { name: 'add' })).toHaveText('Legg til');
    await expect(page.getByRole('link', { name: 'Lagrede søk' })).toBeVisible();

    await page.getByRole('button', { name: 'Open language-switcher' }).click();
    await expect(page.getByRole('heading', { name: 'Språk/language' })).toBeVisible();
    await expect(page.getByRole('banner').getByRole('group').getByText('RadioNorsk Bokmål')).toBeVisible();
    await expect(page.getByRole('banner').getByRole('group').getByText('Norsk Nynorsk')).toBeVisible();
    await expect(page.getByRole('banner').getByRole('group').getByText('English')).toBeVisible();

    const [response] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/graphql') && res.request().method() === 'POST' && res.status() === 200,
      ),
      page.getByRole('banner').getByRole('group').getByText('English').click(),
    ]);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data?.profile?.language).toBe('en');

    await expect(page.getByTestId('searchbar-input')).toHaveAttribute('placeholder', 'Search');
    await expect(page.getByRole('button', { name: 'add' })).toHaveText('Add filter');
    await expect(page.getByRole('link', { name: 'Lagrede søk' })).not.toBeVisible();
    await expect(page.getByRole('link', { name: 'Saved Searches' })).toBeVisible();
  });
});
