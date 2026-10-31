import { expect, type Page, test } from '@playwright/test';
import lzString from 'lz-string';
import { baseURL } from '../';
import { getSidebar } from './common';

const builderURL = `${baseURL}/dialog-builder?mock=true`;
const previewURL = (encoded: string) => `${baseURL}/inbox/preview?mock=true&dialog=${encoded}`;
const realDialogId = '019241f7-5fa0-7336-934d-716a8e5bbb49';

const getOutput = (page: Page) => page.getByRole('region', { name: 'Resultat' });
const getPreviewButton = (page: Page) => page.getByRole('button', { name: 'Forhåndsvis' });
const getHeaderAccountButton = (page: Page, name: string) =>
  page.getByRole('banner').getByRole('button', { name, exact: false });
const getDialogTitleField = (page: Page) => page.getByLabel('Tittel').first();
const getField = (page: Page, path: string) => page.locator(`[data-path="${path}"]`);
const getDetails = (page: Page, name: string | RegExp) => page.locator('summary').filter({ hasText: name }).first();
const openDetails = (page: Page, name: string | RegExp) => getDetails(page, name).click();

const openFilledBuilder = async (page: Page) => {
  await page.goto(builderURL);
  await page.getByRole('button', { name: 'Fyll med eksempeldata' }).click();
  await expect(getOutput(page).getByText('Dialogen er gyldig')).toBeVisible();
};

const openPreview = async (page: Page) => {
  await openFilledBuilder(page);
  await getPreviewButton(page).click();
  await expect(page).toHaveURL(/\/inbox\/preview\?/);
  await expect(page.getByRole('heading', { name: 'Test-søknad om digitalisering' })).toBeVisible();
};

