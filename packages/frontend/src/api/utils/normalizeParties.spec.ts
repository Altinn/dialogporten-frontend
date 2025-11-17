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
        },
      ],
      name: 'MYSUSÆTER OG ØSTRE GAUSDAL',
      isCurrentEndUser: false,
      isDeleted: false,
      partyUuid: 'urn:altinn:person:identifier-no:1338',
    },
  ];

  it('should return sub-parties where name differs from parent', () => {
    const result = normalizeFlattenParties(parties, false);

    expect(result.length).toBe(3);
    expect(result[0].name).toBe('Reiersen Edel');
    expect(result[1].name).toBe('Mysusæter Og Østre Gausdal');
    expect(result[2].name).toBe('Steinkjer Og Flateby');
  });

  it('should copy parent properties to sub-parties correctly', () => {
    const result = normalizeFlattenParties(parties, false);
    expect(result[2].isDeleted).toBe(false);
    expect(result[2].isCurrentEndUser).toBe(false);
  });
});
