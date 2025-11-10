import type { Page } from '@playwright/test';

export type FeatureFlagOverrides = Record<string, boolean | number | string>;

/**
 * Intercepts the /api/features endpoint and returns custom feature flags
 * @example
 * await mockFeatureFlags(page, {
 *   'globalMenu.enabled': true,
 *   'party.stopReversingPersonNameOrder': true
 * });
 * await page.goto(defaultAppURL);
 */
export async function mockFeatureFlags(page: Page, flags: FeatureFlagOverrides): Promise<void> {
  await page.route('**/api/features', async (route) => {
    const defaultFlags = {
      'globalMenu.enableAccessManagementLink': false,
      'globalMenu.enabled': false,
      'party.stopReversingPersonNameOrder': false,
    };

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...defaultFlags, ...flags }),
    });
  });
}