test.describe('Dialog builder', () => {
  test('has header and footer, but no sidebar', async ({ page }) => {
    await page.goto(builderURL);

    await expect(page.getByRole('heading', { name: 'Dialogbygger' })).toBeVisible();
    await expect(getHeaderAccountButton(page, 'Test Testesen')).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();
    await expect(getSidebar(page)).toHaveCount(0);
  });

  test('uses the selected party, and stays on the page when the party changes', async ({ page }) => {
    await page.goto(builderURL);
    await page.getByRole('button', { name: 'Fyll med eksempeldata' }).click();
    await expect(page.getByText('Mottaker:')).toContainText('Test Testesen');

    await getHeaderAccountButton(page, 'Test Testesen').click();
    await page.getByRole('menuitem', { name: 'Firma AS' }).click();

    await expect(page).toHaveURL(/\/dialog-builder\?/);
    await expect(page.getByText('Mottaker:')).toContainText('Firma AS');
    await expect(getDialogTitleField(page)).toHaveValue('Test-søknad om digitalisering');
    await expect(getOutput(page)).toContainText('urn:altinn:organization:identifier-no:1');
  });

  test('fits the label inside the add and remove buttons', async ({ page }) => {
    await openFilledBuilder(page);
    await openDetails(page, /^Vedlegg/);
    await openDetails(page, /^Handlinger/);
    await openDetails(page, /^Handling 1/);

    for (const name of ['Legg til vedlegg', 'Legg til handling', 'Fjern handling 1']) {
      const button = page.getByRole('button', { name }).first();
      await expect(button).toBeVisible();
      expect(await button.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    }
  });

  test('shows how much each section holds, and what each item is', async ({ page }) => {
    await page.goto(builderURL);
    await expect(getDetails(page, /^Vedlegg 0\s*$/)).toBeVisible();

    await page.getByRole('button', { name: 'Fyll med eksempeldata' }).click();

    await expect(getDetails(page, /^Vedlegg 2\s*$/)).toBeVisible();
    await expect(getDetails(page, /^Handlinger 2\s*$/)).toBeVisible();
    await expect(getDetails(page, /^Aktiviteter 2\s*$/)).toBeVisible();
    await expect(getDetails(page, /^Forsendelser og navigasjonshandlinger 1\s*$/)).toBeVisible();

    await openDetails(page, /^Vedlegg/);
    await expect(getDetails(page, 'Vedlegg 2: Les mer om ordningen (lenke)')).toBeVisible();
    await openDetails(page, /^Handlinger/);
    await expect(getDetails(page, 'Handling 1: Still spørsmål (Primary)')).toBeVisible();
    await openDetails(page, /^Forsendelser/);
    await expect(getDetails(page, 'Forsendelse 1: Svar på søknad (1 vedlegg, 1 navigasjonshandling)')).toBeVisible();
  });

  test('opens a new item, and keeps the others in place when one is removed', async ({ page }) => {
    await openFilledBuilder(page);
    await openDetails(page, /^Handlinger/);
    await page.getByRole('button', { name: 'Legg til handling' }).click();
    await expect(getField(page, 'guiActions.2.url')).toBeVisible();
    await expect(getField(page, 'guiActions.1.url')).toBeHidden();

    await openDetails(page, /^Handling 1/);
    await page.getByRole('button', { name: 'Fjern handling 1' }).click();

    await expect(getDetails(page, /^Handlinger 2/)).toBeVisible();
    await expect(getField(page, 'guiActions.1.url')).toBeVisible();
    await expect(getField(page, 'guiActions.0.url')).toBeHidden();
  });

  test('takes you to the field when a validation error is clicked', async ({ page }) => {
    await openFilledBuilder(page);
    await openDetails(page, /^Handlinger/);
    await openDetails(page, /^Handling 1/);
    await getField(page, 'guiActions.0.url').fill('ikke en url');
    await expect(getDetails(page, /^Handlinger 2 1 feil$/)).toBeVisible();

    await openDetails(page, /^Handling 1/);
    await openDetails(page, /^Handlinger/);
    await expect(getField(page, 'guiActions.0.url')).toBeHidden();

    await getOutput(page)
      .getByRole('button', { name: /guiActions\.0\.url/ })
      .click();

    await expect(getField(page, 'guiActions.0.url')).toBeVisible();
    await expect(getField(page, 'guiActions.0.url')).toBeFocused();
  });

  test('opens nested items when a validation error points inside them', async ({ page }) => {
    await openFilledBuilder(page);
    await openDetails(page, /^Forsendelser/);
    await openDetails(page, /^Forsendelse 1/);
    await openDetails(page, /^Navigasjonshandling 1/);
    await getField(page, 'transmissions.0.navigationalActions.0.url').fill('javascript:alert(1)');
    await openDetails(page, /^Forsendelser/);

    await getOutput(page)
      .getByRole('button', { name: /transmissions\.0\.navigationalActions\.0\.url/ })
      .click();

    await expect(getField(page, 'transmissions.0.navigationalActions.0.url')).toBeFocused();
  });

  test('goes back to the form when a validation error is clicked in the paste tab', async ({ page }) => {
    await page.goto(builderURL);
    await page.getByRole('tab', { name: 'Lim inn JSON' }).click();

    await getOutput(page)
      .getByRole('button', { name: /serviceResource/ })
      .click();

    await expect(page.getByRole('tab', { name: 'Bygg dialog' })).toHaveAttribute('aria-selected', 'true');
    await expect(getField(page, 'serviceResource')).toBeFocused();
  });

  test('warns when the preview link gets too long to share', async ({ page }) => {
    const longText = Array.from({ length: 2000 }, () => Math.random().toString(36).slice(2)).join('');
    await openFilledBuilder(page);
    await expect(getOutput(page).getByText('Lenken er lang')).toHaveCount(0);

    await page.getByLabel('Sammendrag').first().fill(longText);

    await expect(getOutput(page).getByText('Lenken er lang')).toBeVisible();
    await expect(getPreviewButton(page)).toBeEnabled();
  });

  test('adds a link and a navigational action from the form', async ({ page }) => {
    await openFilledBuilder(page);

    await openDetails(page, /^Vedlegg/);
    await page.getByRole('button', { name: 'Legg til vedlegg' }).first().click();
    await getField(page, 'attachments.2.displayName').fill('Veiledning');
    await getField(page, 'attachments.2.urls.0.url').fill('https://example.com/veiledning');
    await page.getByRole('switch', { name: 'Er en lenke' }).click();
    await expect(getField(page, 'attachments.2.urls.0.mediaType')).toHaveCount(0);

    await openDetails(page, /^Forsendelser/);
    await openDetails(page, /^Forsendelse 1/);
    await page.getByRole('button', { name: 'Legg til navigasjonshandling' }).click();
    await getField(page, 'transmissions.0.navigationalActions.1.title').fill('Klag på vedtaket');
    await getField(page, 'transmissions.0.navigationalActions.1.url').fill('https://example.com/klage');

    await expect(getOutput(page).getByText('Dialogen er gyldig')).toBeVisible();
    await expect(getOutput(page)).toContainText('"mediaType": "text/html"');
    await getPreviewButton(page).click();

    await expect(page.getByRole('link', { name: 'Veiledning' })).toHaveAttribute(
      'href',
      'https://example.com/veiledning',
    );
    await page.getByRole('heading', { name: 'Svar på søknad' }).click();
    await expect(page.getByRole('link', { name: 'Klag på vedtaket' })).toHaveAttribute(
      'href',
      'https://example.com/klage',
    );
  });

  test('shows where navigational actions are added', async ({ page }) => {
    await page.goto(builderURL);
    await openDetails(page, /^Forsendelser og navigasjonshandlinger/);
    await expect(page.getByText('Navigasjonshandlinger og vedlegg hører til en forsendelse.')).toBeVisible();

    await page.getByRole('button', { name: 'Legg til forsendelse' }).click();

    await expect(page.getByRole('heading', { name: 'Navigasjonshandlinger (0)' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Legg til navigasjonshandling' })).toBeVisible();
  });

  test('shows why a dialog is invalid and blocks the preview', async ({ page }) => {
    await page.goto(builderURL);

    await expect(getOutput(page).getByText('Dialogen er ikke gyldig')).toBeVisible();
    await expect(getPreviewButton(page)).toBeDisabled();
    await expect(getOutput(page).getByText('serviceResource', { exact: true })).toBeVisible();
  });

  test('rejects unsafe URLs on actions', async ({ page }) => {
    await openFilledBuilder(page);

    await openDetails(page, /^Handlinger/);
    await openDetails(page, /^Handling 1/);
    await getField(page, 'guiActions.0.url').fill('javascript:alert(1)');

    await expect(getOutput(page).getByText('guiActions.0.url')).toBeVisible();
    await expect(getOutput(page).getByText('Må være en gyldig https-URL.')).toBeVisible();
    await expect(getPreviewButton(page)).toBeDisabled();
  });

  test('loads a valid pasted dialog into the form', async ({ page }) => {
    await page.goto(builderURL);
    await page.getByRole('tab', { name: 'Lim inn JSON' }).click();
    await page.getByLabel('Dialog som JSON').fill(
      JSON.stringify({
        serviceResource: 'urn:altinn:resource:limt-inn',
        party: 'urn:altinn:organization:identifier-no:1',
        content: {
          title: {
            value: [
              { languageCode: 'nb', value: 'Limt inn' },
              { languageCode: 'en', value: 'Pasted' },
            ],
          },
        },
        externalReference: 'behold-meg',
      }),
    );
    await page.getByRole('button', { name: 'Valider og last inn' }).click();

    await expect(page.getByLabel('Tittel (nb)')).toHaveValue('Limt inn');
    await expect(page.getByLabel('Tittel (en)')).toHaveValue('Pasted');
    await expect(getOutput(page)).toContainText('behold-meg');
    await expect(getPreviewButton(page)).toBeEnabled();
  });

  test('loads a dialog response from Dialogporten', async ({ page }) => {
    await page.goto(builderURL);
    await page.getByRole('tab', { name: 'Lim inn JSON' }).click();
    await page.getByLabel('Dialog som JSON').fill(
      JSON.stringify({
        id: '019241f7-5fa0-7336-934d-716a8e5bbb49',
        revision: 'abc',
        org: 'skd',
        serviceResource: 'urn:altinn:resource:hentet',
        serviceResourceType: 'CorrespondenceService',
        party: 'urn:altinn:organization:identifier-no:1',
        status: 'Awaiting',
        contentUpdatedAt: '2026-01-01T10:00:00.000Z',
        content: { title: { value: [{ languageCode: 'nb', value: 'Hentet dialog' }], mediaType: 'text/plain' } },
        activities: [{ id: 'a', type: 'DialogCreated', performedBy: { actorType: 'ServiceOwner' }, description: [] }],
        guiActions: [
          {
            action: 'read',
            url: 'urn:dialogporten:unauthorized',
            priority: 'Primary',
            httpMethod: 'GET',
            title: [{ languageCode: 'nb', value: 'Åpne' }],
            prompt: [],
            isAuthorized: false,
          },
        ],
      }),
    );
    await page.getByRole('button', { name: 'Valider og last inn' }).click();

    await expect(getDialogTitleField(page)).toHaveValue('Hentet dialog');
    await expect(page.getByLabel('Tjenesteeier')).toHaveValue('skd');
    await expect(page.getByLabel('Ressurstype')).toHaveValue('correspondenceservice');
    await expect(getOutput(page).getByText('Dialogen er gyldig')).toBeVisible();
    await expect(getOutput(page).getByText('Ukjente felter')).toHaveCount(0);
    await expect(getOutput(page)).not.toContainText('revision');

    await getPreviewButton(page).click();
    await expect(page.getByRole('heading', { name: 'Hentet dialog' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Åpne' })).toBeDisabled();
  });

  test('explains why a pasted dialog is rejected', async ({ page }) => {
    await page.goto(builderURL);
    await page.getByRole('tab', { name: 'Lim inn JSON' }).click();

    await page.getByLabel('Dialog som JSON').fill('{ ikke json');
    await page.getByRole('button', { name: 'Valider og last inn' }).click();
    await expect(page.getByText(/Ugyldig JSON/)).toBeVisible();

    await page.getByLabel('Dialog som JSON').fill(JSON.stringify({ status: 'Ukjent' }));
    await page.getByRole('button', { name: 'Valider og last inn' }).click();
    await expect(page.getByRole('tabpanel').getByText('status', { exact: true })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Lim inn JSON' })).toHaveAttribute('aria-selected', 'true');
  });
});

test.describe('Dialog preview', () => {
  test('renders the dialog in dialog details with a preview banner', async ({ page }) => {
    await openPreview(page);

    await expect(page.getByText('Dette er ikke en ekte dialog.')).toBeVisible();
    await expect(page.getByRole('main').getByText('Test Testesen').first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Kopi av innsendt søknad' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Still spørsmål' })).toHaveAttribute(
      'href',
      'https://example.com/sporsmal',
    );
    await expect(page.getByRole('heading', { name: 'Svar på søknad' })).toBeVisible();
    await expect(page.getByRole('complementary').filter({ hasText: 'Innboks' })).toBeVisible();
  });

  test('shows person names in the order they were given', async ({ page }) => {
    const encoded = lzString.compressToEncodedURIComponent(
      JSON.stringify({
        v: 1,
        org: 'digdir',
        serviceResourceType: 'genericaccessresource',
        dialog: {
          serviceResource: 'urn:altinn:resource:test',
          content: { title: { value: [{ languageCode: 'nb', value: 'Navnesjekk' }] } },
          activities: [
            { type: 'DialogOpened', performedBy: { actorType: 'PartyRepresentative', actorName: 'Kari Nordmann' } },
          ],
        },
      }),
    );

    await page.goto(previewURL(encoded));
    await page.getByRole('button', { name: 'Sett av deg' }).click();
    const seenBy = page.getByRole('dialog');
    await expect(seenBy).toContainText('Test Testesen');
    await expect(seenBy).not.toContainText('Testesen Test');
    await page.keyboard.press('Escape');

    await page.locator('a, button').filter({ hasText: 'Aktivitetslogg' }).first().click();
    await expect(page.getByRole('dialog')).toContainText('Kari Nordmann');
  });

  test('survives a full page load of the link', async ({ page }) => {
    await openPreview(page);
    const url = page.url();

    await page.goto('about:blank');
    await page.goto(url);

    await expect(page.getByRole('heading', { name: 'Test-søknad om digitalisering' })).toBeVisible();
  });

  test('does not send anything when an action is clicked', async ({ page }) => {
    await openPreview(page);
    const requests: string[] = [];
    page.on('request', (request) => requests.push(request.url()));

    await page.getByRole('link', { name: 'Ettersend informasjon' }).click();

    await expect(page.getByRole('heading', { name: 'Test-søknad om digitalisering' })).toBeVisible();
    expect(requests.filter((url) => url.includes('example.com'))).toEqual([]);
  });

  test('goes back to the builder with the form intact', async ({ page }) => {
    await openPreview(page);

    await page.getByRole('link', { name: 'Tilbake' }).click();

    await expect(page).toHaveURL(/\/dialog-builder\?/);
    await expect(getDialogTitleField(page)).toHaveValue('Test-søknad om digitalisering');
    await expect(getField(page, 'guiActions.1.url')).toHaveValue('https://example.com/ettersending');
  });

  test('tells the user when the link has no dialog', async ({ page }) => {
    await page.goto(`${baseURL}/inbox/preview?mock=true`);

    await expect(page.getByText('Ingen dialog å vise')).toBeVisible();
  });

  test('refuses a crafted link with an unsafe action', async ({ page }) => {
    const encoded = lzString.compressToEncodedURIComponent(
      JSON.stringify({
        v: 1,
        org: 'digdir',
        serviceResourceType: 'genericaccessresource',
        dialog: {
          serviceResource: 'urn:altinn:resource:test',
          content: { title: { value: [{ languageCode: 'nb', value: 'Falsk dialog' }] } },
          guiActions: [
            {
              action: 'read',
              url: 'javascript:alert(document.domain)',
              priority: 'Primary',
              title: [{ languageCode: 'nb', value: 'Klikk her' }],
            },
          ],
        },
      }),
    );

    await page.goto(previewURL(encoded));

    await expect(page.getByText('Dialogen kan ikke vises')).toBeVisible();
    await expect(page.getByText('guiActions.0.url')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Falsk dialog' })).toHaveCount(0);
  });

  test('does not run injected code from a crafted link', async ({ page }) => {
    const payloads = [
      '<script>window.xss = 1</script>',
      '<img src=x onerror="window.xss = 1">',
      '<svg onload="window.xss = 1"></svg>',
      '<iframe src="javascript:window.xss = 1"></iframe>',
      '"><script>window.xss = 1</script>',
    ].join(' ');
    const text = [{ languageCode: 'nb', value: payloads }];
    const crafted = {
      v: 1,
      org: payloads,
      serviceResourceType: 'genericaccessresource',
      dialog: {
        serviceResource: 'urn:altinn:resource:test',
        status: 'RequiresAttention',
        content: {
          title: { value: text },
          summary: { value: text },
          senderName: { value: text },
          extendedStatus: { value: text },
          additionalInfo: {
            value: [{ languageCode: 'nb', value: `${payloads} [lenke](javascript:window.xss=1) ![bilde](x)` }],
            mediaType: 'text/markdown',
          },
        },
        attachments: [{ displayName: text, urls: [{ url: 'https://example.com', consumerType: 'Gui' }] }],
        guiActions: [{ action: 'read', url: 'https://example.com', priority: 'Primary', title: text, prompt: text }],
        activities: [
          {
            type: 'Information',
            performedBy: { actorType: 'PartyRepresentative', actorName: payloads },
            description: text,
          },
        ],
        transmissions: [
          {
            type: 'Information',
            sender: { actorType: 'PartyRepresentative', actorName: payloads },
            content: { title: { value: text }, summary: { value: text } },
            navigationalActions: [{ title: text, url: 'https://example.com' }],
          },
        ],
      },
    };
    const encoded = lzString.compressToEncodedURIComponent(JSON.stringify(crafted));
    const dialogs: string[] = [];
    page.on('dialog', (dialog) => {
      dialogs.push(dialog.message());
      void dialog.dismiss();
    });

    for (const url of [previewURL(encoded), `${builderURL}&dialog=${encoded}`]) {
      await page.goto(url);
      await expect(page.getByRole('main')).toContainText('<script>window.xss = 1</script>');
      await page.waitForTimeout(500);

      expect(await page.evaluate(() => (window as Window & { xss?: number }).xss)).toBeUndefined();
      await expect(page.locator('main script, main iframe, main svg[onload], main img[src="x"]')).toHaveCount(0);
      await expect(page.locator('a[href^="javascript"]')).toHaveCount(0);
    }
    expect(dialogs).toEqual([]);
  });

  test('never fetches URLs from a link', async ({ page }) => {
    const reference = {
      value: [{ languageCode: 'nb', value: 'https://evil.example/innhold' }],
      mediaType: 'application/vnd.dialogporten.frontchannelembed-url;type=text/html',
    };
    const encoded = lzString.compressToEncodedURIComponent(
      JSON.stringify({
        v: 1,
        org: 'digdir',
        serviceResourceType: 'genericaccessresource',
        dialog: {
          serviceResource: 'urn:altinn:resource:test',
          content: { title: { value: [{ languageCode: 'nb', value: 'Med FCE' }] }, mainContentReference: reference },
          transmissions: [
            {
              type: 'Information',
              sender: { actorType: 'ServiceOwner' },
              content: {
                title: { value: [{ languageCode: 'nb', value: 'Forsendelse' }] },
                contentReference: reference,
              },
            },
          ],
        },
      }),
    );
    const requests: string[] = [];
    page.on('request', (request) => requests.push(request.url()));

    await page.goto(previewURL(encoded));
    await expect(page.getByRole('heading', { name: 'Med FCE' })).toBeVisible();
    await page.getByRole('heading', { name: 'Forsendelse' }).click();
    await page.waitForTimeout(500);

    expect(requests.filter((url) => url.includes('evil.example'))).toEqual([]);
  });

  test('leaves real dialogs alone, even with the parameter in the URL', async ({ page }) => {
    await page.goto(`${baseURL}/inbox/${realDialogId}?mock=true&dialog=ignorert`);

    await expect(page.getByRole('heading', { name: 'Skatten din for 2022' })).toBeVisible();
    await expect(page.getByText('Dette er ikke en ekte dialog.')).toHaveCount(0);
  });
});
