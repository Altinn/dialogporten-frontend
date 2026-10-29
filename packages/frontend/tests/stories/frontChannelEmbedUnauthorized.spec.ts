import { expect, test } from '@playwright/test';
import { appUrlWithPlaywrightId } from '../';

test.describe('Front channel embed without access', () => {
  test('Main content and transmission content show the no access alert', async ({ page }) => {
    await page.goto(appUrlWithPlaywrightId('fce-unauthorized'));
    await page.getByRole('link', { name: 'Melding med innhold du ikke har tilgang til' }).click();

    const noAccess = page.getByText('Du har ikke tilgang til å se dette innholdet.', { exact: true });
    await expect(noAccess).toHaveCount(1);

    const transmission = page.getByRole('button', { name: 'Forsendelse med innhold du ikke har tilgang til' });
    await transmission.click();
    await expect(transmission).toHaveAttribute('aria-expanded', 'true');
    await expect(noAccess).toHaveCount(2);
  });
});
