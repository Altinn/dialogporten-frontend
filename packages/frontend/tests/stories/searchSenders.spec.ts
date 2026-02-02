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

    await expect(
      page.getByRole('menuitem', { name: 'Arbeids- og velferdsetaten (NAV)' }).filter({ has: page.locator('a') }),
    ).toBeVisible();

    await searchbarInput.fill('skatt');

    await page
      .getByRole('menuitem', { name: 'Skatteetaten' })
      .filter({ has: page.locator('a') })
      .click();
    await searchbarInput.fill('skatt test1');
    await expect(
      page.getByRole('menuitem', { name: /Søk etter avsender Skatteetaten/i }).filter({ has: page.locator('a') }),
    ).toBeVisible();
  });

  test('Not rendering senders suggestions with no match', async ({ page }) => {
    const searchbarInput = page.locator("[name='Søk']");
    await searchbarInput.click();
    await searchbarInput.fill('test1');

    await expect(page.locator('#inboxScope')).toContainText('Ingen treff');
  });

  test('Selecting sender search filters data correctly', async ({ page }) => {
    const searchbarInput = page.locator("[name='Søk']");
    await searchbarInput.click();
    await searchbarInput.fill('skatt');
    await page.getByText(/^2 treff$/).waitFor();
    await page
      .getByRole('menuitem', { name: /Søk etter avsender Skatteetaten/i })
      .filter({ has: page.locator('a') })
      .click();

    await expect.poll(() => page.url()).toEqual(`${defaultAppURL}&playwrightId=search-sender&org=skd`);

    await expect(page.getByRole('link', { name: 'test1 NAV Arbeids- og' })).not.toBeVisible();
    await expect(page.getByRole('link', { name: 'test1 skatt' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'test2 skatt' })).toBeVisible();
  });

  test('Selecting sender and value filters data correctly', async ({ page }) => {
    const searchbarInput = page.locator("[name='Søk']");
    await searchbarInput.click();
    await searchbarInput.fill('skatt test1');
    await page
      .getByRole('menuitem', { name: /Søk etter avsender Skatteetaten med fritekst test1/i })
      .filter({ has: page.locator('a') })
      .click();

    await expect(page).toHaveURL(`${defaultAppURL}&playwrightId=search-sender&org=skd&search=test1`);
    await expect(page.getByRole('link', { name: 'test1 skatt' })).toBeVisible();

    await expect(page.getByRole('link', { name: 'test1 NAV' })).not.toBeVisible();
    await expect(page.getByRole('link', { name: 'test2 skatt' })).not.toBeVisible();
  });

  test('Clear button removes search param and display data', async ({ page }) => {
    const searchbarInput = page.locator("[name='Søk']");
    await searchbarInput.click();
    await searchbarInput.fill('skatt test1');
    await page
      .getByRole('menuitem', { name: /Søk etter avsender Skatteetaten med fritekst test1/i })
      .filter({ has: page.locator('a') })
      .click();

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
