import { expect, test } from '@playwright/test';
import { appUrlWithPlaywrightId } from '../index';

test('should see content for a deleted party', async ({ page }) => {
  const dateScenarioPage = appUrlWithPlaywrightId('deleted-party');
  await page.goto(dateScenarioPage);

  await page.locator('#toolbar-menu-root > button').click();
  await page.locator('button[id="urn:altinn:organization:identifier-no:215421902"]').click();

  const currentUrl = page.url();
  const url = new URL(currentUrl);
  const partyDecoded = url.searchParams.get('party');
  expect(partyDecoded).toBe('urn:altinn:organization:identifier-no:215421902');
  await expect(page.getByRole('link', { name: 'Dialog for DMF' })).toBeVisible();
  await page.getByRole('link', { name: 'Dialog for DMF' }).click();
  await page.getByRole('listitem').filter({ hasText: 'Direktoratet for' }).click();
  await page.getByText('Et sammendrag her. Maks 200').click();
});
