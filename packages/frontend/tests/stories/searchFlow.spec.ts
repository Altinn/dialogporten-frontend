import { expect, test } from '@playwright/test';
import { appUrlWithPlaywrightId, baseQueryParams, baseURL, defaultAppURL } from '..';
import { firstMsgId } from '../../src/mocks/data/stories/search-flow/dialogs';
import { performSearch, selectDialogBySearch } from './common';

test.describe('Search flow', () => {
  test('less than 3 chars not allowed', async ({ page }) => {
    await page.goto(appUrlWithPlaywrightId('search-flow'));
    const searchbarInput = page.locator("[name='Søk']");
    await searchbarInput.click();
    await searchbarInput.fill('me');
    await expect(page.getByRole('heading', { name: 'Anbefalte treff' })).not.toBeVisible();
    await page.getByTestId('search-button-clear').click();
    await searchbarInput.click();
    await searchbarInput.fill('mel');
    await expect(page.getByRole('heading', { name: 'Anbefalte treff' })).toBeVisible();
    const searchButton = page.getByRole('button', { name: 'Søk i innboks etter mel' });
    await expect(searchButton).toBeVisible();
  });

  test('Badge with number of msgs and (5) visible suggestions', async ({ page }) => {
    await page.goto(appUrlWithPlaywrightId('search-flow'));

    await performSearch(page, 'Sixth', 'clear');

    /* Check that desired results are rendered */
    const searchbarInput = page.locator("[name='Søk']");

    await searchbarInput.click();
    await searchbarInput.fill('test');

    await expect(page.getByRole('banner').getByRole('link', { name: 'First test message' })).toBeVisible();
    await expect(page.getByRole('banner').getByRole('link', { name: 'Second test message' })).toBeVisible();
    await expect(page.getByRole('banner').getByRole('link', { name: 'Third test message' })).toBeVisible();
    await expect(page.getByRole('banner').getByRole('link', { name: 'Fourth test message' })).toBeVisible();
    await expect(page.getByRole('banner').getByRole('link', { name: 'Fifth test message' })).toBeVisible();
  });

  test('Search link should open dialog details with enter', async ({ page }) => {
    await page.goto(appUrlWithPlaywrightId('search-flow'));
    await selectDialogBySearch(page, 'Sixth', 'Sixth test message', 'enter');
    await page.getByTestId('searchbar-input').press('ArrowDown');
    await page.keyboard.press('Enter');

    await expect(page.getByRole('heading', { name: 'Sixth test message' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Info i markdown' })).toBeVisible();
  });

  test('Search link should open dialog details with click', async ({ page }) => {
    await page.goto(appUrlWithPlaywrightId('search-flow'));
    await selectDialogBySearch(page, 'Sixth', 'Sixth test message', 'click');

    await expect(page.getByRole('heading', { name: 'Sixth test message' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Info i markdown' })).toBeVisible();
  });

  test('Navigating from message should go to inbox', async ({ page }) => {
    await page.goto(`${baseURL}/inbox/${firstMsgId}/${baseQueryParams}&playwrightId=search-flow`);

    await page.getByRole('link', { name: 'Tilbake' }).click();
    await expect(page).toHaveURL(`${defaultAppURL}&playwrightId=search-flow`);
  });
});
