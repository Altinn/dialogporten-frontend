import { defaultAppURL } from '..';
import { expect, test } from '../fixtures';

test.describe('Smoke test', () => {
  test('should show header, aside, main and footer', async ({ page, isMobile }) => {
    if (!isMobile) {
      await page.goto(defaultAppURL);
      const aside = page.getByRole('complementary');
      const footer = page.getByRole('contentinfo');
      const header = page.getByRole('button', { name: 'Meny' }).locator('xpath=ancestor::header');

      await expect(aside).toBeVisible();
      await expect(footer).toBeVisible();
      await expect(header).toBeVisible();
    }
  });
});
