import { expect, type Locator, type Page } from '@playwright/test';
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

/* TODO: Improve selector */
export async function openContextMenuForDialog(page: Page, title: string) {
  const dialogItem = page.locator('li', { has: page.getByRole('link', { name: title }) }).first();
  // The trigger's accessible name clears once the menu opens, so target the stable
  // aria-haspopup attribute instead of the name to keep the locator valid afterwards.
  const btn = dialogItem.locator('button[aria-haspopup="menu"]');

  await btn.click();
  await expect(btn).toHaveAttribute('aria-expanded', 'true');

  // Every dialog renders its own context menu; the trigger's aria-controls points to
  // this one's unique id, so scope to it rather than the shared menu role/prefix.
  const menuId = await btn.getAttribute('aria-controls');
  const menuRoot = page.locator(`[id="${menuId}"]`);
  await expect(menuRoot).toBeVisible();

  return { dialogItem, menuRoot };
}
