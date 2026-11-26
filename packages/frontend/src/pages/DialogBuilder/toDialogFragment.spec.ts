import {
  ActivityType,
  ActorType,
  AttachmentUrlConsumer,
  DialogStatus,
  GuiActionPriority,
  HttpVerb,
  SystemLabel,
  TransmissionType,
} from 'bff-types-generated';
import { describe, expect, it } from 'vitest';
import type { DialogByIdDetails } from '../../api/hooks/useDialogById.tsx';
import type { PreviewDialog } from './dialogSchema.ts';
import { makeActionsInert } from './makeActionsInert.ts';
import { PREVIEW_DIALOG_ID, PREVIEW_DIALOG_TOKEN, toDialogFragment } from './toDialogFragment.ts';

const nb = (value: string) => [{ languageCode: 'nb', value }];
const now = new Date('2026-10-31T12:00:00.000Z');

const baseDialog: PreviewDialog = {
  serviceResource: 'urn:altinn:resource:test',
  content: { title: { value: nb('Tittel') } },
};

const convert = (dialog: PreviewDialog) =>
  toDialogFragment({
    dialog,
    party: 'urn:altinn:party',
    org: 'digdir',
    serviceResourceType: 'altinnapp',
    endUserName: 'Test Testesen',
    now,
  });

describe('toDialogFragment', () => {
  it('fills in what the API would normally generate', () => {
    const fragment = convert(baseDialog);

    expect(fragment).toMatchObject({
      id: PREVIEW_DIALOG_ID,
      dialogToken: PREVIEW_DIALOG_TOKEN,
      party: 'urn:altinn:party',
      org: 'digdir',
      serviceResourceType: 'altinnapp',
      status: DialogStatus.NotApplicable,
      isContentSeen: true,
      createdAt: now.toISOString(),
      contentUpdatedAt: now.toISOString(),
      endUserContext: { systemLabels: [SystemLabel.Default] },
      seenSinceLastContentUpdate: [
        expect.objectContaining({
          isCurrentEndUser: true,
          seenBy: expect.objectContaining({ actorName: 'Test Testesen' }),
        }),
      ],
    });
  });

  it('converts REST enums to GraphQL enums', () => {
    const fragment = convert({
      ...baseDialog,
      status: 'RequiresAttention',
      systemLabel: 'Archive',
      attachments: [{ displayName: nb('Vedlegg'), urls: [{ url: 'https://example.com', consumerType: 'Gui' }] }],
      guiActions: [
        {
          action: 'read',
          url: 'https://example.com',
          priority: 'Secondary',
          httpMethod: 'POST',
          title: nb('Send'),
        },
      ],
      activities: [{ type: 'CorrespondenceOpened', performedBy: { actorType: 'PartyRepresentative', actorName: 'A' } }],
      transmissions: [
        {
          type: 'Rejection',
          sender: { actorType: 'ServiceOwner' },
          content: { title: { value: nb('Avslag') } },
        },
      ],
    });

    expect(fragment.status).toBe(DialogStatus.RequiresAttention);
    expect(fragment.endUserContext?.systemLabels).toEqual([SystemLabel.Archive]);
    expect(fragment.attachments[0].urls[0].consumerType).toBe(AttachmentUrlConsumer.Gui);
    expect(fragment.guiActions[0]).toMatchObject({ priority: GuiActionPriority.Secondary, httpMethod: HttpVerb.Post });
    expect(fragment.activities[0]).toMatchObject({
      type: ActivityType.CorrespondenceOpened,
      performedBy: { actorType: ActorType.PartyRepresentative, actorName: 'A' },
    });
    expect(fragment.transmissions[0]).toMatchObject({
      type: TransmissionType.Rejection,
      sender: { actorType: ActorType.ServiceOwner },
    });
  });

  it.each([
    ['New', DialogStatus.NotApplicable],
    ['Sent', DialogStatus.Awaiting],
  ] as const)('maps the deprecated status %s', (status, expected) => {
    expect(convert({ ...baseDialog, status }).status).toBe(expected);
  });

  it('counts transmissions by sender', () => {
    const transmission = (actorType: 'ServiceOwner' | 'PartyRepresentative') => ({
      type: 'Information' as const,
      sender: { actorType },
      content: { title: { value: nb('Melding') } },
    });

    const fragment = convert({
      ...baseDialog,
      transmissions: [transmission('ServiceOwner'), transmission('ServiceOwner'), transmission('PartyRepresentative')],
    });

    expect(fragment.fromServiceOwnerTransmissionsCount).toBe(2);
    expect(fragment.fromPartyTransmissionsCount).toBe(1);
  });

  it('counts transmissions the user cannot see, like Dialogporten', () => {
    const transmission = (
      actorType: 'ServiceOwner' | 'PartyRepresentative',
      unauthorizedPresentation: 'Disabled' | 'Excluded',
    ) => ({
      type: 'Information' as const,
      sender: { actorType },
      content: { title: { value: nb('Melding') } },
      authorizationContext: { unauthorizedPresentation },
    });

    const fragment = convert({
      ...baseDialog,
      transmissions: [
        transmission('ServiceOwner', 'Excluded'),
        transmission('ServiceOwner', 'Disabled'),
        transmission('PartyRepresentative', 'Excluded'),
      ],
    });

    expect(fragment.transmissions).toHaveLength(1);
    expect(fragment.fromServiceOwnerTransmissionsCount).toBe(2);
    expect(fragment.fromPartyTransmissionsCount).toBe(1);
  });

  it('gives transmissions without timestamps a stable newest-first order', () => {
    const transmission = { type: 'Information' as const, sender: { actorType: 'ServiceOwner' as const } };
    const fragment = convert({
      ...baseDialog,
      transmissions: [
        { ...transmission, content: { title: { value: nb('Første') } } },
        { ...transmission, content: { title: { value: nb('Andre') } } },
      ],
    });

    expect(fragment.transmissions[0].createdAt > fragment.transmissions[1].createdAt).toBe(true);
    expect(new Set(fragment.transmissions.map(({ id }) => id)).size).toBe(2);
  });
});

