import type { Page } from '@playwright/test';
import { appURLProfilePartiesOverview } from '../..';
import { expect, test } from '../../fixtures';

test.describe('Profile Actors Page', () => {
  test('Smoke test', async ({ page }: { page: Page }) => {
    await page.goto(appURLProfilePartiesOverview);

    await expect(page.getByRole('heading', { name: 'Mine aktører og favoritter' })).toBeVisible();
    await expect(page.getByRole('searchbox', { name: 'Søk etter aktør' })).toBeVisible();

    await expect(page.getByRole('button', { name: 'Test Testesen' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Firma AS' })).toBeVisible();

    await page.getByRole('searchbox', { name: 'Søk etter aktør' }).fill('Test Testesen');
    await expect(page.getByRole('button', { name: 'Test Testesen' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Firma AS' })).not.toBeVisible();
  });

  test('Filtering of actors', async ({ page }: { page: Page }) => {
    await page.goto(appURLProfilePartiesOverview);
    await page.getByRole('searchbox', { name: 'Søk etter aktør' }).fill('Test Testesen');
    await expect(page.getByRole('button', { name: 'Test Testesen' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Firma AS' })).not.toBeVisible();
  });

  test('Expanding actor details', async ({ page }: { page: Page }) => {
    await page.goto(appURLProfilePartiesOverview);
    await page.getByRole('button', { name: 'Firma AS' }).click();
    await expect(page.getByRole('button', { name: 'Lagre endringer' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Avbryt' })).toBeVisible();
    await expect(page.getByText('Epostadresse for varslinger')).toBeVisible();

    await page.getByRole('button', { name: 'Firma AS' }).click();
    await expect(page.getByRole('button', { name: 'Lagre endringer' })).not.toBeVisible();
  });

  test('Expanding actor context menu', async ({ page }: { page: Page }) => {
    await page.goto(appURLProfilePartiesOverview);
    const firmaAsButton = page.getByRole('button', { name: 'Firma AS' });
    await expect(firmaAsButton).toBeVisible();
    await page.getByRole('button', { name: /urn:altinn:organization:identifier-no:1-menu/ }).click();

    await expect(
      page.getByRole('main').getByRole('group').locator('a').filter({ hasText: 'Gå til Innboks' }),
    ).toBeVisible();
    await expect(
      page.getByRole('main').getByRole('group').locator('a').filter({ hasText: 'Legg til favoritter' }),
    ).toBeVisible();
    await expect(
      page.getByRole('main').getByRole('group').locator('a').filter({ hasText: 'Legg til favoritter' }),
    ).toBeVisible();
  });
});
