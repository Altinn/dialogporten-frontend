import { test } from '@playwright/test';
import { loginUser } from './utils/auth';

test.describe('IDPorten integration', () => {
  test('authenticate user using idporten', async ({ page }) => {
    await loginUser(page);
    await page.close();
  });
});
