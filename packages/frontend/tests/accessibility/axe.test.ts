import fs from 'node:fs';
import path from 'node:path';
import { AxeBuilder } from '@axe-core/playwright';
import { type Page, expect, test } from '@playwright/test';
import { createHtmlReport } from 'axe-html-reporter';
import { PageRoutes } from '../../src/pages/routes';
import {
  appURLArchived,
  appURLBin,
  appURLDrafts,
  appURLInbox,
  appURLSavedSearches,
  appURLSent,
  appUrlWithPlaywrightId,
} from '../index';
import { getSidebarMenuItem } from '../stories/common';

const WCAG_TAGS_CONFIG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const VIOLATION_FILTERS = ['critical', 'serious'];
const REPORTS_DIR = './axe-reports';

if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

const expectWithFilterViolations = async (violations) => {
  const filteredViolations = violations.filter((violation) => VIOLATION_FILTERS.includes(violation.impact));
  expect(filteredViolations).toEqual([]);
};

const testAccessibility = async (page: Page, url: string, name: string) => {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  const accessibilityScanResults = await new AxeBuilder({ page }).withTags(WCAG_TAGS_CONFIG).analyze();

  const reportPath = path.join(REPORTS_DIR, `axe-report-${name.replace(/\W/g, '_')}.html`);
  createHtmlReport({
    results: accessibilityScanResults,
    options: {
      outputDir: REPORTS_DIR,
      reportFileName: `axe-report-${name.replace(/\W/g, '_')}.html`,
    },
  });

  console.info(`Accessibility report generated: ${reportPath}`);

  await expectWithFilterViolations(accessibilityScanResults.violations);
};

test.describe('Axe test', () => {
  const testCases = [
    { name: 'Inbox', path: appURLInbox },
    { name: 'Drafts', path: appURLDrafts },
    { name: 'Sent', path: appURLSent },
    { name: 'Archive', path: appURLArchived },
    { name: 'SavedSearches', path: appURLSavedSearches },
    { name: 'Bin', path: appURLBin },
  ];

  for (const { name, path } of testCases) {
    test(`${name} - should not have any automatically detectable accessibility issues`, async ({ page }) => {
      await testAccessibility(page, path, name);
    });
  }

  test('should not have any automatically detectable accessibility issues for the Saved Search page with saved searches', async ({
    page,
  }) => {
    await page.goto(appURLInbox);
    await page.waitForLoadState('networkidle');
    const toolbarArea = page.getByTestId('inbox-toolbar');
    await toolbarArea.getByRole('button', { name: 'add' }).click();

    await toolbarArea.getByText('Velg avsender').locator('visible=true').click();
    await toolbarArea.getByLabel('Oslo kommune').locator('visible=true').check();

    await page.mouse.click(200, 0, { button: 'left' });

    await page.getByRole('button', { name: 'Lagre søk' }).click();
    await expect(page.getByText('Søket ditt er lagret')).toBeVisible();
    await getSidebarMenuItem(page, PageRoutes.savedSearches).click();
    await expect(page.getByRole('main')).toContainText('1 lagret søk');

    const accessibilityScanResults = await new AxeBuilder({ page }).withTags(WCAG_TAGS_CONFIG).analyze();
    await expectWithFilterViolations(accessibilityScanResults.violations);

    await page.getByRole('button', { name: 'savedSearches.' }).click();
    const accessibilityScanResultsMenuOpen = await new AxeBuilder({ page }).withTags(WCAG_TAGS_CONFIG).analyze();
    await expectWithFilterViolations(accessibilityScanResultsMenuOpen.violations);
  });

  test('should not have any automatically detectable accessibility issues for the Bin and Archived pages with items', async ({
    page,
  }) => {
    await page.goto(appUrlWithPlaywrightId('login-party-context'));
    await expect(page.locator('h2').filter({ hasText: /^Skatten din for 2022$/ })).toBeVisible();
    await page.getByRole('link', { name: 'Skatten din for 2022' }).click();
    await page.getByRole('button', { name: 'Flytt til papirkurv' }).click();
    await expect(page.getByText('Flyttet til papirkurv')).toBeVisible();
    await getSidebarMenuItem(page, PageRoutes.bin).click();
    const accessibilityScanResultsBin = await new AxeBuilder({ page }).withTags(WCAG_TAGS_CONFIG).analyze();
    await expectWithFilterViolations(accessibilityScanResultsBin.violations);

    await page.getByRole('link', { name: 'Skatten din for 2022' }).click();
    await page.getByRole('button', { name: 'Flytt til arkiv' }).click();
    await getSidebarMenuItem(page, PageRoutes.archive).click();
    const accessibilityScanResultsArchive = await new AxeBuilder({ page }).withTags(WCAG_TAGS_CONFIG).analyze();
    await expectWithFilterViolations(accessibilityScanResultsArchive.violations);
  });

  test('should not have any automatically detectable accessibility issues for the dialog detailed view', async ({
    page,
  }) => {
    await page.goto(appURLInbox);
    await expect(page.locator('h2').filter({ hasText: /^Skatten din for 2022$/ })).toBeVisible();
    await page.getByRole('link', { name: 'Skatten din for 2022' }).click();

    const accessibilityScanResults = await new AxeBuilder({ page }).withTags(WCAG_TAGS_CONFIG).analyze();
    await expectWithFilterViolations(accessibilityScanResults.violations);

    await page.locator('a').filter({ hasText: 'Aktivitetslogg' }).click();
    const accessibilityScanResultsActivityLogTab = await new AxeBuilder({ page }).withTags(WCAG_TAGS_CONFIG).analyze();
    await expectWithFilterViolations(accessibilityScanResultsActivityLogTab.violations);
  });

  test('should not have any automatically detectable accessibility issues for menus and dropdowns', async ({
    page,
  }) => {
    await page.goto(appURLInbox);
    await page.waitForLoadState('networkidle');
    await page.getByTestId('searchbar-input').fill('mel');

    const accessibilityScanResultsSearchBar = await new AxeBuilder({ page }).withTags(WCAG_TAGS_CONFIG).analyze();
    await expectWithFilterViolations(accessibilityScanResultsSearchBar.violations);

    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: 'Test Testesen' }).click();
    const accessibilityScanResultsPartyDropdown = await new AxeBuilder({ page }).withTags(WCAG_TAGS_CONFIG).analyze();
    await expectWithFilterViolations(accessibilityScanResultsPartyDropdown.violations);
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: 'Meny' }).click();
    const accessibilityScanResultsHeaderMenu = await new AxeBuilder({ page }).withTags(WCAG_TAGS_CONFIG).analyze();
    await expectWithFilterViolations(accessibilityScanResultsHeaderMenu.violations);
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: 'add' }).click();
    const accessibilityScanResultsFilterDropdown = await new AxeBuilder({ page }).withTags(WCAG_TAGS_CONFIG).analyze();
    await expectWithFilterViolations(accessibilityScanResultsFilterDropdown.violations);
  });
});
