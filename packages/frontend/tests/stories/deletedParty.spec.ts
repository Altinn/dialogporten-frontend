import { expect, test } from '@playwright/test';
import { appUrlWithPlaywrightId } from '../index';

test('should see content for a deleted party', async ({ page }) => {
  const dateScenarioPage = appUrlWithPlaywrightId('deleted-party');
  await page.goto(dateScenarioPage);

  await page.getByTestId('account-menu-button').click();
  await page
    .locator('a')
    .filter({ hasText: 'LLattermild Oriental Tiger AS↳ Org. nr. : 215 421 902, del av Lattermild' })
    .click();
  await page.reload();

  const currentUrl = page.url();
  const url = new URL(currentUrl);
  const partyId = url.searchParams.get('party');
  expect(partyId).toEqual('urn%3Aaltinn%3Aorganization%3Aidentifier-no%3A215421902');
  await expect(page.getByRole('link', { name: 'Dialog for DMF' })).toBeVisible();
  await page.getByRole('link', { name: 'Dialog for DMF' }).click();
  await page.getByRole('listitem').filter({ hasText: 'Direktoratet for' }).click();
  await page.getByText('Et sammendrag her. Maks 200').click();
});
