import {
  DialogStatus,
  type PartyFieldsFragment,
  type SearchDialogFieldsFragment,
  SystemLabel,
} from 'bff-types-generated';
import { describe, expect, it, vi } from 'vitest';
import type { FormatFunction } from '../../i18n/useDateFnsLocale.tsx';
import { getPartyIds, mapDialogToToInboxItems } from './dialog.ts';

vi.mock('../../i18n/config.ts', () => ({
  i18n: { language: 'nb' },
}));

const format: FormatFunction = (date: Date | string, _formatStr: string) => String(date);

// ----- Test parties -----
const endUser: PartyFieldsFragment = {
  party: 'urn:altinn:person:identifier-no:12345678901',
  partyType: 'Person',
  name: 'Ola Nordmann',
  isCurrentEndUser: true,
  isDeleted: false,
  hasOnlyAccessToSubParties: false,
  partyUuid: 'uuid-person-1',
  partyId: 1,
  subParties: [],
};

const parentOrg: PartyFieldsFragment = {
  party: 'urn:altinn:organization:identifier-no:910000001',
  partyType: 'Organization',
  name: 'Stor Bedrift AS',
  isCurrentEndUser: false,
  isDeleted: false,
  hasOnlyAccessToSubParties: false,
  partyUuid: 'uuid-org-parent',
  partyId: 2,
  subParties: [
    {
      party: 'urn:altinn:organization:identifier-no:910000002',
      partyType: 'Organization',
      name: 'Stor Bedrift Avd Oslo',
      isCurrentEndUser: false,
      isDeleted: false,
      partyUuid: 'uuid-org-sub',
      partyId: 3,
    },
  ],
};

const standaloneOrg: PartyFieldsFragment = {
  party: 'urn:altinn:organization:identifier-no:910000099',
  partyType: 'Organization',
  name: 'Frittstående AS',
  isCurrentEndUser: false,
  isDeleted: false,
  hasOnlyAccessToSubParties: false,
  partyUuid: 'uuid-org-standalone',
  partyId: 4,
  subParties: [],
};

const parties: PartyFieldsFragment[] = [endUser, parentOrg, standaloneOrg];

// ----- Helper to build a minimal SearchDialogFieldsFragment -----
function makeDialog(overrides: Partial<SearchDialogFieldsFragment> & { party: string }): SearchDialogFieldsFragment {
  return {
    id: overrides.id ?? 'dialog-1',
    party: overrides.party,
    org: overrides.org ?? 'skd',
    status: overrides.status ?? DialogStatus.InProgress,
    createdAt: overrides.createdAt ?? '2025-01-01T00:00:00Z',
    contentUpdatedAt: overrides.contentUpdatedAt ?? '2025-01-01T00:00:00Z',
    hasUnopenedContent: overrides.hasUnopenedContent ?? false,
    serviceResourceType: overrides.serviceResourceType ?? 'GenericAccessResource',
    serviceResource: overrides.serviceResource ?? 'urn:altinn:resource:test',
    fromServiceOwnerTransmissionsCount: overrides.fromServiceOwnerTransmissionsCount ?? 0,
    fromPartyTransmissionsCount: overrides.fromPartyTransmissionsCount ?? 0,
    guiAttachmentCount: overrides.guiAttachmentCount ?? 0,
    dueAt: overrides.dueAt ?? undefined,
    progress: overrides.progress ?? null,
    seenSinceLastContentUpdate: overrides.seenSinceLastContentUpdate ?? [],
    endUserContext: overrides.endUserContext ?? { systemLabels: [SystemLabel.Default] },
    content: overrides.content ?? {
      title: { mediaType: 'text/plain', value: [{ languageCode: 'nb', value: 'Test tittel' }] },
      summary: { mediaType: 'text/plain', value: [{ languageCode: 'nb', value: 'Test sammendrag' }] },
      senderName: null,
      extendedStatus: null,
    },
  } as SearchDialogFieldsFragment;
}

