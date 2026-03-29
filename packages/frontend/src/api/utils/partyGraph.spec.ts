import type { PartyFieldsFragment } from 'bff-types-generated';
import { describe, expect, it } from 'vitest';
import { EMPTY_PARTY_GRAPH, buildPartyGraph } from './partyGraph.ts';

const createParty = (overrides: Partial<PartyFieldsFragment> = {}): PartyFieldsFragment => ({
  party: 'urn:altinn:person:identifier-no:12345678901',
  partyType: 'Person',
  name: 'Test Person',
  isCurrentEndUser: false,
  isDeleted: false,
  partyUuid: 'uuid-person-1',
  partyId: 1,
  hasOnlyAccessToSubParties: false,
  subParties: [],
  ...overrides,
});

const personParty = createParty({
  party: 'urn:altinn:person:identifier-no:11111111111',
  partyType: 'Person',
  name: 'Test Testesen',
  isCurrentEndUser: true,
  partyUuid: 'uuid-person-enduser',
  partyId: 1,
});

const orgParty = createParty({
  party: 'urn:altinn:organization:identifier-no:999888777',
  partyType: 'Organization',
  name: 'Test Org AS',
  isCurrentEndUser: false,
  partyUuid: 'uuid-org-1',
  partyId: 2,
  subParties: [
    {
      party: 'urn:altinn:organization:identifier-no:999888001',
      partyType: 'Organization',
      name: 'Sub Org A',
      isCurrentEndUser: false,
      isDeleted: false,
      partyUuid: 'uuid-sub-a',
      partyId: 3,
    },
    {
      party: 'urn:altinn:organization:identifier-no:999888002',
      partyType: 'Organization',
      name: 'Sub Org B',
      isCurrentEndUser: false,
      isDeleted: true,
      partyUuid: 'uuid-sub-b',
      partyId: 4,
    },
  ],
});

const promotedSubA = createParty({
  party: 'urn:altinn:organization:identifier-no:999888001',
  partyType: 'Organization',
  name: 'Sub Org A',
  isCurrentEndUser: false,
  partyUuid: 'uuid-sub-a',
  partyId: 3,
  subParties: [],
});

const promotedSubB = createParty({
  party: 'urn:altinn:organization:identifier-no:999888002',
  partyType: 'Organization',
  name: 'Sub Org B',
  isCurrentEndUser: false,
  isDeleted: true,
  partyUuid: 'uuid-sub-b',
  partyId: 4,
  subParties: [],
});

const parties: PartyFieldsFragment[] = [personParty, orgParty, promotedSubA, promotedSubB];

describe('buildPartyGraph', () => {
  it('should build a graph with O(1) URN lookups for all parties', () => {
    const graph = buildPartyGraph(parties);

    expect(graph.partyByUrn.get(personParty.party)).toBe(personParty);
    expect(graph.partyByUrn.get(orgParty.party)).toBe(orgParty);
    expect(graph.partyByUrn.get(promotedSubA.party)).toBe(promotedSubA);
    expect(graph.partyByUrn.get(promotedSubB.party)).toBe(promotedSubB);
    expect(graph.partyByUrn.size).toBe(4);
  });

  it('should build a graph with O(1) UUID lookups', () => {
    const graph = buildPartyGraph(parties);

    expect(graph.partyByUuid.get('uuid-person-enduser')).toBe(personParty);
    expect(graph.partyByUuid.get('uuid-org-1')).toBe(orgParty);
    expect(graph.partyByUuid.get('uuid-sub-a')).toBe(promotedSubA);
    expect(graph.partyByUuid.get('uuid-sub-b')).toBe(promotedSubB);
  });

  it('should resolve parent party for sub-parties via parentByChildUrn', () => {
    const graph = buildPartyGraph(parties);

    expect(graph.parentByChildUrn.get(promotedSubA.party)).toBe(orgParty);
    expect(graph.parentByChildUrn.get(promotedSubB.party)).toBe(orgParty);
    expect(graph.parentByChildUrn.has(personParty.party)).toBe(false);
    expect(graph.parentByChildUrn.has(orgParty.party)).toBe(false);
  });

  it('should identify the current end user', () => {
    const graph = buildPartyGraph(parties);

    expect(graph.currentEndUser).toBe(personParty);
  });

  it('should pick the first current end user when multiple exist', () => {
    const secondEndUser = createParty({
      party: 'urn:altinn:person:identifier-no:22222222222',
      name: 'Second User',
      isCurrentEndUser: true,
      partyUuid: 'uuid-person-2',
    });
    const graph = buildPartyGraph([personParty, secondEndUser]);

    expect(graph.currentEndUser).toBe(personParty);
  });

  it('should return undefined currentEndUser when none exists', () => {
    const noEndUser = [
      createParty({ isCurrentEndUser: false, partyUuid: 'a' }),
      createParty({ party: 'urn:altinn:organization:identifier-no:111', isCurrentEndUser: false, partyUuid: 'b' }),
    ];
    const graph = buildPartyGraph(noEndUser);

    expect(graph.currentEndUser).toBeUndefined();
  });

  it('should handle an empty party list', () => {
    const graph = buildPartyGraph([]);

    expect(graph.partyByUrn.size).toBe(0);
    expect(graph.partyByUuid.size).toBe(0);
    expect(graph.parentByChildUrn.size).toBe(0);
    expect(graph.currentEndUser).toBeUndefined();
  });

  it('should handle parties without sub-parties', () => {
    const standalone = createParty({
      party: 'urn:altinn:organization:identifier-no:555',
      partyUuid: 'uuid-standalone',
      subParties: undefined,
    });
    const graph = buildPartyGraph([standalone]);

    expect(graph.partyByUrn.get(standalone.party)).toBe(standalone);
    expect(graph.parentByChildUrn.size).toBe(0);
  });

  it('should handle large party lists efficiently', () => {
    const largeList: PartyFieldsFragment[] = [];
    for (let i = 0; i < 15_000; i++) {
      largeList.push(
        createParty({
          party: `urn:altinn:organization:identifier-no:${String(i).padStart(9, '0')}`,
          partyUuid: `uuid-${i}`,
          partyId: i,
          name: `Org ${i}`,
        }),
      );
    }

    const start = performance.now();
    const graph = buildPartyGraph(largeList);
    const elapsed = performance.now() - start;

    expect(graph.partyByUrn.size).toBe(15_000);
    expect(graph.partyByUuid.size).toBe(15_000);
    // Should complete in well under 100ms even for 15k parties
    expect(elapsed).toBeLessThan(100);

    // O(1) lookup should be instant
    const lookupStart = performance.now();
    const party = graph.partyByUrn.get('urn:altinn:organization:identifier-no:000007500');
    const lookupElapsed = performance.now() - lookupStart;

    expect(party?.name).toBe('Org 7500');
    expect(lookupElapsed).toBeLessThan(1);
  });
});

describe('EMPTY_PARTY_GRAPH', () => {
  it('should have empty maps and undefined currentEndUser', () => {
    expect(EMPTY_PARTY_GRAPH.partyByUrn.size).toBe(0);
    expect(EMPTY_PARTY_GRAPH.partyByUuid.size).toBe(0);
    expect(EMPTY_PARTY_GRAPH.parentByChildUrn.size).toBe(0);
    expect(EMPTY_PARTY_GRAPH.currentEndUser).toBeUndefined();
  });
});
