import type { Page } from '@playwright/test';
import { appUrlWithPlaywrightId, defaultAppURL } from '..';
import { expect, test } from '../fixtures';

test.describe('Search suggests with senders', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto(appUrlWithPlaywrightId('search-sender'));
  });
  test('Render suggestions with senders', async ({ page }) => {
    const searchbarInput = page.locator("[name='Søk']");
    await expect(searchbarInput).toBeVisible();
    await searchbarInput.click();
    await searchbarInput.fill('arbeids');
    await expect(page.getByRole('heading', { name: 'Søkeforslag' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Arbeids- og velferdsetaten (NAV)' })).toBeVisible();

    await searchbarInput.fill('skatt');
    await expect(page.getByRole('heading', { name: 'Søkeforslag' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Skatteetaten' })).toBeVisible();

    await searchbarInput.fill('skatt test1');
    await expect(page.getByRole('heading', { name: 'Søkeforslag' })).toBeVisible();
    const button = page.getByRole('link', { name: 'Søk etter avsender Skatteetaten' });
    await expect(button).toBeVisible();
  });

  test('Not rendering senders suggestions with no match', async ({ page }) => {
    const searchbarInput = page.locator("[name='Søk']");
    await searchbarInput.click();
    await searchbarInput.fill('test1');

    await expect(page.getByRole('heading', { name: 'Søkeforslag' })).not.toBeVisible();
  });

  test('Selecting sender search filters data correctly', async ({ page }) => {
    const searchbarInput = page.locator("[name='Søk']");
    await searchbarInput.click();
    await searchbarInput.fill('skatt');
    await page.getByText(/^2 treff$/).waitFor();
    await page.getByRole('link', { name: 'Søk etter avsender Skatteetaten' }).click();

    await expect.poll(() => page.url()).toEqual(`${defaultAppURL}&playwrightId=search-sender&org=skd`);

    await expect(page.getByRole('link', { name: 'test1 NAV Arbeids- og' })).not.toBeVisible();

    await expect(page.getByRole('link', { name: 'test1 skatt' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'test2 skatt' })).toBeVisible();
  });

  test('Selecting sender and value filters data correctly', async ({ page }) => {
    const searchbarInput = page.locator("[name='Søk']");
    await searchbarInput.click();
    await searchbarInput.fill('skatt test1');
    await page.getByRole('link', { name: 'Søk etter avsender Skatteetaten med fritekst test1' }).click();

    await expect(page).toHaveURL(`${defaultAppURL}&playwrightId=search-sender&org=skd&search=test1`);
    await expect(page.getByRole('link', { name: 'test1 skatt' })).toBeVisible();

    await expect(page.getByRole('link', { name: 'test1 NAV' })).not.toBeVisible();
    await expect(page.getByRole('link', { name: 'test2 skatt' })).not.toBeVisible();
  });

  test('Clear button removes search param and display data', async ({ page }) => {
    const searchbarInput = page.locator("[name='Søk']");
    await searchbarInput.click();
    await searchbarInput.fill('skatt test1');
    await page.getByRole('link', { name: 'Skatteetaten' }).click();

    await expect(page).toHaveURL(`${defaultAppURL}&playwrightId=search-sender&org=skd&search=test1`);
    await expect(page.getByRole('link', { name: 'test1 skatt' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'test1 NAV' })).not.toBeVisible();
    await expect(page.getByRole('link', { name: 'test2 skatt' })).not.toBeVisible();

    await page.getByTestId('search-button-clear').click();
    await expect(page).toHaveURL(`${defaultAppURL}&playwrightId=search-sender&org=skd`);

    await expect(page.getByRole('link', { name: 'test1 skatt' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'test2 skatt' })).toBeVisible();
  });
});
