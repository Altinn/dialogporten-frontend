import { defaultAppURL } from '../';
import { expect, test } from '../fixtures';

test.describe('Inbox BookmarkModal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(defaultAppURL);
    await page.waitForLoadState('networkidle');
  });

  test('Save search from Inbox: open modal, change title, save', async ({ page, isMobile }) => {
    const toolbarArea = page.getByTestId('inbox-toolbar');
    await toolbarArea.getByRole('button', { name: /legg til/i }).click();
    await toolbarArea.locator('#tool-filter-add').locator('button[data-id="org"], button#org').click();
    await page.locator('li').filter({ hasText: 'Oslo kommune' }).nth(1).click();
    await page.locator('li').filter({ hasText: 'Oslo kommune' }).nth(1).press('Escape');

    await page.getByRole('button', { name: 'Lagre søk' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog').getByRole('heading', { name: 'Lagre søk' })).toBeVisible();

    await page.getByLabel('Gi søket et navn').fill('Mitt test-søk');
    await page.getByRole('dialog').getByRole('button', { name: 'Lagre søk' }).click();

    await expect(page.getByText('Søket ditt er lagret')).toBeVisible();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Lagret søk' })).toBeVisible();
  });

  test('Save search from Inbox: cancel closes modal without saving', async ({ page, isMobile }) => {
    const toolbarArea = page.getByTestId('inbox-toolbar');
    await toolbarArea.getByRole('button', { name: /legg til/i }).click();
    await toolbarArea.locator('#tool-filter-add').locator('button[data-id="org"], button#org').click();
    await page.locator('li').filter({ hasText: 'Oslo kommune' }).nth(1).click();
    await page.locator('li').filter({ hasText: 'Oslo kommune' }).nth(1).press('Escape');

    await page.getByRole('button', { name: 'Lagre søk' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByRole('button', { name: 'Avbryt' }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Lagre søk' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Lagret søk' })).not.toBeVisible();
  });

  test('Edit saved search: open edit modal, change title, save', async ({ page, isMobile }) => {
    const toolbarArea = page.getByTestId('inbox-toolbar');
    await toolbarArea.getByRole('button', { name: /legg til/i }).click();
    await toolbarArea.locator('#tool-filter-add').locator('button[data-id="org"], button#org').click();
    await page.locator('li').filter({ hasText: 'Oslo kommune' }).nth(1).click();
    await page.locator('li').filter({ hasText: 'Oslo kommune' }).nth(1).press('Escape');

    await page.getByRole('button', { name: 'Lagre søk' }).click();
    await page.getByLabel('Gi søket et navn').fill('Opprinnelig navn');
    await page.getByRole('dialog').getByRole('button', { name: 'Lagre søk' }).click();
    await expect(page.getByRole('button', { name: 'Lagret søk' })).toBeVisible();

    await page.getByRole('button', { name: 'Lagret søk' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog').getByRole('heading', { name: 'Rediger søk' })).toBeVisible();
    await expect(page.getByLabel('Gi søket et navn')).toHaveValue('Opprinnelig navn');

    await page.getByLabel('Gi søket et navn').fill('Nytt navn');
    await page.getByRole('dialog').getByRole('button', { name: 'Lagre', exact: true }).click();

    await expect(page.getByText('Søket ditt er oppdatert')).toBeVisible();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Lagret søk' })).toBeVisible();
  });

  test('Edit saved search: delete from modal removes saved search', async ({ page, isMobile }) => {
    const toolbarArea = page.getByTestId('inbox-toolbar');
    await toolbarArea.getByRole('button', { name: /legg til/i }).click();
    await toolbarArea.locator('#tool-filter-add').locator('button[data-id="org"], button#org').click();
    await page.locator('li').filter({ hasText: 'Oslo kommune' }).nth(1).click();
    await page.locator('li').filter({ hasText: 'Oslo kommune' }).nth(1).press('Escape');

    await page.getByRole('button', { name: 'Lagre søk' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Lagre søk' }).click();
    await expect(page.getByRole('button', { name: 'Lagret søk' })).toBeVisible();

    await page.getByRole('button', { name: 'Lagret søk' }).click();
    await expect(page.getByRole('dialog').getByRole('heading', { name: 'Rediger søk' })).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: 'Slett søk' }).click();

    await expect(page.getByText('Søket ditt ble slettet')).toBeVisible();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Lagre søk' })).toBeVisible();
  });
});
