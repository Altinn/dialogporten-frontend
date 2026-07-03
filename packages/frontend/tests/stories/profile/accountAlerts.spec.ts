import type { Page } from '@playwright/test';
import { appURLProfileParties } from '../..';
import { expect, test } from '../../fixtures';

const PARTY_BUTTON_NAME = 'Testbedrift AS Org. nr. :';
const SMS_ROW_NAME = 'Varslinger på SMS';
const EMAIL_ROW_NAME = 'Varslinger på e-post';
const MOCK_INVALID_VERIFICATION_CODE = '000000';

const openChannelSettingsForParty = async (page: Page, rowName: string) => {
  await page.goto(appURLProfileParties);
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: PARTY_BUTTON_NAME }).click();
  await page.getByRole('button', { name: rowName }).click();

  return page.getByRole('dialog');
};

test.describe('Account Alerts - SMS verification flow', () => {
  test('adding an SMS address requires verification with a 6-digit code', async ({ page }: { page: Page }) => {
    const dialog = await openChannelSettingsForParty(page, SMS_ROW_NAME);
    await expect(dialog).toBeVisible();

    await dialog.getByRole('switch', { name: 'Varsle på SMS' }).click();
    await dialog.getByRole('button', { name: 'Bekreft SMS' }).click();

    await expect(dialog.getByRole('textbox', { name: 'Kode (6 siffer)' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /Send ny kode \(\d+s\)/ })).toBeDisabled();
  });

  test('an invalid code shows an error and does not verify the address', async ({ page }: { page: Page }) => {
    const dialog = await openChannelSettingsForParty(page, SMS_ROW_NAME);

    await dialog.getByRole('switch', { name: 'Varsle på SMS' }).click();
    await dialog.getByRole('button', { name: 'Bekreft SMS' }).click();

    const codeInput = dialog.getByRole('textbox', { name: 'Kode (6 siffer)' });
    await codeInput.fill(MOCK_INVALID_VERIFICATION_CODE);
    await dialog.getByRole('button', { name: 'Bekreft kode' }).click();

    await expect(dialog.getByText('Ugyldig kode. Prøv igjen.')).toBeVisible();
    await expect(codeInput).toHaveAttribute('aria-invalid', 'true');
  });

  test('a valid code verifies the address, and saving persists across in-app navigation', async ({
    page,
  }: {
    page: Page;
  }) => {
    const dialog = await openChannelSettingsForParty(page, SMS_ROW_NAME);

    await dialog.getByRole('switch', { name: 'Varsle på SMS' }).click();
    await dialog.getByRole('button', { name: 'Bekreft SMS' }).click();

    await dialog.getByRole('textbox', { name: 'Kode (6 siffer)' }).fill('123456');
    await dialog.getByRole('button', { name: 'Bekreft kode' }).click();

    await expect(dialog.getByText('Bekreftet')).toBeVisible();

    await dialog.getByRole('button', { name: 'Lagre' }).click();
    await expect(dialog).not.toBeVisible();

    const smsRow = page.getByRole('button', { name: SMS_ROW_NAME });
    await expect(smsRow).toContainText('+4748995855');

    // Navigate away and back client-side (no full page reload) to confirm the saved
    // setting persists for the remainder of the session. Scoped to the sidebar nav
    // since the breadcrumb has a same-named link that drops the ?mock=true param.
    const sidebar = page.getByRole('navigation', { name: 'Sidebar' });
    await sidebar.getByRole('link', { name: 'Din profil' }).click();
    await sidebar.getByRole('link', { name: 'Aktører og favoritter' }).click();
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: PARTY_BUTTON_NAME }).click();
    await expect(page.getByRole('button', { name: SMS_ROW_NAME })).toContainText('+4748995855');
  });
});

test.describe('Account Alerts - Email verification flow', () => {
  test('adding an email address requires verification with a 6-digit code', async ({ page }: { page: Page }) => {
    const dialog = await openChannelSettingsForParty(page, EMAIL_ROW_NAME);
    await expect(dialog).toBeVisible();

    await dialog.getByRole('switch', { name: 'Varsle på e-post' }).click();
    await dialog.getByRole('button', { name: 'Bekreft e-post' }).click();

    await expect(dialog.getByRole('textbox', { name: 'Kode (6 siffer)' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /Send ny kode \(\d+s\)/ })).toBeDisabled();
  });

  test('an invalid code shows an error and does not verify the address', async ({ page }: { page: Page }) => {
    const dialog = await openChannelSettingsForParty(page, EMAIL_ROW_NAME);

    await dialog.getByRole('switch', { name: 'Varsle på e-post' }).click();
    await dialog.getByRole('button', { name: 'Bekreft e-post' }).click();

    const codeInput = dialog.getByRole('textbox', { name: 'Kode (6 siffer)' });
    await codeInput.fill(MOCK_INVALID_VERIFICATION_CODE);
    await dialog.getByRole('button', { name: 'Bekreft kode' }).click();

    await expect(dialog.getByText('Ugyldig kode. Prøv igjen.')).toBeVisible();
    await expect(codeInput).toHaveAttribute('aria-invalid', 'true');
  });

  test('a valid code verifies the address, and saving persists across in-app navigation', async ({
    page,
  }: {
    page: Page;
  }) => {
    const dialog = await openChannelSettingsForParty(page, EMAIL_ROW_NAME);

    await dialog.getByRole('switch', { name: 'Varsle på e-post' }).click();
    await dialog.getByRole('button', { name: 'Bekreft e-post' }).click();

    await dialog.getByRole('textbox', { name: 'Kode (6 siffer)' }).fill('123456');
    await dialog.getByRole('button', { name: 'Bekreft kode' }).click();

    await expect(dialog.getByText('Bekreftet')).toBeVisible();

    await dialog.getByRole('button', { name: 'Lagre' }).click();
    await expect(dialog).not.toBeVisible();

    const emailRow = page.getByRole('button', { name: EMAIL_ROW_NAME });
    await expect(emailRow).toContainText('nullstilt@altinn.xyz');

    // Navigate away and back client-side (no full page reload) to confirm the saved
    // setting persists for the remainder of the session. Scoped to the sidebar nav
    // since the breadcrumb has a same-named link that drops the ?mock=true param.
    const sidebar = page.getByRole('navigation', { name: 'Sidebar' });
    await sidebar.getByRole('link', { name: 'Din profil' }).click();
    await sidebar.getByRole('link', { name: 'Aktører og favoritter' }).click();
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: PARTY_BUTTON_NAME }).click();
    await expect(page.getByRole('button', { name: EMAIL_ROW_NAME })).toContainText('nullstilt@altinn.xyz');
  });
});
