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
      isAccessManager: true,
      isMainAdministrator: false,
      name: 'EDEL REIERSEN',
      isCurrentEndUser: true,
      isDeleted: false,
    },
    {
      party: 'urn:altinn:organization:identifier-no:1',
      partyType: 'Organization',
      hasOnlyAccessToSubParties: false,
      subParties: [
        {
          party: 'urn:altinn:organization:identifier-no:2',
          partyType: 'Organization',
          isAccessManager: true,
          isMainAdministrator: true,
          name: 'STEINKJER OG FLATEBY',
          isCurrentEndUser: false,
          isDeleted: false,
        },
      ],
      isAccessManager: true,
      isMainAdministrator: true,
      name: 'MYSUSÆTER OG ØSTRE GAUSDAL',
      isCurrentEndUser: false,
      isDeleted: false,
    },
  ];

  it('should return sub-parties where name differs from parent', () => {
    const result = normalizeFlattenParties(parties);

    expect(result.length).toBe(3);
    expect(result[0].name).toBe('Edel Reiersen');
    expect(result[1].name).toBe('Mysusæter Og Østre Gausdal');
    expect(result[2].name).toBe('Steinkjer Og Flateby');
  });

  it('should not include sub-parties that have the same name as the parent party', () => {
    const partiesWithMatchingSubParty: PartyFieldsFragment[] = [
      {
        ...parties[0],
        name: 'Matching Party',
        subParties: [
          {
            ...parties[0],
            name: 'Matching Party',
            isDeleted: false,
            __typename: 'AuthorizedSubParty',
          },
        ],
      },
    ];

    const result = normalizeFlattenParties(partiesWithMatchingSubParty);

    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Matching Party');
  });

  it('should copy parent properties to sub-parties correctly', () => {
    const result = normalizeFlattenParties(parties);
    expect(result[2].isDeleted).toBe(false);
    expect(result[2].isCurrentEndUser).toBe(false);
  });
});