// ----- Tests -----
describe('mapDialogToToInboxItems — recipient resolution', () => {
  it('resolves recipient when dialog party matches a top-level party', () => {
    const dialog = makeDialog({ party: standaloneOrg.party });
    const [result] = mapDialogToToInboxItems([dialog], parties, [], format, false);

    expect(result.recipient.name).toBe('Frittstående AS');
    expect(result.recipient.type).toBe('company');
  });

  it('resolves recipient when dialog party matches the end user (person)', () => {
    const dialog = makeDialog({ party: endUser.party });
    const [result] = mapDialogToToInboxItems([dialog], parties, [], format, false);

    expect(result.recipient.name).toBe('Ola Nordmann');
    expect(result.recipient.type).toBe('person');
  });

  it('resolves recipient when dialog party matches a subParty (not a top-level entry)', () => {
    const subPartyUrn = 'urn:altinn:organization:identifier-no:910000002';
    const dialog = makeDialog({ party: subPartyUrn });
    const [result] = mapDialogToToInboxItems([dialog], parties, [], format, false);

    expect(result.recipient.name).toBe('Stor Bedrift Avd Oslo');
    expect(result.recipient.type).toBe('company');
  });

  it('falls back to endUserParty when dialog party matches no party or subParty', () => {
    const dialog = makeDialog({ party: 'urn:altinn:organization:identifier-no:999999999' });
    const [result] = mapDialogToToInboxItems([dialog], parties, [], format, false);

    expect(result.recipient.name).toBe('Ola Nordmann');
    expect(result.recipient.type).toBe('person');
  });

  it('returns empty name when dialog party matches nothing and there is no end user', () => {
    const partiesWithoutEndUser = parties.map((p) => ({ ...p, isCurrentEndUser: false }));
    const dialog = makeDialog({ party: 'urn:altinn:organization:identifier-no:999999999' });
    const [result] = mapDialogToToInboxItems([dialog], partiesWithoutEndUser, [], format, false);

    expect(result.recipient.name).toBe('');
  });
});

describe('mapDialogToToInboxItems — recipient variant (solid vs outline)', () => {
  it('returns "solid" for a parent org (has subParties array)', () => {
    const dialog = makeDialog({ party: parentOrg.party });
    const [result] = mapDialogToToInboxItems([dialog], parties, [], format, false);

    expect(result.recipient.variant).toBe('solid');
  });

  it('returns "solid" for a person recipient', () => {
    const dialog = makeDialog({ party: endUser.party });
    const [result] = mapDialogToToInboxItems([dialog], parties, [], format, false);

    expect(result.recipient.variant).toBe('solid');
  });

  it('returns "outline" for an org that is a promoted subParty in the flat list (no own subParties)', () => {
    // Simulate the flat list that normalizeFlattenParties produces:
    // The promoted subParty appears as a top-level entry without subParties.
    const promotedSubParty: PartyFieldsFragment = {
      party: 'urn:altinn:organization:identifier-no:910000002',
      partyType: 'Organization',
      name: 'Stor Bedrift Avd Oslo',
      isCurrentEndUser: false,
      isDeleted: false,
      hasOnlyAccessToSubParties: false,
      partyUuid: 'uuid-org-sub',
      partyId: 3,
      // No subParties — this is how promoted subParties look in the flat list
    };

    const flatParties: PartyFieldsFragment[] = [endUser, parentOrg, promotedSubParty, standaloneOrg];
    const dialog = makeDialog({ party: promotedSubParty.party });
    const [result] = mapDialogToToInboxItems([dialog], flatParties, [], format, false);

    // Matches as dialogReceiverParty (top-level find), has no subParties, is Organization → outline
    expect(result.recipient.variant).toBe('outline');
  });

  it('returns "solid" for a standalone org (no subParties, but also not a child)', () => {
    const dialog = makeDialog({ party: standaloneOrg.party });
    const [result] = mapDialogToToInboxItems([dialog], parties, [], format, false);

    // standaloneOrg has subParties: [] (truthy array), so !dialogReceiverParty.subParties is false → solid
    expect(result.recipient.variant).toBe('solid');
  });
});

