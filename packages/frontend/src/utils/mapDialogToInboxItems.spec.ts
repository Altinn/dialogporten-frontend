import type { OrganizationFieldsFragment, PartyFieldsFragment, SearchDialogFieldsFragment } from 'bff-types-generated';
import { describe, expect, it, vi } from 'vitest';
import { mapDialogToToInboxItems } from './dialog.ts';
import { buildOrganizationMap } from './organizations.ts';
import { buildPartyGraph } from './partyGraph.ts';

vi.mock('i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('i18next')>();
  return {
    ...actual,
    default: { ...actual.default, language: 'nb' },
    t: (key: string) => key,
  };
});

vi.mock('../../i18n/property.ts', () => ({
  getPreferredPropertyByLocale: (obj: { languageCode: string; value: string }[] | undefined) => obj?.[0],
}));

vi.mock('../../pages/Inbox/status.ts', () => ({
  getIsUnread: () => false,
}));

vi.mock('../hooks/useDialogById.tsx', () => ({
  getActorProps: () => ({ name: 'Actor', type: 'company' }),
}));

vi.mock('./viewType.ts', () => ({
  getViewTypes: () => ['inbox'],
}));

const personParty: PartyFieldsFragment = {
  party: 'urn:altinn:person:identifier-no:11111111111',
  partyType: 'Person',
  name: 'Test User',
  isCurrentEndUser: true,
  isDeleted: false,
  partyUuid: 'uuid-person',
  partyId: 1,
  hasOnlyAccessToSubParties: false,
  subParties: [],
};

const orgParty: PartyFieldsFragment = {
  party: 'urn:altinn:organization:identifier-no:999888777',
  partyType: 'Organization',
  name: 'Test Org AS',
  isCurrentEndUser: false,
  isDeleted: false,
  partyUuid: 'uuid-org',
  partyId: 2,
  hasOnlyAccessToSubParties: false,
  subParties: [
    {
      party: 'urn:altinn:organization:identifier-no:999888001',
      partyType: 'Organization',
      name: 'Sub Org',
      isCurrentEndUser: false,
      isDeleted: false,
      partyUuid: 'uuid-sub',
      partyId: 3,
    },
  ],
};

const promotedSubParty: PartyFieldsFragment = {
  party: 'urn:altinn:organization:identifier-no:999888001',
  partyType: 'Organization',
  name: 'Sub Org',
  isCurrentEndUser: false,
  isDeleted: false,
  partyUuid: 'uuid-sub',
  partyId: 3,
  hasOnlyAccessToSubParties: false,
  subParties: [],
};

const parties = [personParty, orgParty, promotedSubParty];
const partyGraph = buildPartyGraph(parties);

const organizations: OrganizationFieldsFragment[] = [
  {
    id: 'org-1',
    name: { nb: 'Skatteetaten', nn: 'Skatteetaten', en: 'Tax Administration' },
    logo: 'https://example.com/logo.png',
  },
];
const orgMap = buildOrganizationMap(organizations);

const mockFormat = (date: string | Date, _fmt: string) => String(date);

const createDialog = (overrides: Partial<SearchDialogFieldsFragment> = {}): SearchDialogFieldsFragment =>
  ({
    id: 'dialog-1',
    party: orgParty.party,
    org: 'org-1',
    status: 'InProgress',
    contentUpdatedAt: '2024-01-01T00:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    guiAttachmentCount: 0,
    serviceResourceType: 'GenericAccessResource',
    dueAt: null,
    hasUnopenedContent: false,
    fromServiceOwnerTransmissionsCount: 0,
    fromPartyTransmissionsCount: 0,
    serviceResource: 'urn:altinn:resource:test',
    endUserContext: { systemLabels: [] },
    seenSinceLastContentUpdate: [],
    content: {
      title: { value: [{ languageCode: 'nb', value: 'Test Dialog' }] },
      summary: { value: [{ languageCode: 'nb', value: 'Summary' }] },
      senderName: { value: [{ languageCode: 'nb', value: 'Skatteetaten' }] },
      extendedStatus: null,
    },
    ...overrides,
  }) as unknown as SearchDialogFieldsFragment;

describe('mapDialogToToInboxItems', () => {
  it('should map a dialog to an inbox item with correct receiver', () => {
    const result = mapDialogToToInboxItems([createDialog()], partyGraph, orgMap, mockFormat, false);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('dialog-1');
    expect(result[0].recipient.name).toBe('Test Org AS');
    expect(result[0].recipient.type).toBe('company');
    expect(result[0].recipient.variant).toBe('solid');
  });

  it('should set outline variant for sub-party receivers', () => {
    const dialog = createDialog({ party: promotedSubParty.party });
    const result = mapDialogToToInboxItems([dialog], partyGraph, orgMap, mockFormat, false);

    expect(result[0].recipient.name).toBe('Sub Org');
    expect(result[0].recipient.variant).toBe('outline');
  });

  it('should fall back to end user party when dialog party is not found', () => {
    const dialog = createDialog({ party: 'urn:altinn:unknown:123' });
    const result = mapDialogToToInboxItems([dialog], partyGraph, orgMap, mockFormat, false);

    expect(result[0].recipient.name).toBe('Test User');
    expect(result[0].recipient.type).toBe('person');
  });

  it('should resolve organization name from orgMap', () => {
    const result = mapDialogToToInboxItems([createDialog()], partyGraph, orgMap, mockFormat, false);

    expect(result[0].org).toBe('org-1');
  });

  it('should handle empty input array', () => {
    const result = mapDialogToToInboxItems([], partyGraph, orgMap, mockFormat, false);
    expect(result).toHaveLength(0);
  });

  it('should handle multiple dialogs efficiently', () => {
    const dialogs = Array.from({ length: 1000 }, (_, i) => createDialog({ id: `dialog-${i}` }));

    const start = performance.now();
    const result = mapDialogToToInboxItems(dialogs, partyGraph, orgMap, mockFormat, false);
    const elapsed = performance.now() - start;

    expect(result).toHaveLength(1000);
    expect(elapsed).toBeLessThan(500);
  });
});
