import { waitFor } from '@testing-library/react';
import { appUrlWithPlaywrightId, baseQueryParams, baseURL, defaultAppURL } from '..';
import { firstMsgId } from '../../src/mocks/data/stories/search-flow/dialogs';
import { expect, test } from '../fixtures';
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
    await expect(page.getByText('Anbefalte treff')).toBeVisible();
    const searchButton = page.getByRole('menuitem', { name: 'Søk i innboksen etter mel' });
    await expect(searchButton).toBeVisible();
  });

  test('Badge with number of msgs and (5) visible suggestions', async ({ page }) => {
    await page.goto(appUrlWithPlaywrightId('search-flow'));

    await performSearch(page, 'Sixth', 'clear');

    /* Check that desired results are rendered */
    const searchbarInput = page.locator("[name='Søk']");

    await searchbarInput.click();
    await searchbarInput.fill('test');

    await expect(page.getByRole('menuitem', { name: 'First test message First test' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Second test message Second test' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Third test message Third test' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Fourth test message Fourth test' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Fifth test message Fifth test' })).toBeVisible();
  });

  test('Search link should open dialog details with enter', async ({ page, isMobile }) => {
    if (!isMobile) {
      await page.goto(appUrlWithPlaywrightId('search-flow'));
      await page.getByTestId('searchbar-input').click();
      await page.getByTestId('searchbar-input').fill('Sixth');
      await page.getByRole('menuitem', { name: 'Sixth test message Sixth test' }).waitFor({ state: 'visible' });

      await page.getByTestId('searchbar-input').press('ArrowDown');
      await page.getByTestId('searchbar-input').press('Enter');

      // Dialog details
      await expect(page.getByRole('heading', { name: 'Sixth test message' }).locator('span')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Info i markdown' })).toBeVisible();
    }
  });

  test('Search link should open dialog details with click', async ({ page }) => {
    await page.goto(appUrlWithPlaywrightId('search-flow'));
    await page.getByTestId('searchbar-input').click();
    await page.getByTestId('searchbar-input').fill('Sixth');
    await page.getByRole('menuitem', { name: 'Sixth test message Sixth test' }).click();

    // Dialog details
    await expect(page.getByRole('heading', { name: 'Sixth test message' }).locator('span')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Info i markdown' })).toBeVisible();
  });

  test('Navigating from message should go to inbox', async ({ page }) => {
    await page.goto(`${baseURL}/inbox/${firstMsgId}/${baseQueryParams}&playwrightId=search-flow`);

    await page.getByRole('link', { name: 'Tilbake', exact: true }).click();
    await expect(page).toHaveURL(`${defaultAppURL}&playwrightId=search-flow`);
  });

  test('should correctly insert text at cursor using key presses ', async ({ page }) => {
    await page.goto(appUrlWithPlaywrightId('search-flow'));
    await page.getByTestId('searchbar-input').click();
    await page.getByTestId('searchbar-input').fill('message');

    await page.getByTestId('searchbar-input').evaluate((el: HTMLInputElement) => {
      el.setSelectionRange(0, 0);
    });

    await page.getByTestId('searchbar-input').press('T');
    await page.getByTestId('searchbar-input').press('h');
    await page.getByTestId('searchbar-input').press('i');
    await page.getByTestId('searchbar-input').press('r');
    await page.getByTestId('searchbar-input').press('d');
    await page.getByTestId('searchbar-input').press('Space');
    await page.getByTestId('searchbar-input').press('t');
    await page.getByTestId('searchbar-input').press('e');
    await page.getByTestId('searchbar-input').press('s');
    await page.getByTestId('searchbar-input').press('t');
    await page.getByTestId('searchbar-input').press('Space');
    await expect(page.getByTestId('searchbar-input')).toHaveAttribute('value', 'Third test message');
  });
});