describe('mapDialogToToInboxItems — basic field mapping', () => {
  it('maps id, party, status, and dates from the dialog', () => {
    const dialog = makeDialog({
      id: 'abc-123',
      party: endUser.party,
      status: DialogStatus.Completed,
      createdAt: '2025-06-01T12:00:00Z',
      contentUpdatedAt: '2025-06-02T12:00:00Z',
    });
    const [result] = mapDialogToToInboxItems([dialog], parties, [], format, false);

    expect(result.id).toBe('abc-123');
    expect(result.party).toBe(endUser.party);
    expect(result.status).toBe(DialogStatus.Completed);
    expect(result.createdAt).toBe('2025-06-01T12:00:00Z');
    expect(result.contentUpdatedAt).toBe('2025-06-02T12:00:00Z');
  });

  it('maps title and summary from localized content', () => {
    const dialog = makeDialog({
      party: endUser.party,
      content: {
        title: { mediaType: 'text/plain', value: [{ languageCode: 'nb', value: 'Min tittel' }] },
        summary: { mediaType: 'text/plain', value: [{ languageCode: 'nb', value: 'Min oppsummering' }] },
        senderName: null,
        extendedStatus: null,
      },
    } as Partial<SearchDialogFieldsFragment> & { party: string });
    const [result] = mapDialogToToInboxItems([dialog], parties, [], format, false);

    expect(result.title).toBe('Min tittel');
    expect(result.summary).toBe('Min oppsummering');
  });

  it('handles multiple dialogs and resolves each independently', () => {
    const dialogs = [
      makeDialog({ id: 'd1', party: endUser.party }),
      makeDialog({ id: 'd2', party: standaloneOrg.party }),
      makeDialog({ id: 'd3', party: 'urn:altinn:organization:identifier-no:910000002' }),
    ];
    const results = mapDialogToToInboxItems(dialogs, parties, [], format, false);

    expect(results).toHaveLength(3);
    expect(results[0].recipient.name).toBe('Ola Nordmann');
    expect(results[1].recipient.name).toBe('Frittstående AS');
    expect(results[2].recipient.name).toBe('Stor Bedrift Avd Oslo');
  });
});

// ----- getPartyIds tests -----

describe('getPartyIds', () => {
  it('returns top-level party URIs', () => {
    const result = getPartyIds([endUser, standaloneOrg]);

    expect(result).toContain(endUser.party);
    expect(result).toContain(standaloneOrg.party);
  });

  it('includes subParty URIs alongside parent URIs', () => {
    const result = getPartyIds([parentOrg]);

    expect(result).toContain(parentOrg.party);
    expect(result).toContain('urn:altinn:organization:identifier-no:910000002');
  });

  it('excludes top-level party when hasOnlyAccessToSubParties is true', () => {
    const disabledParent: PartyFieldsFragment = {
      ...parentOrg,
      hasOnlyAccessToSubParties: true,
    };
    const result = getPartyIds([disabledParent]);

    expect(result).not.toContain(disabledParent.party);
    // subParties should still be included
    expect(result).toContain('urn:altinn:organization:identifier-no:910000002');
  });

  it('deduplicates URIs when a subParty also appears as a top-level party', () => {
    // Simulates the flattened list where a promoted subParty also exists at top level
    const promotedSub: PartyFieldsFragment = {
      party: 'urn:altinn:organization:identifier-no:910000002',
      partyType: 'Organization',
      name: 'Stor Bedrift Avd Oslo',
      isCurrentEndUser: false,
      isDeleted: false,
      hasOnlyAccessToSubParties: false,
      partyUuid: 'uuid-org-sub',
      partyId: 3,
      subParties: [],
    };
    const result = getPartyIds([parentOrg, promotedSub]);

    const subPartyOccurrences = result.filter((uri) => uri === 'urn:altinn:organization:identifier-no:910000002');
    expect(subPartyOccurrences).toHaveLength(1);
  });

  it('with includeOnlySubPartiesWithSameName, only includes subParties whose name matches parent', () => {
    const orgWithMixedSubs: PartyFieldsFragment = {
      party: 'urn:altinn:organization:identifier-no:800000001',
      partyType: 'Organization',
      name: 'Same Name Corp',
      isCurrentEndUser: false,
      isDeleted: false,
      hasOnlyAccessToSubParties: false,
      partyUuid: 'uuid-mixed',
      partyId: 50,
      subParties: [
        {
          party: 'urn:altinn:organization:identifier-no:800000010',
          partyType: 'Organization',
          name: 'Same Name Corp',
          isCurrentEndUser: false,
          isDeleted: false,
          partyUuid: 'uuid-same-name-sub',
          partyId: 51,
        },
        {
          party: 'urn:altinn:organization:identifier-no:800000011',
          partyType: 'Organization',
          name: 'Different Avd',
          isCurrentEndUser: false,
          isDeleted: false,
          partyUuid: 'uuid-diff-name-sub',
          partyId: 52,
        },
      ],
    };
    const result = getPartyIds([orgWithMixedSubs], true);

    expect(result).toContain('urn:altinn:organization:identifier-no:800000010');
    expect(result).not.toContain('urn:altinn:organization:identifier-no:800000011');
  });

  it('returns empty array for empty input', () => {
    expect(getPartyIds([])).toEqual([]);
  });

  it('handles parties with no subParties (undefined)', () => {
    const noSubs: PartyFieldsFragment = {
      party: 'urn:altinn:person:identifier-no:99999999999',
      partyType: 'Person',
      name: 'No Subs',
      isCurrentEndUser: false,
      isDeleted: false,
      hasOnlyAccessToSubParties: false,
      partyUuid: 'uuid-nosubs',
      partyId: 99,
      // subParties intentionally omitted (undefined)
    };
    const result = getPartyIds([noSubs]);

    expect(result).toEqual([noSubs.party]);
  });
});

