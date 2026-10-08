import { expect, type Page, test } from '@playwright/test';
import { appUrlWithPlaywrightId } from '../';

const primaryAction = (page: Page) => page.getByRole('link', { name: 'Gå til skjema', exact: true });
const actionsSection = (page: Page) => primaryAction(page).locator('xpath=..');

const openDialog = async (page: Page) => {
  await page.goto(appUrlWithPlaywrightId('gui-actions-multiple'));
  await page.getByRole('link', { name: 'Dialog med flere handlinger' }).click();
  await expect(page.getByRole('link', { name: 'Tilbake', exact: true })).toBeVisible();
};

test.describe('Dialog with multiple gui actions', () => {
  test('renders every visible action sorted by priority', async ({ page }) => {
    await openDialog(page);

    await expect(actionsSection(page).locator(':scope > *')).toHaveText([
      'Gå til skjema',
      'Be om utsettelse',
      'Trekk tilbake',
      'Les veiledning',
    ]);
  });

  test('hides the delete action outside the bin', async ({ page }) => {
    await openDialog(page);

    await expect(primaryAction(page)).toBeVisible();
    await expect(actionsSection(page).getByText('Slett dialogen')).toHaveCount(0);
  });

  test('renders authorized GET actions as links and the rest as buttons', async ({ page }) => {
    await openDialog(page);
    const actions = actionsSection(page);

    await expect(primaryAction(page)).toHaveAttribute('href', 'https://info.altinn.no/skjemaoversikt/');
    await expect(actions.getByRole('link', { name: 'Les veiledning' })).toHaveAttribute(
      'href',
      'https://info.altinn.no/om-altinn/',
    );
    await expect(actions.getByRole('button', { name: 'Be om utsettelse' })).toBeEnabled();
    await expect(actions.getByRole('button', { name: 'Trekk tilbake' })).toBeDisabled();
  });

  test('asks for confirmation before running a prompted action', async ({ page }) => {
    await openDialog(page);

    let message: string | undefined;
    page.once('dialog', (confirm) => {
      message = confirm.message();
      void confirm.dismiss();
    });

    await actionsSection(page).getByRole('button', { name: 'Be om utsettelse' }).click();

    expect(message).toBe('Vil du be om utsettelse?');
    await expect(actionsSection(page).getByRole('button', { name: 'Be om utsettelse' })).toBeEnabled();
  });
});
