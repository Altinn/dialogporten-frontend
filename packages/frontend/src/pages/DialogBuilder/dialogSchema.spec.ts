import { describe, expect, it } from 'vitest';
import { type CreateDialog, validateCreateDialog, validatePreviewDialog } from './dialogSchema.ts';

const nb = (value: string) => [{ languageCode: 'nb', value }];

const validDialog: CreateDialog = {
  serviceResource: 'urn:altinn:resource:test',
  party: 'urn:altinn:organization:identifier-no:991825827',
  content: { title: { value: nb('Tittel') } },
};

const guiAction = (priority: 'Primary' | 'Secondary' | 'Tertiary', url = 'https://example.com/action') => ({
  action: 'read',
  url,
  priority,
  title: nb('Gå videre'),
});

describe('validateCreateDialog', () => {
  it('accepts a minimal dialog', () => {
    const { dialog, errors, warnings } = validateCreateDialog(validDialog);
    expect(errors).toEqual([]);
    expect(warnings).toEqual([]);
    expect(dialog).toEqual(validDialog);
  });

  it('requires party, service resource and title', () => {
    const { dialog, errors } = validateCreateDialog({ content: {} });
    expect(dialog).toBeUndefined();
    expect(errors.map(({ path }) => path)).toEqual(
      expect.arrayContaining(['serviceResource', 'party', 'content.title']),
    );
  });

  it('reports unknown fields as warnings without rejecting the dialog', () => {
    const { dialog, errors, warnings } = validateCreateDialog({ ...validDialog, tittel: 'skrivefeil' });
    expect(errors).toEqual([]);
    expect(dialog).toBeDefined();
    expect(warnings.map(({ path }) => path)).toEqual(['tittel']);
  });

  it('still applies dialog rules when unknown fields are present', () => {
    const { errors } = validateCreateDialog({
      ...validDialog,
      tittel: 'skrivefeil',
      guiActions: [guiAction('Primary'), guiAction('Primary')],
    });
    expect(errors.map(({ path }) => path)).toEqual(['guiActions']);
  });

  it.each([
    ['javascript:alert(1)'],
    ['data:text/html,<script>alert(1)</script>'],
    ['JaVaScRiPt:alert(1)'],
    ['java\tscript:alert(1)'],
    ['  javascript:alert(1)'],
    ['vbscript:alert(1)'],
    ['file:///etc/passwd'],
    ['//evil.example'],
    ['/api/logout'],
    ['http://example.com'],
    ['https://af.altinn.no@evil.example'],
    ['https://user:password@example.com'],
    ['ikke en url'],
  ])('rejects the GUI action URL %s', (url) => {
    const { dialog, errors } = validateCreateDialog({ ...validDialog, guiActions: [guiAction('Primary', url)] });
    expect(dialog).toBeUndefined();
    expect(errors.map(({ path }) => path)).toEqual(['guiActions.0.url']);
  });

  it('accepts the URL Dialogporten uses for content the user has no access to', () => {
    const { errors } = validateCreateDialog({
      ...validDialog,
      guiActions: [guiAction('Primary', 'urn:dialogporten:unauthorized')],
    });
    expect(errors).toEqual([]);
  });

  it('rejects unsafe URLs on attachments, embeds and navigational actions', () => {
    const url = 'javascript:alert(1)';
    const { errors } = validateCreateDialog({
      ...validDialog,
      content: {
        title: { value: nb('Tittel') },
        mainContentReference: {
          value: [{ languageCode: 'nb', value: url }],
          mediaType: 'application/vnd.dialogporten.frontchannelembed-url;type=text/markdown',
        },
      },
      attachments: [{ displayName: nb('Vedlegg'), urls: [{ url, consumerType: 'Gui' }] }],
      transmissions: [
        {
          type: 'Information',
          sender: { actorType: 'ServiceOwner' },
          content: { title: { value: nb('Forsendelse') } },
          navigationalActions: [{ title: nb('Åpne'), url }],
        },
      ],
    });
    expect(errors.map(({ path }) => path)).toEqual(
      expect.arrayContaining([
        'content.mainContentReference.value.0.value',
        'attachments.0.urls.0.url',
        'transmissions.0.navigationalActions.0.url',
      ]),
    );
  });

  it('limits GUI actions per priority', () => {
    const tertiary = Array.from({ length: 6 }, () => guiAction('Tertiary'));
    const { errors } = validateCreateDialog({ ...validDialog, guiActions: tertiary });
    expect(errors).toEqual([{ path: 'guiActions', message: 'Maks 5 handling(er) med prioritet Tertiary.' }]);
  });

  it('rejects references to transmissions that do not exist', () => {
    const { errors } = validateCreateDialog({
      ...validDialog,
      activities: [
        { type: 'TransmissionOpened', performedBy: { actorType: 'ServiceOwner' }, transmissionId: 'finnes-ikke' },
      ],
    });
    expect(errors.map(({ path }) => path)).toEqual(['activities.0.transmissionId']);
  });

  it('only allows a description on Information activities', () => {
    const { errors } = validateCreateDialog({
      ...validDialog,
      activities: [{ type: 'DialogCreated', performedBy: { actorType: 'ServiceOwner' }, description: nb('Tekst') }],
    });
    expect(errors.map(({ path }) => path)).toEqual(['activities.0.description']);
  });

  it('rejects media types the API does not support', () => {
    const { errors } = validateCreateDialog({
      ...validDialog,
      content: {
        title: { value: nb('Tittel'), mediaType: 'text/html' },
        additionalInfo: { value: nb('<b>Tekst</b>'), mediaType: 'text/html' },
      },
    });
    expect(errors.map(({ path }) => path)).toEqual(['content.title.mediaType', 'content.additionalInfo.mediaType']);
  });
});

