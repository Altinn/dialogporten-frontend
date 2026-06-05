import type { Page } from '@playwright/test';
import { expect, test } from '../fixtures';
import { appUrlWithPlaywrightId } from '../index';
import { expectIsPersonPage } from './common';

const appURL = appUrlWithPlaywrightId('all-persons');
const ALL_PERSONS_ID = 'ALL_PERSONS';
const KARI_ID = 'urn:altinn:person:identifier-no:2';

/** Opens the account menu and clicks the entry by its account id (party URN, or the group id). */
const selectAccount = async (page: Page, id: string) => {
  await page.locator('#toolbar-menu-root > button').click();
  await page.locator(`#toolbar-menu-root button[id="${id}"]`).click();
};

test.describe('All persons group', () => {
  test('offers "Alle personer" and shows every person\'s dialogs, including your own', async ({ page }) => {
    await page.goto(appURL);

    // Default selection is the logged-in person, who only sees their own dialog.
    await expect(page.locator('#toolbar-menu-root')).toContainText('Test Testesen');
    const inbox = page.locator('main');
    await expect(inbox.getByRole('link', { name: 'Skattemelding for Test Testesen' })).toBeVisible();
    await expect(inbox.getByRole('link', { name: 'Skattemelding for Kari Nordmann' })).toBeHidden();

    // The group tile is offered (more than one person beyond yourself) and selectable.
    await selectAccount(page, ALL_PERSONS_ID);

    // New group URL param — and crucially, no individual person URN is exposed.
    await expect(page).toHaveURL(/group=ALL_PERSONS/);
    expect(new URL(page.url()).searchParams.has('party')).toBe(false);

    const toolbar = page.getByTestId('inbox-toolbar');
    await expect(toolbar.getByRole('button', { name: 'Alle personer' })).toBeVisible();
    // The persons sub-account menu appears and counts all four persons (you + three others).
    await expect(toolbar.getByRole('button', { name: '4 personer' })).toBeVisible();

    // Every person's dialog is now visible — including the end user's own.
    await expect(inbox.getByRole('link', { name: 'Skattemelding for Test Testesen' })).toBeVisible();
    await expect(inbox.getByRole('link', { name: 'Skattemelding for Kari Nordmann' })).toBeVisible();
    await expect(inbox.getByRole('link', { name: 'Skattemelding for Ola Nordmann' })).toBeVisible();
    await expect(inbox.getByRole('link', { name: 'Skattemelding for Per Hansen' })).toBeVisible();
  });

  test('selecting a single person clears the group and narrows the inbox', async ({ page }) => {
    await page.goto(appURL);
    await expect(page.locator('#toolbar-menu-root')).toContainText('Test Testesen');

    // Enter the group, then pick a single other person.
    await selectAccount(page, ALL_PERSONS_ID);
    await expect(page).toHaveURL(/group=ALL_PERSONS/);

    await selectAccount(page, KARI_ID);

    await expect(page.locator('#toolbar-menu-root')).toContainText('Kari Nordmann');
    await expectIsPersonPage(page);

    // Person selections never expose the URN, and the group param is cleared.
    const params = new URL(page.url()).searchParams;
    expect(params.has('group')).toBe(false);
    expect(params.has('party')).toBe(false);

    // The inbox narrows to just Kari's dialog.
    const inbox = page.locator('main');
    await expect(inbox.getByRole('link', { name: 'Skattemelding for Kari Nordmann' })).toBeVisible();
    await expect(inbox.getByRole('link', { name: 'Skattemelding for Ola Nordmann' })).toBeHidden();
  });
});
