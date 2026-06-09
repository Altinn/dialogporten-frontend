import { baseURL } from '../';
import { expect, test } from '../fixtures';
import { expectIsCompanyPage, expectIsPersonPage, setPartyCookie } from './common';

const appURL = `${baseURL}/?mock=true&playwrightId=login-party-context`;

const FIRMA_AS_UUID = 'urn:altinn:organization:uuid:firma-as';
const FIRMA_AS_URN = 'urn:altinn:organization:identifier-no:1';
const PERSON_UUID = 'urn:altinn:person:uuid:test-testesen';
const TESTBEDRIFT_UUID = 'urn:altinn:organization:uuid:testbedrift-main';
const TESTBEDRIFT_URN = 'urn:altinn:organization:identifier-no:2';

test.describe('Cookie-based party preselection', () => {
  test('Preselects company party from cookie on load', async ({ page }) => {
    await setPartyCookie(page, FIRMA_AS_UUID);
    await page.goto(appURL);
    await page.waitForLoadState('networkidle');

    // Firma AS should be the selected party (from cookie)
    await expect(page.locator('#toolbar-menu-root')).toContainText('Firma AS');

    // Should show Firma AS messages, not person messages
    await expect(page.getByRole('link', { name: 'This is a message 1 for Firma AS' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Skatten din for 2022' })).not.toBeVisible();

    // Should have company colour theme
    await expectIsCompanyPage(page);

    // URL should have party param set (company selection is stored in URL)
    const url = new URL(page.url());
    expect(url.searchParams.get('party')).toBe(FIRMA_AS_URN);
  });

  test('Can switch from cookie-preselected company to current end user (person)', async ({ page }) => {
    // Start with Firma AS pre-selected via cookie
    await setPartyCookie(page, FIRMA_AS_UUID);
    await page.goto(appURL);
    await page.waitForLoadState('networkidle');

    // Verify Firma AS is initially selected
    await expect(page.locator('#toolbar-menu-root')).toContainText('Firma AS');
    await expectIsCompanyPage(page);

    // Switch to the current end user (Test Testesen)
    await page.locator('#toolbar-menu-root > button').click();
    await page.getByRole('option', { name: 'Test Testesen' }).click();

    // Verify person party is now selected
    await expect(page.locator('#toolbar-menu-root')).toContainText('Test Testesen');
    await expectIsPersonPage(page);

    // Verify person messages are visible and company messages are hidden
    await expect(page.getByRole('link', { name: 'Skatten din for 2022' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'This is a message 1 for Firma AS' })).not.toBeVisible();

    // Person parties don't store the party in the URL
    const url = new URL(page.url());
    expect(url.searchParams.has('party')).toBe(false);
    expect(url.searchParams.has('group')).toBe(false);
  });

  test('Can switch from cookie-preselected company to another company', async ({ page }) => {
    // Start with Firma AS pre-selected via cookie
    await setPartyCookie(page, FIRMA_AS_UUID);
    await page.goto(appURL);
    await page.waitForLoadState('networkidle');

    // Verify Firma AS is initially selected
    await expect(page.locator('#toolbar-menu-root')).toContainText('Firma AS');

    // Switch to Testbedrift AS
    await page.locator('#toolbar-menu-root > button').click();
    await page.locator(`[role="option"][data-id="${TESTBEDRIFT_URN}"]`).click();

    // Verify Testbedrift AS is selected
    await expect(page.locator('#toolbar-menu-root')).toContainText('Testbedrift As');
    await expectIsCompanyPage(page);

    // Verify Testbedrift messages are visible
    await expect(page.getByRole('link', { name: 'This is a message 1 for Testbedrift AS', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'This is a message 1 for Firma AS' })).not.toBeVisible();

    // URL should reflect the new party
    const url = new URL(page.url());
    expect(url.searchParams.get('party')).toBe(TESTBEDRIFT_URN);
  });

  test('Can switch from cookie-preselected company to all parties', async ({ page }) => {
    // Start with Firma AS pre-selected via cookie
    await setPartyCookie(page, FIRMA_AS_UUID);
    await page.goto(appURL);
    await page.waitForLoadState('networkidle');

    // Verify Firma AS is initially selected
    await expect(page.locator('#toolbar-menu-root')).toContainText('Firma AS');

    // Switch to "Alle virksomheter"
    await page.locator('#toolbar-menu-root > button').click();
    await page.getByRole('option', { name: 'Alle virksomheter' }).click();

    // All-organizations mode uses person color with neutral theme
    await expectIsPersonPage(page);

    // Verify all company messages are visible (but not person messages)
    await expect(page.getByRole('link', { name: 'This is a message 1 for Firma AS' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'This is a message 1 for Testbedrift AS', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Innkalling til sesjon' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Skatten din for 2022' })).not.toBeVisible();

    // URL should have group=ALL_COMPANIES, no party param
    const url = new URL(page.url());
    expect(url.searchParams.has('party')).toBe(false);
    expect(url.searchParams.get('group')).toBe('ALL_COMPANIES');
  });

  test('Preselects person party from cookie on load', async ({ page }) => {
    await setPartyCookie(page, PERSON_UUID);
    await page.goto(appURL);
    await page.waitForLoadState('networkidle');

    // Person party should be selected (from cookie)
    await expect(page.locator('#toolbar-menu-root')).toContainText('Test Testesen');
    await expectIsPersonPage(page);

    // Should show person messages
    await expect(page.getByRole('link', { name: 'Skatten din for 2022' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'This is a message 1 for Firma AS' })).not.toBeVisible();

    // Person parties don't store party in URL
    const url = new URL(page.url());
    expect(url.searchParams.has('party')).toBe(false);
  });

  test('Preselects parent org with sub-parties from cookie on load', async ({ page }) => {
    await setPartyCookie(page, TESTBEDRIFT_UUID);
    await page.goto(appURL);
    await page.waitForLoadState('networkidle');

    // Testbedrift AS should be selected (from cookie)
    await expect(page.locator('#toolbar-menu-root')).toContainText(/Testbedrift A[Ss]/i);
    await expectIsCompanyPage(page);

    // Should show Testbedrift messages (including sub-party messages)
    await expect(page.getByRole('link', { name: 'This is a message 1 for Testbedrift AS', exact: true })).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'This is a message 1 for Testbedrift AS sub party AVD SUB' }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'This is a message 1 for Firma AS' })).not.toBeVisible();

    // URL should have party param
    const url = new URL(page.url());
    expect(url.searchParams.get('party')).toBe(TESTBEDRIFT_URN);
  });

  test('Falls back to current end user when cookie has unknown party UUID', async ({ page }) => {
    // Set a cookie with a UUID that doesn't match any party
    await setPartyCookie(page, 'urn:altinn:organization:uuid:does-not-exist');
    await page.goto(appURL);
    await page.waitForLoadState('networkidle');

    // Should fall back to the current end user (Test Testesen)
    await expect(page.locator('#toolbar-menu-root')).toContainText('Test Testesen');
    await expectIsPersonPage(page);
    await expect(page.getByRole('link', { name: 'Skatten din for 2022' })).toBeVisible();
  });
});
