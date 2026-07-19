import { PageRoutes } from '../../../src/pages/routes';
import { appURLProfileLanding, appURLProfileNotifications, appURLProfileParties } from '../..';
import { expect, test } from '../../fixtures';

const PARTIES_LINK_NAME = 'Aktører og favoritter';
const NOTIFICATIONS_LINK_NAME = 'Varslingsadresser';
const onlySelfPlaywrightId = 'only-self';

const withOnlySelfParty = (url: string) => `${url}&playwrightId=${onlySelfPlaywrightId}`;
const pathnameOf = (url: string) => new URL(url).pathname;

test.describe('Single user with no parties besides themselves', () => {
  test('hides the parties and notifications links from the profile page entirely', async ({ page }) => {
    await page.goto(withOnlySelfParty(appURLProfileLanding));
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Dine innstillinger i Altinn', level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: PARTIES_LINK_NAME })).toHaveCount(0);
    await expect(page.getByRole('link', { name: NOTIFICATIONS_LINK_NAME })).toHaveCount(0);
  });

  test('redirects away from the parties overview page when accessed directly by URL', async ({ page }) => {
    await page.goto(withOnlySelfParty(appURLProfileParties));
    await page.waitForLoadState('networkidle');

    expect(pathnameOf(page.url())).toBe(PageRoutes.profile);
  });

  test('redirects away from the notifications page when accessed directly by URL', async ({ page }) => {
    await page.goto(withOnlySelfParty(appURLProfileNotifications));
    await page.waitForLoadState('networkidle');

    expect(pathnameOf(page.url())).toBe(PageRoutes.profile);
  });
});

test.describe('User with multiple parties (regression control)', () => {
  test('still shows the parties and notifications links and allows visiting both pages', async ({ page }) => {
    await page.goto(appURLProfileLanding);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('link', { name: PARTIES_LINK_NAME }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: NOTIFICATIONS_LINK_NAME }).first()).toBeVisible();

    await page.goto(appURLProfileParties);
    await page.waitForLoadState('networkidle');
    expect(pathnameOf(page.url())).toBe(PageRoutes.partiesOverview);

    await page.goto(appURLProfileNotifications);
    await page.waitForLoadState('networkidle');
    expect(pathnameOf(page.url())).toBe(PageRoutes.notifications);
  });
});
