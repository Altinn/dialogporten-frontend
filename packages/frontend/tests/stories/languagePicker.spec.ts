import { defaultAppURL } from '../';
import { expect, test } from '../fixtures';

test.describe('Language picker', () => {
  test('Check language picker functionality and query', async ({ page, isMobile }) => {
    await page.goto(defaultAppURL);

    const listItem = page.getByRole('listitem').filter({ hasText: 'Melding om bortkjøring av snø' });
    const timeElement = listItem.locator('time').filter({
      hasText: 'Oslo kommune',
    });
    await expect(timeElement).toHaveText('Oslo kommune til Test Testesen');

    await expect(page.getByTestId('searchbar-input')).toHaveAttribute('placeholder', 'Søk');
    await expect(page.getByRole('button', { name: 'add' })).toHaveText('Legg til filter');

    if (isMobile) {
      await page.getByRole('button', { name: 'Meny' }).click();
      await expect(page.getByRole('link', { name: 'Lagrede søk' })).toBeVisible();
      await page.getByRole('button', { name: 'Meny' }).click();
    } else {
      await expect(page.getByRole('link', { name: 'Lagrede søk' })).toBeVisible();
    }

    await page.getByRole('button', { name: 'Open language-switcher' }).click();
    await expect(page.getByText('Språk/language')).toBeVisible();
    await expect(page.getByRole('banner').getByRole('group').getByText('Bokmål')).toBeVisible();
    await expect(page.getByRole('banner').getByRole('group').getByText('Nynorsk')).toBeVisible();
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
    const timeElementEn = listItem.locator('time').filter({
      hasText: 'to Test Testesen',
    });
    await expect(timeElementEn).toContainText('City of Oslo to Test Testesen');

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
