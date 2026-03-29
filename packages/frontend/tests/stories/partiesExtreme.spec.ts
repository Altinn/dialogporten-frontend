import { baseURL } from '../';
import { expect, test } from '../fixtures';
import { expectIsCompanyPage, expectIsPersonPage, setPartyCookie } from './common';

const appURL = `${baseURL}/?mock=true&playwrightId=parties-extreme`;

/**
 * Performance-oriented tests for the parties-extreme story (15 000 parties).
 *
 * These tests assert that the app remains usable under a large party list:
 *  – initial load completes within a budget
 *  – party switching is responsive
 *  – the account menu can be opened and searched
 *
 * A generous timeout (30 s) is set per test so CI doesn't flake, but each
 * test records and logs real timings so regressions are visible in output.
 */

/* Give these tests extra room – 15k parties is heavy */
test.describe.configure({ timeout: 30_000 });

test.describe('Parties extreme (15 000 parties)', () => {
  test('loads and becomes interactive within performance budget', async ({ page }) => {
    const start = Date.now();
    await page.goto(appURL);

    // Wait for the toolbar to show the current end user – that means parties
    // have been fetched, processed, and the UI has settled.
    await expect(page.locator('#toolbar-menu-root')).toContainText('Ola Hansen', { timeout: 15_000 });
    const loadTime = Date.now() - start;

    // The inbox list should render (dialogs come from base mock data)
    await expect(page.locator('main')).toBeVisible();

    // eslint-disable-next-line no-console -- intentional perf logging
    console.debug(`[perf] Initial load with 15k parties: ${loadTime}ms`);

    // Fail if it takes more than 10 seconds – a signal something regressed
    expect(loadTime).toBeLessThan(10_000);
  });

  test('can open account menu and see parties', async ({ page }) => {
    await page.goto(appURL);
    await expect(page.locator('#toolbar-menu-root')).toContainText('Ola Hansen', { timeout: 15_000 });

    const start = Date.now();
    await page.locator('#toolbar-menu-root > button').click();

    // The account menu should appear
    const menu = page.locator('#toolbar-menu-listbox');
    await expect(menu).toBeVisible();

    // Should contain "Alle virksomheter" group and person entries
    await expect(page.getByRole('option', { name: 'Alle virksomheter' })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Kari Johansen' })).toBeVisible();

    const menuOpenTime = Date.now() - start;
    console.debug(`[perf] Account menu open with 15k parties: ${menuOpenTime}ms`);

    expect(menuOpenTime).toBeLessThan(5_000);
  });

  test('can switch to a company party via search', async ({ page }) => {
    await page.goto(appURL);
    await expect(page.locator('#toolbar-menu-root')).toContainText('Ola Hansen', { timeout: 15_000 });

    // Open the account menu
    await page.locator('#toolbar-menu-root > button').click();
    await expect(page.locator('#toolbar-menu-listbox')).toBeVisible();

    // Search for a specific company to find it in the 15k list
    const searchInput = page.getByRole('searchbox', { name: 'Søk etter aktør' });
    await searchInput.fill('Stavanger');

    // Click the first matching company option
    const start = Date.now();
    const firstMatch = page
      .locator('#toolbar-menu-listbox [role="option"]')
      .filter({ hasText: /Stavanger/i })
      .first();
    await expect(firstMatch).toBeVisible();
    const matchName = await firstMatch.innerText();
    await firstMatch.click();

    // Verify company was selected
    await expectIsCompanyPage(page);
    await expect(page.locator('#toolbar-menu-root')).toContainText(/Stavanger/i);

    const switchTime = Date.now() - start;
    console.debug(`[perf] Switch to company party (${matchName.trim().split('\n')[0]}): ${switchTime}ms`);

    expect(switchTime).toBeLessThan(5_000);
  });

  test('can switch to all organizations', async ({ page }) => {
    await page.goto(appURL);
    await expect(page.locator('#toolbar-menu-root')).toContainText('Ola Hansen', { timeout: 15_000 });

    // Open the account menu
    await page.locator('#toolbar-menu-root > button').click();
    await expect(page.locator('#toolbar-menu-listbox')).toBeVisible();

    // Select "Alle virksomheter"
    const start = Date.now();
    await page.getByRole('option', { name: 'Alle virksomheter' }).click();

    // URL should reflect all parties
    await expect(page).toHaveURL(/allParties=true/);

    const switchTime = Date.now() - start;
    console.debug(`[perf] Switch to all organizations with 15k parties: ${switchTime}ms`);

    expect(switchTime).toBeLessThan(5_000);
  });

  test('can switch back to person after selecting company', async ({ page }) => {
    // Pre-select a company via cookie so we start on company view
    await setPartyCookie(page, 'urn:altinn:organization:uuid:000001');
    await page.goto(appURL);

    // Wait for the company to be fully resolved from cookie before asserting page color
    await expect(page.locator('#toolbar-menu-root')).toContainText(/Transport/i, { timeout: 15_000 });
    await expectIsCompanyPage(page);

    // Switch to person (current end user)
    await page.locator('#toolbar-menu-root > button').click();
    await expect(page.locator('#toolbar-menu-listbox')).toBeVisible();

    const start = Date.now();
    await page.getByRole('option', { name: 'Ola Hansen' }).first().click();

    await expectIsPersonPage(page);
    await expect(page.locator('#toolbar-menu-root')).toContainText('Ola Hansen');

    const switchTime = Date.now() - start;
    console.debug(`[perf] Switch from company to person: ${switchTime}ms`);

    expect(switchTime).toBeLessThan(7_000);
  });

  test('account menu search filters 15k parties responsively', async ({ page }) => {
    await page.goto(appURL);
    await expect(page.locator('#toolbar-menu-root')).toContainText('Ola Hansen', { timeout: 15_000 });

    // Open the account menu
    await page.locator('#toolbar-menu-root > button').click();
    await expect(page.locator('#toolbar-menu-listbox')).toBeVisible();

    // Type in the search field
    const searchInput = page.getByRole('searchbox', { name: 'Søk etter aktør' });
    await expect(searchInput).toBeVisible();

    const start = Date.now();
    await searchInput.fill('Tromsø Bygg');

    // Wait for results to filter — should show matching entries
    await expect(
      page
        .locator('#toolbar-menu-listbox [role="option"]')
        .filter({ hasText: /Tromsø Bygg/i })
        .first(),
    ).toBeVisible();

    const searchTime = Date.now() - start;
    console.debug(`[perf] Account menu search with 15k parties: ${searchTime}ms`);

    expect(searchTime).toBeLessThan(7_000);
  });
});
