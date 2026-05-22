import { type Locator, type Page, expect } from '@playwright/test';
import { baseURL } from '../';

/**
 * Sets the AltinnPartyUuid cookie before page load so the app
 * initializes with the given party pre-selected (simulating a
 * returning user whose last-used party was persisted in a cookie).
 */
export async function setPartyCookie(page: Page, partyUuid: string) {
  const url = new URL(baseURL);
  await page.context().addCookies([
    {
      name: 'AltinnPartyUuid',
      value: partyUuid,
      domain: url.hostname,
      path: '/',
    },
  ]);
}

export const getSidebar = (page: Page) => page.locator('aside');
export const getSidebarMenuItem = (page: Page, route: string) => getSidebar(page).locator(`a[href^="${route}?"]`);
export const getSearchbarInput = (page: Page) => page.locator("[name='Søk']");

export async function performSearch(page: Page, query: string, action?: 'clear' | 'click' | 'enter') {
  const endGameAction = action || 'click';
  const searchbarInput = page.getByTestId('inbox-toolbar').getByRole('combobox', { name: 'Søk' });
  await searchbarInput.click();
  await expect(searchbarInput).toBeVisible();
  await searchbarInput.fill(query);
  if (endGameAction === 'clear') {
    await page.getByTestId('clear-button').click();
  } else {
    await page.keyboard.press('Enter');
    await page.waitForURL((url) => url.searchParams.has('search'));
  }
}

export async function expectIsCompanyPage(page: Page) {
  await expect(page.locator('#root > .app > div')).toHaveAttribute('data-color', 'company');
}

export async function expectIsNeutralPage(page: Page) {
  await expect(page.locator('#root > .app > div')).toHaveAttribute('data-color', 'neutral');
}

export async function expectIsPersonPage(page: Page) {
  await expect(page.locator('#root > .app > div')).toHaveAttribute('data-color', 'person');
}
export async function getToolbarAccountInfo(page: Page, name: string): Promise<{ found: boolean; item?: Locator }> {
  const toolbar = page.getByTestId('inbox-toolbar');
  const items = toolbar.locator('li');

  // Find li with <a> containing the given name
  const matchingItem = items.filter({ hasText: name });

  if ((await matchingItem.count()) === 0) {
    return { found: false };
  }

  return { found: true, item: matchingItem };
}

export async function selectPartyFromToolbar(page: Page, partyName: string) {
  const toolbar = page.locator('#toolbar-menu-listbox');
  await toolbar.locator('li').filter({ hasText: partyName }).nth(1).click();
}

export async function openContextMenuForDialog(page: Page, title: string) {
  const dialogItem = page.locator('li', { has: page.getByRole('link', { name: title }) }).first();
  const btn = dialogItem.getByRole('button', { name: 'Åpne meny' });

  await btn.click();

  // Menu is rendered via React portal to document.body — locate at page level
  const menuRoot = page.locator('[role="menu"]:not([aria-hidden="true"])');
  await expect(menuRoot).toBeVisible();

  return { dialogItem, menuRoot };
}
