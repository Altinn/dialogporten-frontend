import { expect, type Page, test } from '@playwright/test';
import { appUrlWithPlaywrightId } from '../';
import { getTelemetry } from './common';

const getCookieBanner = (page: Page) =>
  page.getByRole('region', { name: 'Får vi samle informasjon om hvordan du bruker Altinn?' });

const openDialogAndLeaveApp = async (page: Page) => {
  await page.getByRole('link', { name: 'Skatten din for 2022' }).click();
  await expect(page.locator('h2').filter({ hasText: /^Grunnleggende konsepter fra markdown$/ })).toBeVisible();
  // Leaving the app fires pagehide, which ends the open page view and sends it with a beacon
  await page.goto('about:blank');
};

test.describe('Telemetry', () => {
  test('sends page views, including the last one before the user leaves', async ({ page }) => {
    await page.goto(appUrlWithPlaywrightId('telemetry'));
    await getCookieBanner(page).getByRole('button', { name: 'Ja' }).click();
    await openDialogAndLeaveApp(page);

    await expect
      .poll(async () =>
        (await getTelemetry(page, { baseType: 'PageviewData' })).map((item) => item.data?.baseData?.name),
      )
      .toEqual(expect.arrayContaining(['Inbox', 'Dialog Details']));

    const [dialogDetails] = await getTelemetry(page, { baseType: 'PageviewData', name: 'Dialog Details' });
    expect(dialogDetails.tags?.['ai.cloud.role']).toBe('frontend');
    expect(dialogDetails.data?.baseData?.properties?.refUri).toBe('');
  });

  test('tracks an uncaught error once, also without an error object, and drops injected-script errors', async ({
    page,
  }) => {
    await page.goto(appUrlWithPlaywrightId('telemetry'));
    await getCookieBanner(page).getByRole('button', { name: 'Ja' }).click();
    // Application Insights sets ai_user when it starts, so errors thrown after that are tracked
    await expect
      .poll(async () => (await page.context().cookies()).some((cookie) => cookie.name === 'ai_user'))
      .toBe(true);

    await page.evaluate(() => {
      setTimeout(() => {
        throw new TypeError('Error from injected code');
      });
      // Some browser internals fire error events without an error object. ("Script error." is one, but it is filtered out)
      window.dispatchEvent(new ErrorEvent('error', { message: 'Error event without error object' }));
    });
    await page.addScriptTag({ url: '/tests/stories/fixtures/throwUncaughtError.ts', type: 'module' });

    const getExceptions = async () =>
      (await getTelemetry(page, { baseType: 'ExceptionData' })).map(
        (item) => item.data?.baseData?.exceptions?.[0] ?? {},
      );

    // Each error must arrive exactly once. A duplicate is tracked in the same tick, so it is sent in the same batch.
    // The SDK puts the type name in front of the message
    await expect
      .poll(async () => (await getExceptions()).map(({ message }) => message).sort())
      .toEqual(['ErrorEvent: Error event without error object', 'RangeError: Uncaught test error']);
  });

  test('sends nothing when the user rejects statistics cookies', async ({ page }) => {
    const telemetryRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/__telemetry/')) {
        telemetryRequests.push(request.url());
      }
    });

    await page.goto(appUrlWithPlaywrightId('telemetry'));
    await getCookieBanner(page).getByRole('button', { name: 'Nei' }).click();
    await openDialogAndLeaveApp(page);

    expect(telemetryRequests).toEqual([]);
    // Application Insights sets ai_user as soon as it loads, so a missing cookie means it never started
    expect(await getTelemetry(page)).toEqual([]);
  });
});
