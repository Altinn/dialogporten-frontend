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
    const toolbar = page.getByTestId('inbox-toolbar');
    // Sub-account entries render as role="option" inside the sub-account listbox; select by name.
    const subaccountListbox = page.locator('#toolbarmenu-subAccounts-listbox');
    const subaccountCheckbox = (name: string) => subaccountListbox.getByRole('option', { name, exact: true });
    await toolbar.getByRole('button', { name: 'Alle enheter' }).click();
    await subaccountCheckbox('Testbedrift As Avd Sub').click();
    await page.waitForURL(/[?&]subAccounts=/);
    await page.keyboard.press('Escape');
    await expect(page.getByText('Du har ingen meldinger i innboksen')).toBeVisible();

    /* Add a subunit with dialog */
    await toolbar.getByRole('button', { name: 'Testbedrift As Avd Sub' }).click();
    await subaccountCheckbox('Testbedrift As Avd Oslo').click();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('link', { name: 'Innkalling til sesjon' })).toBeVisible();
  });
});
