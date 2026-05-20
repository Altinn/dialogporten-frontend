import type { Page } from '@playwright/test';
import { appUrlWithPlaywrightId } from '../';
import { PageRoutes } from '../../src/pages/routes';
import { expect, test } from '../fixtures';
import {
  expectIsCompanyPage,
  expectIsPersonPage,
  getSidebarMenuItem,
  performSearch,
  selectPartyFromToolbar,
} from './common';

const BASE_URL = appUrlWithPlaywrightId('save-search-parties');
const ORG_1_URN = 'urn:altinn:organization:identifier-no:1';
const ORG_2_URN = 'urn:altinn:organization:identifier-no:2';
// URLSearchParams encodes ':' as '%3A' in hrefs produced by buildSavedSearchURL
const ORG_1_URN_ENCODED = encodeURIComponent(ORG_1_URN);
const ORG_2_URN_ENCODED = encodeURIComponent(ORG_2_URN);

async function saveSearchAndDismiss(page: Page, searchTerm: string) {
  const toolbar = page.getByTestId('inbox-toolbar');
  const saveButton = toolbar.getByRole('button', { name: 'Lagre søk' });
  const savedButton = toolbar.getByRole('button', { name: 'Lagret søk' });

  await performSearch(page, searchTerm);
  await page.waitForURL((url) => url.searchParams.get('search') === searchTerm);
  await expect(saveButton).toBeVisible();
  await saveButton.click();

  await page.getByRole('dialog').getByRole('button', { name: 'Lagre søk' }).click();
  await expect(savedButton).toBeVisible();
}

async function switchParty(page: Page, partyName: string) {
  await page.locator('#toolbar-menu-root > button').click();

  if (partyName === 'Alle virksomheter') {
    await page.getByRole('option', { name: partyName }).click();
  } else {
    await selectPartyFromToolbar(page, partyName);
  }

  await expect(page.locator('#toolbar-menu-root')).toContainText(partyName);
  await page.waitForLoadState('networkidle');
}

test.describe('Saved search — party URL verification', () => {
  test('Saves for both person, all parties and single organizations parties and verifies full navigation flow', async ({
    page,
  }) => {
    test.slow();

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    //user 1 (default)
    await saveSearchAndDismiss(page, 'person1test');

    //user 2
    await switchParty(page, 'Anne Andersen');
    await saveSearchAndDismiss(page, 'person2test');

    //both visible in saved searches and correct navigation
    await getSidebarMenuItem(page, PageRoutes.savedSearches).click();
    const link1 = page.locator('a[href*="search=person1test"]').first();
    await expect(link1).toBeVisible();
    const link2 = page.locator('a[href*="search=person2test"]').first();
    await expect(link2).toBeVisible();

    await link2.click();
    await page.waitForURL((url) => url.searchParams.has('search'));
    await page.waitForLoadState('networkidle');
    await expectIsPersonPage(page);
    await expect(page.getByTestId('inbox-toolbar').getByRole('button', { name: 'Anne Andersen' })).toBeVisible();

    await page.locator('aside a[href*="/saved-searches"]').click();
    await page.waitForLoadState('networkidle');

    await link1.click();
    await page.waitForLoadState('networkidle');
    await expectIsPersonPage(page);
    await expect(page.getByTestId('inbox-toolbar').getByRole('button', { name: 'Test Testesen' })).toBeVisible();

    // All oartues
    await switchParty(page, 'Alle virksomheter');
    await page.waitForURL((url) => url.searchParams.get('allParties') === 'true');
    await expect(page.locator('#toolbar-menu-root')).toContainText('Alle virksomheter');
    await page.waitForLoadState('networkidle');
    await saveSearchAndDismiss(page, 'allOrgsTest');

    await switchParty(page, 'Firma AS');
    await saveSearchAndDismiss(page, 'org1test');

    await switchParty(page, 'Testbedrift AS');
    await saveSearchAndDismiss(page, 'org2test');

    // orgs navigation verification
    await page.locator('aside a[href*="/saved-searches"]').click();
    await page.waitForLoadState('networkidle');

    const linkAllOrgs = page.locator(`a[href*="search=allOrgsTest"][href*="allParties=true"]`);
    const linkOrg1 = page.locator(`a[href*="search=org1test"][href*="${ORG_1_URN_ENCODED}"]`);
    const linkOrg2 = page.locator(`a[href*="search=org2test"][href*="${ORG_2_URN_ENCODED}"]`);
    await expect(linkAllOrgs).toBeVisible();
    await expect(linkOrg1).toBeVisible();
    await expect(linkOrg2).toBeVisible();

    const goToSavedSearches = () => page.locator('aside a[href*="/saved-searches"]').click();

    await linkAllOrgs.click();
    await page.waitForURL(
      (url) => url.searchParams.get('allParties') === 'true' && url.searchParams.get('search') === 'allOrgsTest',
    );
    await page.waitForLoadState('networkidle');

    await goToSavedSearches();
    await page.waitForLoadState('networkidle');
    await linkOrg1.click();
    await page.waitForURL((url) => url.searchParams.has('search'));
    await page.waitForLoadState('networkidle');
    await expectIsCompanyPage(page);
    await expect(page.getByTestId('inbox-toolbar').getByRole('button', { name: 'Firma AS' })).toBeVisible();

    await goToSavedSearches();
    await page.waitForLoadState('networkidle');
    await linkOrg2.click();
    await page.waitForURL((url) => url.searchParams.has('search'));
    await page.waitForLoadState('networkidle');
    await expectIsCompanyPage(page);
    await expect(page.getByTestId('inbox-toolbar').getByRole('button', { name: 'Testbedrift AS' })).toBeVisible();

    await goToSavedSearches();
    await page.waitForLoadState('networkidle');
    await link1.click();
    await page.waitForURL((url) => url.searchParams.get('search') === 'person1test');
    await page.waitForLoadState('networkidle');
    await expectIsPersonPage(page);
    await expect(page.getByTestId('inbox-toolbar').getByRole('button', { name: 'Test Testesen' })).toBeVisible();

    await goToSavedSearches();
    await page.waitForLoadState('networkidle');
    await linkAllOrgs.click();
    await page.waitForURL((url) => url.searchParams.get('allParties') === 'true');
    await page.waitForLoadState('networkidle');
    await goToSavedSearches();
    await page.waitForLoadState('networkidle');
    await link1.click();
    await page.waitForURL((url) => url.searchParams.get('search') === 'person1test');
    await page.waitForLoadState('networkidle');
    await expectIsPersonPage(page);
    await expect(page.getByTestId('inbox-toolbar').getByRole('button', { name: 'Test Testesen' })).toBeVisible();
  });
});