describe('toDialogFragment embeds', () => {
  it('never passes on embed URLs, so a link cannot make the browser fetch them', () => {
    const reference = {
      value: [{ languageCode: 'nb', value: 'https://evil.example/innhold' }],
      mediaType: 'application/vnd.dialogporten.frontchannelembed-url;type=text/html' as const,
    };
    const fragment = convert({
      ...baseDialog,
      content: { ...baseDialog.content, mainContentReference: reference },
      transmissions: [
        {
          type: 'Information',
          sender: { actorType: 'ServiceOwner' },
          content: { title: { value: nb('Melding') }, contentReference: reference },
        },
      ],
    });

    expect(fragment.content?.mainContentReference).toBeNull();
    expect(fragment.transmissions[0].content?.contentReference).toBeNull();
    expect(JSON.stringify(fragment)).not.toContain('evil.example');
  });
});

describe('toDialogFragment access', () => {
  it('marks actions with the unauthorized URL as not authorized', () => {
    const action = (url: string) => ({ action: 'read', url, priority: 'Tertiary' as const, title: nb('Åpne') });
    const fragment = convert({
      ...baseDialog,
      guiActions: [action('https://example.com'), action('urn:dialogporten:unauthorized')],
    });

    expect(fragment.guiActions.map(({ isAuthorized }) => isAuthorized)).toEqual([true, false]);
  });

  const disabled = { unauthorizedPresentation: 'Disabled' as const };
  const excluded = { unauthorizedPresentation: 'Excluded' as const };
  const attachment = (name: string, authorizationContext?: typeof disabled | typeof excluded) => ({
    displayName: nb(name),
    urls: [{ url: `https://example.com/${name}.pdf`, consumerType: 'Gui' as const }],
    authorizationContext,
  });
  const navigationalAction = (title: string, authorizationContext?: typeof disabled | typeof excluded) => ({
    title: nb(title),
    url: 'https://example.com/svar',
    authorizationContext,
  });
  const transmission = (
    title: string,
    overrides: Partial<NonNullable<PreviewDialog['transmissions']>[number]> = {},
  ): NonNullable<PreviewDialog['transmissions']>[number] => ({
    type: 'Information',
    sender: { actorType: 'ServiceOwner' },
    content: { title: { value: nb(title) } },
    ...overrides,
  });

  it('shows elements the user has no access to as disabled', () => {
    const fragment = convert({
      ...baseDialog,
      attachments: [attachment('Vedtak', disabled)],
      guiActions: [
        {
          url: 'https://example.com/skjema',
          priority: 'Primary',
          title: nb('Til skjema'),
          authorizationContext: { ...disabled, action: 'write' },
        },
      ],
      transmissions: [
        transmission('Svar', { navigationalActions: [navigationalAction('Svar på vedtaket', disabled)] }),
        transmission('Uten tilgang', { authorizationContext: disabled, attachments: [attachment('Vedlegg')] }),
      ],
    });

    expect(fragment.attachments[0].urls[0].url).toBe('urn:dialogporten:unauthorized');
    expect(fragment.guiActions[0]).toMatchObject({
      isAuthorized: false,
      url: 'urn:dialogporten:unauthorized',
      action: 'write',
    });
    expect(fragment.transmissions[0].navigationalActions[0].url).toBe('urn:dialogporten:unauthorized');
    expect(fragment.transmissions[1].isAuthorized).toBe(false);
    expect(fragment.transmissions[1].attachments[0].urls[0].url).toBe('urn:dialogporten:unauthorized');
    expect(fragment.excludedAttachments).toEqual([]);
  });

  it('leaves out excluded elements and lists only their id and time, like Dialogporten', () => {
    const fragment = convert({
      ...baseDialog,
      attachments: [attachment('Synlig'), attachment('Skjult', excluded)],
      guiActions: [
        {
          id: 'skjult-handling',
          url: 'https://example.com/skjema',
          priority: 'Primary',
          title: nb('Til skjema'),
          authorizationContext: excluded,
        },
      ],
      transmissions: [
        transmission('Synlig', {
          attachments: [attachment('Skjult', excluded)],
          navigationalActions: [navigationalAction('Synlig'), navigationalAction('Skjult', excluded)],
        }),
        transmission('Skjult', { authorizationContext: excluded }),
      ],
    });
    const created = now.toISOString();
    const minuteBefore = new Date(now.getTime() - 60_000).toISOString();

    expect(fragment.attachments.map(({ id }) => id)).toEqual(['attachment-0']);
    expect(fragment.excludedAttachments).toEqual([{ id: 'attachment-1', createdAt: created }]);
    expect(fragment.guiActions).toEqual([]);
    expect(fragment.excludedGuiActions).toEqual([{ id: 'skjult-handling', createdAt: created }]);
    expect(fragment.transmissions.map(({ id }) => id)).toEqual(['transmission-0']);
    expect(fragment.excludedTransmissions).toEqual([{ id: 'transmission-1', createdAt: minuteBefore }]);
    expect(fragment.transmissions[0]).toMatchObject({
      attachments: [],
      excludedAttachments: [{ id: 'transmission-0-attachment-0', createdAt: created }],
      navigationalActions: [expect.objectContaining({ url: 'https://example.com/svar' })],
      excludedNavigationalActions: [{ id: 'transmission-0-navigational-action-1', createdAt: created }],
    });
  });
});

