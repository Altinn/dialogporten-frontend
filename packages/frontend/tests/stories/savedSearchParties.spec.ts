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
  await performSearch(page, searchTerm);
  // Ensure the exact term is in the URL before saving (performSearch only checks has('search'))
  await page.waitForURL((url) => url.searchParams.get('search') === searchTerm);
  // Wait for React to re-render with the new URL params, so SaveSearchButton's
  // enteredSearchValue closure captures the correct (updated) search term.
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Lagre søk' }).click();
  await expect(page.getByText('Søket ditt er lagret').first()).toBeVisible();
  await page.getByRole('button', { name: 'Avbryt' }).click();
}

async function switchParty(page: Page, partyName: string) {
  await page.locator('#toolbar-menu-root > button').click();
  // Use getByRole('option') for "Alle virksomheter" because selectPartyFromToolbar's
  // li.nth(1) approach is ambiguous when a group heading also has that exact text.
  if (partyName === 'Alle virksomheter') {
    await page.getByRole('option', { name: partyName }).click();
  } else {
    await selectPartyFromToolbar(page, partyName);
  }
  await page.waitForLoadState('networkidle');
}

test.describe('Saved search — party URL verification', () => {
  test('Saves for both person, all parties and single organizations parties and verifies full navigation flow', async ({
    page,
  }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    await saveSearchAndDismiss(page, 'person1test');

    await switchParty(page, 'Anne Andersen');
    await saveSearchAndDismiss(page, 'person2test');

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

    await page.getByTestId('sidebar-saved-searches').click({ force: true });
    await page.waitForLoadState('networkidle');

    await link1.click();
    await page.waitForLoadState('networkidle');
    await expectIsPersonPage(page);
    await expect(page.getByTestId('inbox-toolbar').getByRole('button', { name: 'Test Testesen' })).toBeVisible();

    //Alle virksomheter:
    await switchParty(page, 'Alle virksomheter');
    // Wait for the URL to have allParties=true — ensures the navigate() in onSelectAccount
    // completed and the useEffect in useParties has fired to update allOrganizationsSelected.
    await page.waitForURL((url) => url.searchParams.get('allParties') === 'true');
    await expect(page.locator('#toolbar-menu-root')).toContainText('Alle virksomheter');

    await page.waitForLoadState('networkidle');
    await saveSearchAndDismiss(page, 'allOrgsTest');

    // Firma AS (ORG_1):
    await switchParty(page, 'Firma AS');
    await saveSearchAndDismiss(page, 'org1test');

    // Testbedrift AS (ORG_2):
    await switchParty(page, 'Testbedrift AS');
    await saveSearchAndDismiss(page, 'org2test');

    // Navigate to saved searches and verify all org links are present
    await page.getByTestId('sidebar-saved-searches').click({ force: true });
    await page.waitForLoadState('networkidle');

    const linkAllOrgs = page.locator(`a[href*="search=allOrgsTest"][href*="allParties=true"]`);
    const linkOrg1 = page.locator(`a[href*="search=org1test"][href*="${ORG_1_URN_ENCODED}"]`);
    const linkOrg2 = page.locator(`a[href*="search=org2test"][href*="${ORG_2_URN_ENCODED}"]`);
    await expect(linkAllOrgs).toBeVisible();
    await expect(linkOrg1).toBeVisible();
    await expect(linkOrg2).toBeVisible();

    // allOrgsTest → Alle virksomheter
    await linkAllOrgs.click();
    await page.waitForURL(
      (url) => url.searchParams.get('allParties') === 'true' && url.searchParams.get('search') === 'allOrgsTest',
    );
    await page.waitForLoadState('networkidle');

    const goToSavedSearches = () => page.locator('aside a[href*="/saved-searches"]').click();

    // org1test → Firma AS
    await goToSavedSearches();
    await page.waitForLoadState('networkidle');
    await linkOrg1.click();
    await page.waitForURL((url) => url.searchParams.has('search'));
    await page.waitForLoadState('networkidle');
    await expectIsCompanyPage(page);
    await expect(page.getByTestId('inbox-toolbar').getByRole('button', { name: 'Firma AS' })).toBeVisible();

    // org2test → Testbedrift AS
    await goToSavedSearches();
    await page.waitForLoadState('networkidle');
    await linkOrg2.click();
    await page.waitForURL((url) => url.searchParams.has('search'));
    await page.waitForLoadState('networkidle');
    await expectIsCompanyPage(page);
    await expect(page.getByTestId('inbox-toolbar').getByRole('button', { name: 'Testbedrift AS' })).toBeVisible();

    // From single org (Testbedrift AS) → person1test (Test Testesen)
    await goToSavedSearches();
    await page.waitForLoadState('networkidle');
    await link1.click();
    await page.waitForURL((url) => url.searchParams.get('search') === 'person1test');
    await page.waitForLoadState('networkidle');
    await expectIsPersonPage(page);
    await expect(page.getByTestId('inbox-toolbar').getByRole('button', { name: 'Test Testesen' })).toBeVisible();

    // From Alle virksomheter → person1test (Test Testesen)
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
