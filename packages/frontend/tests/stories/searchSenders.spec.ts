import { expect, test } from '@playwright/test';
import { defaultAppURL } from '..';

test.describe('Search suggests with senders', () => {
  test('Render suggestions with senders', async ({ page }) => {
    await page.goto(`${defaultAppURL}&playwrightId=search-sender`);

    const searchbarInput = page.locator("[name='Søk']");
    await expect(searchbarInput).toBeVisible();
    await searchbarInput.click();
    await searchbarInput.fill('arbeids');
    await expect(page.getByRole('heading', { name: 'Søkeforslag' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Arbeids- og velferdsetaten (NAV)' })).toBeVisible();

    await searchbarInput.fill('skatt');
    await expect(page.getByRole('heading', { name: 'Søkeforslag' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Skatteetaten' })).toBeVisible();

    await searchbarInput.fill('skatt test1');
    await expect(page.getByRole('heading', { name: 'Søkeforslag' })).toBeVisible();
    const button = page.locator('button[aria-label="Skatteetaten"]');
    await expect(button.locator(':text("test1")')).toBeVisible();
  });

  test('Not rendering senders suggestions with no match', async ({ page }) => {
    await page.goto(`${defaultAppURL}&playwrightId=search-sender`);

    const searchbarInput = page.locator("[name='Søk']");
    await searchbarInput.click();
    await searchbarInput.fill('test1');

    await expect(page.getByRole('heading', { name: 'Søkeforslag' })).not.toBeVisible();
  });

  test('Selecting sender search filters data correctly', async ({ page }) => {
    await page.goto(`${defaultAppURL}&playwrightId=search-sender`);

    const searchbarInput = page.locator("[name='Søk']");
    await searchbarInput.click();
    await searchbarInput.fill('skatt');
    await page.getByRole('button', { name: 'Skatteetaten' }).click();
    await expect(page).toHaveURL(`${defaultAppURL}&playwrightId=search-sender&org=skd`);

    await expect(page.getByRole('link', { name: 'test1 NAV Arbeids- og' })).not.toBeVisible();

    await expect(page.getByRole('link', { name: 'test1 skatt Skatteetaten til' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'test2 skatt Skatteetaten til' })).toBeVisible();
  });

  test('Selecting sender and value filters data correctly', async ({ page }) => {
    await page.goto(`${defaultAppURL}&playwrightId=search-sender`);

    const searchbarInput = page.locator("[name='Søk']");
    await searchbarInput.click();
    await searchbarInput.fill('skatt test1');
    await page.getByRole('button', { name: 'Skatteetaten' }).click();

    await expect(page).toHaveURL(`${defaultAppURL}&playwrightId=search-sender&search=test1&org=skd`);
    await expect(page.getByRole('link', { name: 'test1 skatt Skatteetaten til' })).toBeVisible();

    await expect(page.getByRole('link', { name: 'test1 NAV Arbeids- og' })).not.toBeVisible();
    await expect(page.getByRole('link', { name: 'test2 skatt Skatteetaten til' })).not.toBeVisible();
  });

  test('Clear button removes search parasm and display data', async ({ page }) => {
    await page.goto(`${defaultAppURL}&playwrightId=search-sender`);

    const searchbarInput = page.locator("[name='Søk']");
    await searchbarInput.click();
    await searchbarInput.fill('skatt test1');
    await page.getByRole('button', { name: 'Skatteetaten' }).click();

    await expect(page).toHaveURL(`${defaultAppURL}&playwrightId=search-sender&search=test1&org=skd`);
    await expect(page.getByRole('link', { name: 'test1 skatt Skatteetaten til' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'test1 NAV Arbeids- og' })).not.toBeVisible();
    await expect(page.getByRole('link', { name: 'test2 skatt Skatteetaten til' })).not.toBeVisible();

    await page.getByTestId('search-button-clear').click();
    await expect(page).toHaveURL(`${defaultAppURL}&playwrightId=search-sender`);

    await expect(page.getByRole('link', { name: 'test1 skatt Skatteetaten til' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'test1 NAV Arbeids- og' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'test2 skatt Skatteetaten til' })).toBeVisible();
  });
});
