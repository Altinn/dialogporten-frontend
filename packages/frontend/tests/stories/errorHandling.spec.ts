import { defaultAppURL } from '..';
import { PageRoutes } from '../../src/pages/routes';
import { expect, test } from '../fixtures';
import { getSidebarMenuItem } from './common';

test.describe('Error Boundary', () => {
  test('Navigates to error page if error', async ({ page }) => {
    await page.goto(defaultAppURL);

    await expect(getSidebarMenuItem(page, PageRoutes.inbox)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Skatten din for 2022' })).toBeVisible();

    await page.goto(defaultAppURL + `&simulateError=true`);
    // Wait for the SPA error routing to complete before asserting what's gone —
    // otherwise the previous inbox DOM can still be mounted while we race the render.
    await expect(page).toHaveURL(/.*error/);
    await expect(getSidebarMenuItem(page, PageRoutes.inbox)).not.toBeVisible();
    await expect(page.getByRole('link', { name: 'Skatten din for 2022' })).not.toBeVisible();
  });
});