// ----- PartyGraph path tests -----
// Verify that passing a PartyGraph produces identical results to the legacy path.

import { buildPartyGraph } from './partyGraph.ts';

const partyGraph = buildPartyGraph(parties);

describe('mapDialogToToInboxItems with PartyGraph — recipient resolution', () => {
  it('resolves recipient when dialog party matches a top-level party', () => {
    const dialog = makeDialog({ party: standaloneOrg.party });
    const [result] = mapDialogToToInboxItems([dialog], parties, [], format, false, partyGraph);

    expect(result.recipient.name).toBe('Frittstående AS');
    expect(result.recipient.type).toBe('company');
  });

  it('resolves recipient when dialog party matches the end user (person)', () => {
    const dialog = makeDialog({ party: endUser.party });
    const [result] = mapDialogToToInboxItems([dialog], parties, [], format, false, partyGraph);

    expect(result.recipient.name).toBe('Ola Nordmann');
    expect(result.recipient.type).toBe('person');
  });

  it('resolves recipient when dialog party matches a subParty', () => {
    const subPartyUrn = 'urn:altinn:organization:identifier-no:910000002';
    const dialog = makeDialog({ party: subPartyUrn });
    const [result] = mapDialogToToInboxItems([dialog], parties, [], format, false, partyGraph);

    expect(result.recipient.name).toBe('Stor Bedrift Avd Oslo');
    expect(result.recipient.type).toBe('company');
  });

  it('falls back to endUserParty when dialog party matches nothing', () => {
    const dialog = makeDialog({ party: 'urn:altinn:organization:identifier-no:999999999' });
    const [result] = mapDialogToToInboxItems([dialog], parties, [], format, false, partyGraph);

    expect(result.recipient.name).toBe('Ola Nordmann');
    expect(result.recipient.type).toBe('person');
  });

  it('subParty recipient gets outline variant', () => {
    const subPartyUrn = 'urn:altinn:organization:identifier-no:910000002';
    const dialog = makeDialog({ party: subPartyUrn });
    const [result] = mapDialogToToInboxItems([dialog], parties, [], format, false, partyGraph);

    expect(result.recipient.variant).toBe('outline');
  });

  it('parent org recipient gets solid variant', () => {
    const dialog = makeDialog({ party: parentOrg.party });
    const [result] = mapDialogToToInboxItems([dialog], parties, [], format, false, partyGraph);

    expect(result.recipient.variant).toBe('solid');
  });

  it('handles multiple dialogs resolved via PartyGraph', () => {
    const dialogs = [
      makeDialog({ id: 'd1', party: endUser.party }),
      makeDialog({ id: 'd2', party: standaloneOrg.party }),
      makeDialog({ id: 'd3', party: 'urn:altinn:organization:identifier-no:910000002' }),
    ];
    const results = mapDialogToToInboxItems(dialogs, parties, [], format, false, partyGraph);

    expect(results).toHaveLength(3);
    expect(results[0].recipient.name).toBe('Ola Nordmann');
    expect(results[1].recipient.name).toBe('Frittstående AS');
    expect(results[2].recipient.name).toBe('Stor Bedrift Avd Oslo');
  });
});
