import { expect } from '@playwright/test';
import { test } from '../fixtures';
import { defaultAppURL } from '../index';

test.describe('Multiselect subaccounts', () => {
  test('sub account menu is rendered when all orgs are selected', async ({ page }) => {
    await page.goto(defaultAppURL);
    await page.getByTestId('inbox-toolbar').getByRole('button', { name: 'Test Testesen' }).click();
    await page.getByRole('option', { name: 'Alle virksomheter' }).click();
    await page.getByRole('button', { name: 'enheter' }).isVisible();
  });

  test('sub account menu is rendered when parent unit is selected', async ({ page }) => {
    await page.goto(defaultAppURL);
    await page.getByTestId('inbox-toolbar').getByRole('button', { name: 'Test Testesen' }).click();
    await page.getByText('TTestbedrift AS Org. nr. : 2').click();
    await page.getByRole('button', { name: 'enheter' }).isVisible();
  });

  test('selected sub accounts should only', async ({ page }) => {
    await page.goto(defaultAppURL);

    /* Select Testbedrift AS (parent) and check a subunit without dialog */
    await page.getByTestId('inbox-toolbar').getByRole('button', { name: 'Test Testesen' }).click();
    await page.getByText('TTestbedrift AS Org. nr. : 2').click();
    await expect(page.getByRole('link', { name: 'Innkalling til sesjon' })).toBeVisible();
    await page.getByRole('button', { name: 'Alle enheter' }).click();
    await page.getByLabel('Testbedrift As Avd Sub', { exact: true }).click();
    await page.getByLabel('Testbedrift As Avd Sub ↳ Org').press('Escape');
    await expect(page.getByRole('heading', { name: 'Innboksen er tom' })).toBeVisible();

    /* Add a subunit with dialog */
    await page.getByRole('button', { name: 'Testbedrift As Avd Sub' }).click();
    await page.getByLabel('Testbedrift As Avd Oslo', { exact: true }).click();
    await page.getByLabel('Testbedrift As Avd Oslo ↳ Org').press('Escape');
    await expect(page.getByRole('link', { name: 'Innkalling til sesjon' })).toBeVisible();
  });
});
