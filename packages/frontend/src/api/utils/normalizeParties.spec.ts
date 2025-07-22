import type { PartyFieldsFragment } from 'bff-types-generated';
import { describe, expect, it } from 'vitest';
import { normalizeFlattenParties } from './normalizeFlattenParties.ts';

describe('normalizeParties', () => {
  const parties: PartyFieldsFragment[] = [
    {
      party: 'urn:altinn:person:identifier-no:1337',
      partyType: 'Person',
      partyUuid: '23e32',
      subParties: [],
      hasOnlyAccessToSubParties: false,
      isAccessManager: true,
      isMainAdministrator: false,
      name: 'EDEL REIERSEN',2
      isCurrentEndUser: true,
      isDeleted: false,
    },
    {
      party: 'urn:altinn:organization:identifier-no:1',
      partyType: 'Organization',
      hasOnlyAccessToSubParties: false,
      partyUuid: '23e32',
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
        partyUuid: '23e32',
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

  it('should include sub-party even if name matches parent when parent hasOnlyAccessToSubParties is true', () => {
    const partiesWithMatchingSubParty: PartyFieldsFragment[] = [
      {
        party: 'urn:altinn:organization:identifier-no:parent',
        partyType: 'Organization',
        hasOnlyAccessToSubParties: true,
        partyUuid: '23e32',
        subParties: [
          {
            party: 'urn:altinn:organization:identifier-no:sub',
            partyType: 'Organization',
            name: 'Matching Name',
            isAccessManager: true,
            isMainAdministrator: false,
            isCurrentEndUser: false,
            isDeleted: false,
            __typename: 'AuthorizedSubParty',
          },
        ],
        isAccessManager: true,
        isMainAdministrator: true,
        name: 'Matching Name',
        isCurrentEndUser: false,
        isDeleted: false,
      },
    ];

    const result = normalizeFlattenParties(partiesWithMatchingSubParty);

    expect(result).toHaveLength(1);
    expect(result[0].party).toBe('urn:altinn:organization:identifier-no:sub');
    expect(result[0].name).toBe('Matching Name');
  });

  it('should not include parent party if hasOnlyAccessToSubParties is true', () => {
    const partiesWithOnlyAccessToSubParties: PartyFieldsFragment[] = [
      {
        party: 'urn:altinn:organization:identifier-no:parent',
        partyType: 'Organization',
        hasOnlyAccessToSubParties: true,
        partyUuid: '23e32',
        subParties: [
          {
            party: 'urn:altinn:organization:identifier-no:sub1',
            partyType: 'Organization',
            name: 'Sub 1',
            isAccessManager: false,
            isMainAdministrator: false,
            isCurrentEndUser: false,
            isDeleted: false,
            __typename: 'AuthorizedSubParty',
          },
        ],
        isAccessManager: true,
        isMainAdministrator: true,
        name: 'Parent Org',
        isCurrentEndUser: false,
        isDeleted: false,
      },
    ];

    const result = normalizeFlattenParties(partiesWithOnlyAccessToSubParties);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Sub 1');
    expect(result[0].party).toBe('urn:altinn:organization:identifier-no:sub1');
    expect(result.some((p) => p.party === 'urn:altinn:organization:identifier-no:parent')).toBe(false);
  });
});
