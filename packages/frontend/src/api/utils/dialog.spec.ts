import {
  DialogStatus,
  type OrganizationFieldsFragment,
  type PartyFieldsFragment,
  type SearchDialogFieldsFragment,
} from 'bff-types-generated';
import { describe, expect, it } from 'vitest';
import { mapDialogToToInboxItems } from './dialog.ts';

const parties: PartyFieldsFragment[] = [
  {
    party: 'urn:altinn:organization:identifier-no:1',
    partyType: 'Organization',
    subParties: [
      {
        party: 'urn:altinn:organization:identifier-no:2',
        partyType: 'Organization',
        name: 'Child Org',
        isCurrentEndUser: false,
        partyUuid: 'child-org',
        partyId: 2,
        isDeleted: false,
      },
    ],
    name: 'Parent Org',
    isCurrentEndUser: false,
    isDeleted: false,
    partyUuid: 'parent-org',
    partyId: 1,
    hasOnlyAccessToSubParties: false,
  },
  {
    party: 'urn:altinn:organization:identifier-no:2',
    partyType: 'Organization',
    name: 'Child Org',
    isCurrentEndUser: false,
    isDeleted: false,
    partyUuid: 'child-org',
    partyId: 2,
    hasOnlyAccessToSubParties: false,
  } as PartyFieldsFragment,
  {
    party: 'urn:altinn:person:identifier-no:3',
    partyType: 'Person',
    subParties: [],
    name: 'Current User',
    isCurrentEndUser: true,
    isDeleted: false,
    partyUuid: 'current-user',
    partyId: 3,
    hasOnlyAccessToSubParties: false,
  },
];

const organizations: OrganizationFieldsFragment[] = [
  {
    id: 'ttd',
    name: { nb: 'Test Organization', en: 'Test Organization', nn: 'Test Organization' },
    logo: 'logo.png',
    orgnr: '123456789',
    homepage: 'https://example.test',
    environments: [],
  },
];

const dialogs: SearchDialogFieldsFragment[] = [
  {
    id: 'dialog-1',
    party: 'urn:altinn:organization:identifier-no:2',
    org: 'ttd',
    hasUnopenedContent: false,
    guiAttachmentCount: 0,
    status: DialogStatus.Completed,
    createdAt: '2026-03-23T00:00:00.000Z',
    updatedAt: '2026-03-23T00:00:00.000Z',
    dueAt: null,
    contentUpdatedAt: '2026-03-23T00:00:00.000Z',
    fromServiceOwnerTransmissionsCount: 0,
    fromPartyTransmissionsCount: 0,
    serviceResourceType: '',
    serviceResource: '',
    seenSinceLastContentUpdate: [],
    endUserContext: {
      systemLabels: [],
    },
    extendedStatus: null,
    content: {
      title: {
        mediaType: 'text/plain',
        value: [{ value: 'Dialog title', languageCode: 'nb' }],
      },
      summary: {
        mediaType: 'text/plain',
        value: [{ value: 'Dialog summary', languageCode: 'nb' }],
      },
      senderName: {
        mediaType: 'text/plain',
        value: [{ value: 'Sender name', languageCode: 'nb' }],
      },
      extendedStatus: null,
    },
  } as SearchDialogFieldsFragment,
];

describe('mapDialogToToInboxItems', () => {
  it('keeps child organizations resolvable without rescanning the entire party graph', () => {
    const [dialog] = mapDialogToToInboxItems(dialogs, parties, organizations, (date) => String(date), false);

    expect(dialog.recipient.name).toBe('Child Org');
    expect(dialog.recipient.type).toBe('company');
    expect(dialog.recipient.variant).toBe('outline');
    expect(dialog.sender.name).toBe('Sender name');
  });
});
