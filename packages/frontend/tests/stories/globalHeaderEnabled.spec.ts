import { expect, test } from '../fixtures';

import { defaultAppURL } from '../';
import { mockFeatureFlags } from '../featureFlagHelpers';

//TO-DO: Finish after changes in global header are done
test.describe('Header, global menu ff enabled', () => {
  test('Renders Global Header', async ({ page }) => {
    await mockFeatureFlags(page, {
      'globalMenu.enabled': true,
    });

    await page.goto(defaultAppURL);

    await expect(page.getByLabel('Test Testesen')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Søk', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Meny', exact: true })).toBeVisible();

    await expect(page.getByRole('button', { name: 'Vis i fullskjerm' })).not.toBeVisible();
  });

  test('Renders GlobalHeader menus', async ({ page }) => {
    await mockFeatureFlags(page, {
      'globalMenu.enabled': true,
    });
    await page.goto(defaultAppURL);

    await expect(page.getByLabel('Test Testesen')).toBeVisible();

    await page.getByLabel('Test Testesen').click();
    await expect(page.getByRole('button', { name: 'Vis i fullskjerm' })).toBeVisible();
  });
});
