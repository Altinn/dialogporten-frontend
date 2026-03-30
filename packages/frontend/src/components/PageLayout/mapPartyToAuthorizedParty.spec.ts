import type { PartyFieldsFragment } from 'bff-types-generated';
import { describe, expect, it } from 'vitest';
import { extractIdentifierNumber, mapPartiesToAuthorizedParties } from './mapPartyToAuthorizedParty.ts';

const createParty = (overrides: Partial<PartyFieldsFragment> = {}): PartyFieldsFragment => ({
  party: 'urn:altinn:person:identifier-no:12345678901',
  partyType: 'Person',
  name: 'Test Person',
  isCurrentEndUser: false,
  isDeleted: false,
  partyUuid: 'uuid-1',
  partyId: 1,
  hasOnlyAccessToSubParties: false,
  subParties: [],
  ...overrides,
});

describe('extractIdentifierNumber', () => {
  it('should extract number from URN format', () => {
    expect(extractIdentifierNumber('urn:altinn:person:identifier-no:12345678901')).toBe('12345678901');
  });

  it('should extract org number from URN format', () => {
    expect(extractIdentifierNumber('urn:altinn:organization:identifier-no:999888777')).toBe('999888777');
  });

  it('should return undefined for missing partyId', () => {
    expect(extractIdentifierNumber(undefined)).toBeUndefined();
  });

  it('should return undefined for invalid format', () => {
    expect(extractIdentifierNumber('invalid-format')).toBeUndefined();
  });
});

describe('mapPartiesToAuthorizedParties', () => {
  it('should map a simple person party', () => {
    const parties = [createParty()];
    const result = mapPartiesToAuthorizedParties(parties);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Test Person');
    expect(result[0].type).toBe('Person');
    expect(result[0].organizationNumber).toBeUndefined();
  });

  it('should map an organization with identifier number', () => {
    const parties = [
      createParty({
        party: 'urn:altinn:organization:identifier-no:999888777',
        partyType: 'Organization',
        name: 'Test Org AS',
        partyUuid: 'uuid-org',
      }),
    ];
    const result = mapPartiesToAuthorizedParties(parties);

    expect(result).toHaveLength(1);
    expect(result[0].organizationNumber).toBe('999888777');
  });

  it('should filter out sub-parties from top-level and add them as subunits', () => {
    const subParty = {
      party: 'urn:altinn:organization:identifier-no:999888001',
      partyType: 'Organization' as const,
      name: 'Sub Unit',
      isCurrentEndUser: false,
      isDeleted: false,
      partyUuid: 'uuid-sub',
      partyId: 3,
    };

    const parentOrg = createParty({
      party: 'urn:altinn:organization:identifier-no:999888777',
      partyType: 'Organization',
      name: 'Parent Org',
      partyUuid: 'uuid-parent',
      subParties: [subParty],
    });

    // Simulate normalizeFlattenParties which promotes sub-parties
    const promotedSub = createParty({
      ...subParty,
      hasOnlyAccessToSubParties: false,
      subParties: [],
    });

    const parties = [parentOrg, promotedSub];
    const result = mapPartiesToAuthorizedParties(parties);

    // Sub-party should be filtered from top-level
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Parent Org');
    expect(result[0].subunits).toHaveLength(1);
    expect(result[0].subunits?.[0].name).toBe('Sub Unit');
  });

  it('should handle parties with hasOnlyAccessToSubParties', () => {
    const parties = [
      createParty({
        hasOnlyAccessToSubParties: true,
        name: 'Access Only Parent',
      }),
    ];
    const result = mapPartiesToAuthorizedParties(parties);

    expect(result[0].onlyHierarchyElementWithNoAccess).toBe(true);
  });

  it('should handle empty party list', () => {
    const result = mapPartiesToAuthorizedParties([]);
    expect(result).toHaveLength(0);
  });

  it('should handle deleted parties', () => {
    const parties = [createParty({ isDeleted: true, name: 'Deleted Org' })];
    const result = mapPartiesToAuthorizedParties(parties);

    expect(result[0].isDeleted).toBe(true);
  });
});
