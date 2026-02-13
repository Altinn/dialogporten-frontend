import { type Locator, type Page, expect } from '@playwright/test';

export const getSidebar = (page: Page) => page.locator('aside');
export const getSidebarMenuItem = (page: Page, route: string) => getSidebar(page).locator(`a[href*="${route}?"]`);
export const getSearchbarInput = (page: Page) => page.locator("[name='Søk']");

export async function performSearch(page: Page, query: string, action?: 'clear' | 'click' | 'enter') {
  const endGameAction = action || 'click';
  const searchbarInput = page.getByTestId('inbox-toolbar').getByPlaceholder('Søk ...');
  await searchbarInput.click();
  await expect(searchbarInput).toBeVisible();
  await searchbarInput.fill(query);
  const searchButton = page.getByRole('option', { name: 'Søk i innboksen etter ' + query });
  await expect(searchButton).toBeVisible();

  if (endGameAction === 'clear') {
    await page.getByTestId('clear-button').click();
  } else if (endGameAction === 'click') {
    await searchButton.click();
  } else if (endGameAction === 'enter') {
    await page.keyboard.press('Enter');
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
  const btn = dialogItem.locator(`button[aria-label^="Kontekstmeny for dialog med tittel ${title}"]`);

  await btn.click();
  await expect(btn).toHaveAttribute('aria-expanded', 'true');

  const menuRoot = dialogItem.locator('[id^="dialog-context-menu-"][id$="-root"]');
  const menu = menuRoot.locator('[role="menu"]');
  await expect(menu).toBeVisible();

  return { dialogItem, menuRoot };
}
