import type { Page } from '@playwright/test';
import { appUrlWithPlaywrightId } from '..';
import { MOCKED_SYS_DATE } from '../../src/mocks/data/stories/date-2024/dialogs';
import { expect, test } from '../fixtures';

test.describe('Date filter, system date set 2024', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    const dateScenarioPage = appUrlWithPlaywrightId('date-2024');
    //mock system date to keep tests consistent
    await page.clock.setFixedTime(MOCKED_SYS_DATE);
    await page.goto(dateScenarioPage);
  });

  test('Dialog with mocked system date and scenario data visable', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Mocked system date Dec 31,' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Melding om bortkjøring av snø i' })).toBeVisible();
  });

  test('Date filter - quick filters functionality', async ({ page }) => {
    await page.getByRole('button', { name: 'add' }).click();
    await expect(page.locator('a').filter({ hasText: 'Oppdatert dato' })).toBeVisible();
    await page
      .getByTestId('inbox-toolbar')
      .getByRole('group')
      .locator('a')
      .filter({ hasText: 'Oppdatert dato' })
      .click();

    const item = page.getByRole('menuitemcheckbox', { name: 'I dag' });
    await expect(item.first()).toBeVisible();

    const item2 = page.getByRole('menuitemcheckbox', { name: 'Siste tolv måneder' });
    await expect(item2.first()).toBeVisible();

    await page.getByRole('menuitemcheckbox', { name: 'I dag' }).first().locator('div').click;

    await expect(page.getByRole('link', { name: 'Mocked system date Dec 31, 2024' })).toBeVisible();
    await expect(
      page.getByRole('link', {
        name: 'Melding om bortkjøring av snø i 2024 Oslo kommune til Test Testesen Melding om',
      }),
    ).not.toBeVisible();
  });
});
