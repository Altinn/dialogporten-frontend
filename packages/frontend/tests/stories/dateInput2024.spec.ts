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

    await expect(page.getByRole('menuitemcheckbox', { name: 'I dag' }).first()).toBeVisible();
    await expect(page.locator('li').filter({ hasText: 'I dag' }).locator('span > span').nth(4)).toHaveText('3');

    await expect(page.getByRole('menuitemcheckbox', { name: 'Denne måneden' }).locator('div').first()).toBeVisible();
    await expect(
      page.locator('li').filter({ hasText: 'Denne måneden' }).first().locator('span > span').nth(4),
    ).toHaveText('3');

    await expect(
      page.getByRole('menuitemcheckbox', { name: 'Siste tolv måneder' }).locator('div').first(),
    ).toBeVisible();
    await expect(page.locator('li').filter({ hasText: 'Siste tolv måneder' }).locator('span > span').nth(4)).toHaveText(
      '9',
    );

    await page.getByRole('menuitemcheckbox', { name: 'I dag' }).first().locator('div').click;
    await expect(page.getByTestId('updated')).toBeVisible();

    await expect(page.getByRole('link', { name: 'Mocked system date Dec 31, 2024' })).toBeVisible();
    await expect(
      page.getByRole('link', {
        name: 'Melding om bortkjøring av snø i 2024 Oslo kommune til Test Testesen Melding om',
      }),
    ).not.toBeVisible();
  });
});
