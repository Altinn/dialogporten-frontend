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
    const toolbar = page.getByTestId('inbox-toolbar');
    await toolbar.getByRole('button', { name: /legg til/i }).click();
    const addMenu = toolbar.locator('#tool-filter-add');
    await addMenu.locator('button[data-id="updated"]').click();

    const item = page.getByRole('radio', { name: 'I dag' });
    await expect(item.first()).toBeVisible();

    const item2 = page.getByRole('radio', { name: 'Siste tolv måneder' });
    await expect(item2.first()).toBeVisible();

    await page.getByRole('radio', { name: 'I dag' }).first().click();

    await expect(page.getByRole('link', { name: 'Mocked system date Dec 31, 2024' })).toBeVisible();
    await expect(
      page.getByRole('link', {
        name: 'Melding om bortkjøring av snø i 2024 Oslo kommune til Test Testesen Melding om',
      }),
    ).not.toBeVisible();
  });
});
