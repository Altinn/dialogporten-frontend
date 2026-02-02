import { defaultAppURL } from '../';
import { expect, test } from '../fixtures';

test.describe('Language picker', () => {
  test('Check language picker functionality and query', async ({ page, isMobile }) => {
    await page.goto(defaultAppURL);

    const listItem = page.getByRole('listitem').filter({ hasText: 'Melding om bortkjøring av snø' });
    await expect(listItem).toContainText('Oslo kommune til Test Testesen');

    await page.getByRole('button', { name: 'Meny', exact: true }).click();
    await page.getByRole('navigation', { name: 'Menu' }).getByLabel('Språk/language').click();
    await page.locator('#en').click();
    await expect(page.getByRole('link', { name: 'Notification of snow removal' })).toBeVisible();
    await expect(page.getByRole('banner')).toContainText('Search');
  });
});
