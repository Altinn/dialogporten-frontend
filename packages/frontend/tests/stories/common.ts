import { type Locator, type Page, expect } from '@playwright/test';

export const getSidebar = (page: Page) => page.locator('aside');
export const getSidebarMenuItem = (page: Page, route: string) => getSidebar(page).locator(`a[href*="${route}?"]`);
export const getSidebarMenuItemBadge = (page: Page, route: string) =>
  getSidebarMenuItem(page, route).locator('[data-variant="subtle"] span');
export const getSearchbarInput = (page: Page) => page.locator("[name='Søk']");

export async function performSearch(page, query: string, action?: 'clear' | 'click' | 'enter') {
  const endGameAction = action || 'click';
  const searchbarInput = page.locator("[name='Søk']");
  await searchbarInput.click();
  await expect(searchbarInput).toBeVisible();
  await page.locator("[name='Søk']").fill(query);
  const searchLink = page.getByRole('link', { name: 'Søk i innboksen etter ' + query });

  if (endGameAction === 'clear') {
    await page.getByTestId('search-button-clear').click();
  } else if (endGameAction === 'click') {
    await searchLink.click();
  } else if (endGameAction === 'enter') {
    await page.keyboard.press('Enter');
  }
}

export async function selectDialogBySearch(page, query: string, action?: 'click' | 'enter' | 'nothing') {
  const endGameAction = action || 'click';
  const searchbarInput = page.locator("[name='Søk']");

  await searchbarInput.click();
  await expect(searchbarInput).toBeVisible();
  await searchbarInput.fill(query);

  if (endGameAction === 'click') {
    await page.getByRole('banner').getByRole('link', { name: 'Sixth test message' }).click();
  } else if (endGameAction === 'enter') {
    await page.keyboard.press('Enter');
  }
}

export async function expectIsCompanyPage(page: Page) {
  await expect(page.locator('#root > .app > div')).toHaveAttribute('data-color', 'company');
}

export async function expectIsPersonPage(page: Page) {
  await expect(page.locator('#root > .app > div')).toHaveAttribute('data-color', 'person');
}
export async function getToolbarAccountInfo(
  page: Page,
  name: string,
): Promise<{ found: boolean; alertCount?: number; badgeCount?: number; item?: Locator }> {
  const toolbar = page.getByTestId('inbox-toolbar');
  const items = toolbar.locator('li');

  // Find li with <a> containing the given name
  const matchingItem = items.filter({ hasText: name });

  if ((await matchingItem.count()) === 0) {
    return { found: false };
  }

  const badgeLocator = matchingItem.first().locator('[data-variant="subtle"] span');

  const alertText = await badgeLocator.first().textContent();
  const badgeText = await badgeLocator.last().textContent();
  const alertCount = alertText ? Number(alertText.trim()) : undefined;
  const badgeCount = badgeText ? Number(badgeText.trim()) : undefined;

  return { found: true, alertCount, badgeCount, item: matchingItem };
}