describe('makeActionsInert', () => {
  const dialog = {
    guiActions: [
      { id: 'get', title: 'Åpne', url: 'https://example.com/open', httpMethod: 'GET', priority: 'PRIMARY' },
      {
        id: 'get-prompt',
        title: 'Åpne',
        url: 'https://example.com/prompt',
        httpMethod: 'GET',
        prompt: 'Sikker?',
        priority: 'SECONDARY',
      },
      {
        id: 'post',
        title: 'Send',
        url: 'https://example.com/send',
        httpMethod: 'POST',
        prompt: 'Sikker?',
        priority: 'TERTIARY',
      },
    ],
  } as DialogByIdDetails;

  it('keeps GET actions as they are', () => {
    const [get, getWithPrompt] = makeActionsInert(dialog).guiActions;
    expect(get).toEqual(dialog.guiActions[0]);
    expect(getWithPrompt).toEqual(dialog.guiActions[1]);
  });

  it('turns other actions into links that send nothing', () => {
    expect(makeActionsInert(dialog).guiActions[2]).toEqual({
      id: 'post',
      title: 'Send',
      url: '#',
      httpMethod: 'GET',
      prompt: undefined,
      priority: 'TERTIARY',
    });
  });

  it('leaves actions the user has no access to disabled', () => {
    const action = { ...dialog.guiActions[2], disabled: true };
    expect(makeActionsInert({ ...dialog, guiActions: [action] }).guiActions[0]).toEqual(action);
  });
});