describe('validateCreateDialog authorization contexts', () => {
  const disabled = { unauthorizedPresentation: 'Disabled' as const };
  const attachment = {
    displayName: nb('Vedtak'),
    urls: [{ url: 'https://example.com/vedtak.pdf', consumerType: 'Gui' as const }],
  };
  const transmission = {
    type: 'Information' as const,
    sender: { actorType: 'ServiceOwner' as const },
    content: { title: { value: nb('Svar') } },
  };
  const { action: _action, ...actionWithoutPolicyAction } = guiAction('Primary');

  it('accepts a context on every element that can have one', () => {
    const { errors, warnings } = validateCreateDialog({
      ...validDialog,
      attachments: [{ ...attachment, authorizationContext: disabled }],
      guiActions: [{ ...actionWithoutPolicyAction, authorizationContext: { ...disabled, action: 'write' } }],
      transmissions: [
        {
          ...transmission,
          authorizationContext: {
            unauthorizedPresentation: 'Excluded',
            dialogPartyChecks: [{ accessRestriction: 'None' }],
            additionalResourceAttribute: 'urn:altinn:task:Task_1',
          },
          attachments: [{ ...attachment, authorizationContext: disabled }],
          navigationalActions: [{ title: nb('Svar'), url: 'https://example.com/svar', authorizationContext: disabled }],
        },
      ],
    });
    expect(errors).toEqual([]);
    expect(warnings).toEqual([]);
  });

  it('requires unauthorizedPresentation, since Dialogporten has no default', () => {
    const { errors } = validateCreateDialog({
      ...validDialog,
      attachments: [{ ...attachment, authorizationContext: {} }],
    });
    expect(errors.map(({ path }) => path)).toEqual(['attachments.0.authorizationContext.unauthorizedPresentation']);
  });

  it('requires the action on a GUI action only when it has no context', () => {
    const { errors } = validateCreateDialog({
      ...validDialog,
      guiActions: [actionWithoutPolicyAction, { ...guiAction('Secondary'), authorizationContext: disabled }],
    });
    expect(errors).toEqual([
      { path: 'guiActions.0.action', message: 'Må fylles ut.' },
      {
        path: 'guiActions.1.action',
        message: 'Kan ikke settes sammen med authorizationContext. Bruk authorizationContext.action.',
      },
    ]);
  });

  it('rejects authorizationAttribute together with a context', () => {
    const { errors } = validateCreateDialog({
      ...validDialog,
      guiActions: [
        {
          ...actionWithoutPolicyAction,
          authorizationAttribute: 'urn:altinn:task:Task_1',
          authorizationContext: disabled,
        },
      ],
      transmissions: [
        { ...transmission, authorizationAttribute: 'urn:altinn:task:Task_1', authorizationContext: disabled },
      ],
    });
    expect(errors.map(({ path }) => path)).toEqual([
      'guiActions.0.authorizationAttribute',
      'transmissions.0.authorizationAttribute',
    ]);
  });
});

describe('validatePreviewDialog', () => {
  it('does not require party', () => {
    const { party: _party, ...dialogWithoutParty } = validDialog;
    expect(validatePreviewDialog(dialogWithoutParty).errors).toEqual([]);
  });
});
