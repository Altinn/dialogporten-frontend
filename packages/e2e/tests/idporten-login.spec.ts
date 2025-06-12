import { expect, test } from '@playwright/test';

test.describe('IDPorten integration', () => {
  test('authenticate user using idporten', async ({ page }) => {
    const pid = '14886498226'; // TODO: This can be replaced with environment variable or config
    const expectedName = 'Hjelpelinje Ordinær'; // TODO: This can be replaced with environment variable or config

    await page.goto('/');
    await page.getByRole('link', { name: 'TestID Lag din egen' }).click();
    await page.getByLabel('Personidentifikator (').click();
    await page.getByLabel('Personidentifikator (').fill(pid);
    await page.getByRole('button', { name: 'Autentiser' }).click();

    await expect(page.getByRole('button', { name: expectedName })).toBeVisible();

    await page.close();
  });
});
