import type { PartyFieldsFragment } from 'bff-types-generated';
import { describe, expect, it } from 'vitest';
import { normalizeFlattenParties } from './normalizeFlattenParties.ts';

describe('normalizeParties', () => {
  const parties: PartyFieldsFragment[] = [
    {
      party: 'urn:altinn:person:identifier-no:1337',
      partyType: 'Person',
      subParties: [],
      hasOnlyAccessToSubParties: false,
      name: 'EDEL REIERSEN',
      isCurrentEndUser: true,
      isDeleted: false,
      partyUuid: 'urn:altinn:person:identifier-no:1337',
      partyId: 1,
    },
    {
      party: 'urn:altinn:organization:identifier-no:1',
      partyType: 'Organization',
      hasOnlyAccessToSubParties: false,
      subParties: [
        {
          party: 'urn:altinn:organization:identifier-no:2',
          partyType: 'Organization',
          name: 'STEINKJER OG FLATEBY',
          isCurrentEndUser: false,
          partyUuid: 'urn:altinn:person:identifier-no:1337',
          isDeleted: false,
          partyId: 2,
        },
      ],
      name: 'MYSUSÆTER OG ØSTRE GAUSDAL',
      isCurrentEndUser: false,
      isDeleted: false,
      partyUuid: 'urn:altinn:person:identifier-no:1338',
      partyId: 3,
    },
  ];

  it('should return sub-parties where name differs from parent', () => {
    const result = normalizeFlattenParties(parties);

    expect(result.length).toBe(3);
    expect(result[0].name).toBe('Edel Reiersen');
    expect(result[1].name).toBe('Mysusæter Og Østre Gausdal');
    expect(result[2].name).toBe('Steinkjer Og Flateby');
  });

  it('should copy parent properties to sub-parties correctly', () => {
    const result = normalizeFlattenParties(parties);
    expect(result[2].isDeleted).toBe(false);
    expect(result[2].isCurrentEndUser).toBe(false);
  });

  it('promoted subParties appear as top-level entries in the flat list', () => {
    const result = normalizeFlattenParties(parties);
    // Index 0: person, Index 1: parent org, Index 2: promoted subParty
    expect(result[2].party).toBe('urn:altinn:organization:identifier-no:2');
    // Promoted entry should be top-level (not nested under parent)
    expect(result.filter((p) => p.party === 'urn:altinn:organization:identifier-no:2')).toHaveLength(1);
  });

  it('parent retains its subParties array after flattening', () => {
    const result = normalizeFlattenParties(parties);
    const parent = result.find((p) => p.party === 'urn:altinn:organization:identifier-no:1');
    expect(parent?.subParties).toBeDefined();
    expect(parent?.subParties).toHaveLength(1);
    expect(parent?.subParties?.[0]?.party).toBe('urn:altinn:organization:identifier-no:2');
  });

  it('promoted subParty does NOT have a subParties array (distinguishes parent from child)', () => {
    const result = normalizeFlattenParties(parties);
    const promoted = result[2];
    // SubPartyFieldsFragment has no subParties field — this is the key distinction
    // used by useAccounts to tell parents from promoted children
    expect(promoted.subParties).toBeUndefined();
  });

  it('preserves ordering: parent appears before its promoted children', () => {
    const result = normalizeFlattenParties(parties);
    const parentIdx = result.findIndex((p) => p.party === 'urn:altinn:organization:identifier-no:1');
    const childIdx = result.findIndex((p) => p.party === 'urn:altinn:organization:identifier-no:2');
    expect(parentIdx).toBeLessThan(childIdx);
  });

  it('handles party with no subParties', () => {
    const personOnly: PartyFieldsFragment[] = [
      {
        party: 'urn:altinn:person:identifier-no:9999',
        partyType: 'Person',
        subParties: [],
        hasOnlyAccessToSubParties: false,
        name: 'BARE PERSON',
        isCurrentEndUser: true,
        isDeleted: false,
        partyUuid: 'uuid-bare',
        partyId: 99,
      },
    ];
    const result = normalizeFlattenParties(personOnly);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Bare Person');
  });

  it('handles multiple parents with multiple subParties each', () => {
    const multiParent: PartyFieldsFragment[] = [
      {
        party: 'urn:altinn:organization:identifier-no:A',
        partyType: 'Organization',
        hasOnlyAccessToSubParties: false,
        subParties: [
          {
            party: 'urn:altinn:organization:identifier-no:A1',
            partyType: 'Organization',
            name: 'SUB A1',
            isCurrentEndUser: false,
            partyUuid: 'uuid-a1',
            isDeleted: false,
            partyId: 10,
          },
          {
            party: 'urn:altinn:organization:identifier-no:A2',
            partyType: 'Organization',
            name: 'SUB A2',
            isCurrentEndUser: false,
            partyUuid: 'uuid-a2',
            isDeleted: false,
            partyId: 11,
          },
        ],
        name: 'PARENT A',
        isCurrentEndUser: false,
        isDeleted: false,
        partyUuid: 'uuid-a',
        partyId: 1,
      },
      {
        party: 'urn:altinn:organization:identifier-no:B',
        partyType: 'Organization',
        hasOnlyAccessToSubParties: false,
        subParties: [
          {
            party: 'urn:altinn:organization:identifier-no:B1',
            partyType: 'Organization',
            name: 'SUB B1',
            isCurrentEndUser: false,
            partyUuid: 'uuid-b1',
            isDeleted: false,
            partyId: 20,
          },
        ],
        name: 'PARENT B',
        isCurrentEndUser: false,
        isDeleted: false,
        partyUuid: 'uuid-b',
        partyId: 2,
      },
    ];
    const result = normalizeFlattenParties(multiParent);
    // Parent A, Sub A1, Sub A2, Parent B, Sub B1
    expect(result).toHaveLength(5);
    expect(result.map((p) => p.party)).toEqual([
      'urn:altinn:organization:identifier-no:A',
      'urn:altinn:organization:identifier-no:A1',
      'urn:altinn:organization:identifier-no:A2',
      'urn:altinn:organization:identifier-no:B',
      'urn:altinn:organization:identifier-no:B1',
    ]);
  });
});
