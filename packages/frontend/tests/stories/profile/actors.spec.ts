import type { Page } from '@playwright/test';
import { appURLProfilePartiesOverview } from '../..';
import { expect, test } from '../../fixtures';

test.describe('Profile Actors Page', () => {
  test('Smoke test', async ({ page }: { page: Page }) => {
    await page.goto(appURLProfilePartiesOverview);

    await expect(page.getByRole('heading', { name: 'Mine aktører og favoritter' })).toBeVisible();
    await expect(page.getByRole('searchbox', { name: 'Søk etter aktør' })).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Test Testesen' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Firma AS' })).toBeVisible();

    await page.getByRole('searchbox', { name: 'Søk etter aktør' }).fill('Test Testesen');
    await expect(page.getByRole('heading', { name: 'Test Testesen' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Firma AS' })).not.toBeVisible();
  });

  test('Filtering of actors', async ({ page }: { page: Page }) => {
    await page.goto(appURLProfilePartiesOverview);
    await page.getByRole('searchbox', { name: 'Søk etter aktør' }).fill('Test Testesen');
    await expect(page.getByRole('heading', { name: 'Test Testesen' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Firma AS' })).not.toBeVisible();
  });

  test('Expanding actor details', async ({ page }: { page: Page }) => {
    await page.goto(appURLProfilePartiesOverview);
    await page.locator('li:has(h2:has-text("Firma AS")) button').first().click();
    await expect(page.getByRole('button', { name: 'Lagre endringer' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Avbryt' })).toBeVisible();
    await expect(page.getByText('Epostadresse for varslinger')).toBeVisible();

    await page.locator('li:has(h2:has-text("Firma AS")) button').first().click();
    await expect(page.getByRole('button', { name: 'Lagre endringer' })).not.toBeVisible();
  });

  test('Expanding actor context menu', async ({ page }: { page: Page }) => {
    await page.goto(appURLProfilePartiesOverview);
    await page.locator('li:has(h2:has-text("Firma AS")) button[aria-label^="open" i]').click();
    await expect(page.locator('div[data-expanded="true"] strong:has-text("Gå til Innboks")')).toBeVisible();
    await expect(page.locator('div[data-expanded="true"] strong:has-text("Legg til favoritter")')).toBeVisible();
    await expect(page.locator('div[data-expanded="true"] strong:has-text("Legg til i ny gruppe")')).toBeVisible();
  });
});
