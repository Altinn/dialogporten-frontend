import { expect, test } from '@playwright/test';
import { baseQueryParams, baseURL, defaultAppURL } from '..';
import { firstMsgId } from '../../src/mocks/data/stories/search-flow/dialogs';
import { performSearch, selectDialogBySearch } from './common';

test.describe('Search flow', () => {
  test('less than 3 chars not allowed', async ({ page }) => {
    await page.goto(`${defaultAppURL}&playwrightId=search-flow`);
    const searchbarInput = page.locator("[name='Søk']");
    await searchbarInput.click();
    await searchbarInput.fill('me');
    await expect(page.getByRole('heading', { name: 'Anbefalte treff' })).not.toBeVisible();
    await page.getByTestId('search-button-clear').click();
    await searchbarInput.click();
    await searchbarInput.fill('mel');
    await expect(page.getByRole('heading', { name: 'Anbefalte treff' })).toBeVisible();
    await expect(page.getByRole('button', { name: '«mel» i innboks 3 treff' })).toBeVisible();
  });

  test('Badge with number of msgs and (5) visible suggestions', async ({ page }) => {
    await page.goto(`${defaultAppURL}&playwrightId=search-flow`);

    await performSearch(page, 'Sixth', 'clear');

    /* Check that desired results are rendered */
    const searchbarInput = page.locator("[name='Søk']");

    await searchbarInput.click();
    await searchbarInput.fill('test');

    await expect(page.getByLabel('First test message')).toBeVisible();
    await expect(page.getByLabel('Second test message')).toBeVisible();
    await expect(page.getByLabel('Third test message')).toBeVisible();
    await expect(page.getByLabel('Fourth test message')).toBeVisible();
    await expect(page.getByLabel('Fifth test message')).toBeVisible();
  });

  test('Search link should open dialog details with enter', async ({ page }) => {
    await page.goto(`${defaultAppURL}&playwrightId=search-flow`);
    await selectDialogBySearch(page, 'Sixth', 'Sixth test message', 'enter');

    await expect(page.getByRole('heading', { name: 'Sixth test message' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Info i markdown' })).toBeVisible();
  });

  test('Search link should open dialog details with click', async ({ page }) => {
    await page.goto(`${defaultAppURL}&playwrightId=search-flow`);
    await selectDialogBySearch(page, 'Sixth', 'Sixth test message', 'click');

    await expect(page.getByRole('heading', { name: 'Sixth test message' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Info i markdown' })).toBeVisible();
  });

  test('Navigating from message should go to inbox', async ({ page }) => {
    await page.goto(`${baseURL}/inbox/${firstMsgId}/${baseQueryParams}&playwrightId=search-flow`);

    await page.getByRole('button', { name: 'Tilbake' }).click();
    await expect(page).toHaveURL(`${defaultAppURL}&playwrightId=search-flow`);
  });
});
