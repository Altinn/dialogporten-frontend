import { expect, test } from '../fixtures';
import { defaultAppURL } from '../index';

test('ensure party is part of query string', async ({ page }) => {
  await page.goto(defaultAppURL);
  await page.locator('#toolbar-menu-root > button').click();
  await page.getByRole('option', { name: 'Firma AS', exact: true }).click();
  const url = new URL(page.url());
  const partyDecoded = url.searchParams.get('party');

  expect(partyDecoded).toBe('urn:altinn:organization:identifier-no:1');
});
