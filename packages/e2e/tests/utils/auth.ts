import { type Page, expect } from '@playwright/test';
import { testCredentials } from '../../playwright.config';

export async function loginUser(page: Page) {
  const pid = testCredentials.pid;
  const expectedName = testCredentials.expectedName;

  await page.goto('/');
  await page.getByRole('link', { name: 'TestID Lag din egen' }).click();
  await page.getByLabel('Personidentifikator (').click();
  await page.getByLabel('Personidentifikator (').fill(pid);
  await page.getByRole('button', { name: 'Autentiser' }).click();

  await expect(page.getByRole('button', { name: expectedName })).toBeVisible();
}
