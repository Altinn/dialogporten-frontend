import { type Page, expect } from '@playwright/test';

export const getSidebar = (page: Page) => page.locator('aside');
export const getSidebarMenuItem = (page: Page, route: string) => getSidebar(page).locator(`li a[href^="${route}?"]`);
export const getSidebarMenuItemBadge = (page: Page, route: string) =>
  getSidebarMenuItem(page, route).locator('div > span + span + span');
export const getSearchbarInput = (page: Page) => page.locator("[name='Søk']");

export async function performSearch(page, query: string, action?: 'clear' | 'click' | 'enter') {
  const endGameAction = action || 'click';
  const searchbarInput = page.locator("[name='Søk']");
  await searchbarInput.click();
  await expect(searchbarInput).toBeVisible();
  await page.locator("[name='Søk']").fill(query);
  const searchLink = page.getByRole('link', { name: 'Søk i innboks etter ' + query });

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
export async function getToolbarAccountInfo(page: Page, name: string): Promise<{ found: boolean; count?: number }> {
  const toolbar = page.getByTestId('inbox-toolbar');
  const liElements = toolbar.locator('li');

  const matchingElement = liElements.filter({ hasText: name });

  if ((await matchingElement.count()) === 0) {
    return { found: false };
  }

  const index = await liElements
    .locator('a > div')
    .allTextContents()
    .then((texts) => texts.findIndex((text) => text.match(new RegExp(`^[A-Za-z]\\s*${name}\\s*\\d+$`))));

  if (index === -1) {
    return { found: false };
  }

  const matchingCount = await liElements.locator('a > div').nth(index).locator('span > span').nth(1).textContent();
  const count = matchingCount ? Number(matchingCount.trim()) : undefined;

  return { found: true, count };
}
