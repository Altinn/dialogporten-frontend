import type { PartyFieldsFragment } from 'bff-types-generated';
import { describe, expect, it } from 'vitest';
import { extractIdentifierNumber, mapPartiesToAuthorizedParties } from './mapPartyToAuthorizedParty.ts';

// ----- Fixtures -----

const person: PartyFieldsFragment = {
  party: 'urn:altinn:person:identifier-no:12345678901',
  partyType: 'Person',
  name: 'Ola Nordmann',
  isCurrentEndUser: true,
  isDeleted: false,
  hasOnlyAccessToSubParties: false,
  partyUuid: 'uuid-person',
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
  partyUuid: 'uuid-parent',
  partyId: 2,
  subParties: [
    {
      party: 'urn:altinn:organization:identifier-no:910000010',
      partyType: 'Organization',
      name: 'Avd Oslo',
      isCurrentEndUser: false,
      isDeleted: false,
      partyUuid: 'uuid-child-oslo',
      partyId: 3,
    },
    {
      party: 'urn:altinn:organization:identifier-no:910000011',
      partyType: 'Organization',
      name: 'Avd Bergen',
      isCurrentEndUser: false,
      isDeleted: true,
      partyUuid: 'uuid-child-bergen',
      partyId: 4,
    },
  ],
};

const disabledParent: PartyFieldsFragment = {
  party: 'urn:altinn:organization:identifier-no:920000001',
  partyType: 'Organization',
  name: 'Disabled Parent AS',
  isCurrentEndUser: false,
  isDeleted: false,
  hasOnlyAccessToSubParties: true,
  partyUuid: 'uuid-disabled-parent',
  partyId: 5,
  subParties: [
    {
      party: 'urn:altinn:organization:identifier-no:920000010',
      partyType: 'Organization',
      name: 'Only Child',
      isCurrentEndUser: false,
      isDeleted: false,
      partyUuid: 'uuid-only-child',
      partyId: 6,
    },
  ],
};

// Promoted subParty (as produced by normalizeFlattenParties — no subParties field)
const promotedChild: PartyFieldsFragment = {
  party: 'urn:altinn:organization:identifier-no:910000010',
  partyType: 'Organization',
  name: 'Avd Oslo',
  isCurrentEndUser: false,
  isDeleted: false,
  hasOnlyAccessToSubParties: false,
  partyUuid: 'uuid-child-oslo',
  partyId: 3,
};

// ----- extractIdentifierNumber -----

describe('extractIdentifierNumber', () => {
  it('extracts number from person URN', () => {
    expect(extractIdentifierNumber('urn:altinn:person:identifier-no:12345678901')).toBe('12345678901');
  });

  it('extracts number from organization URN', () => {
    expect(extractIdentifierNumber('urn:altinn:organization:identifier-no:910000001')).toBe('910000001');
  });

  it('returns undefined for undefined input', () => {
    expect(extractIdentifierNumber(undefined)).toBeUndefined();
  });

  it('returns undefined for URN without identifier-no segment', () => {
    expect(extractIdentifierNumber('urn:altinn:person:uuid:some-uuid')).toBeUndefined();
  });

  it('returns empty string when identifier-no: is present but value is empty', () => {
    expect(extractIdentifierNumber('urn:altinn:person:identifier-no:')).toBe('');
  });
});

// ----- mapPartiesToAuthorizedParties -----

describe('mapPartiesToAuthorizedParties', () => {
  it('maps a simple person party', () => {
    const result = mapPartiesToAuthorizedParties([person]);

    expect(result).toHaveLength(1);
    expect(result[0].partyUuid).toBe('uuid-person');
    expect(result[0].name).toBe('Ola Nordmann');
    expect(result[0].partyId).toBe(person.party);
    expect(result[0].type).toBe('Person');
    expect(result[0].isDeleted).toBe(false);
    expect(result[0].organizationNumber).toBeUndefined();
  });

  it('maps organization with organizationNumber extracted from URN', () => {
    const standaloneOrg: PartyFieldsFragment = {
      party: 'urn:altinn:organization:identifier-no:987654321',
      partyType: 'Organization',
      name: 'Enkel AS',
      isCurrentEndUser: false,
      isDeleted: false,
      hasOnlyAccessToSubParties: false,
      partyUuid: 'uuid-enkel',
      partyId: 10,
      subParties: [],
    };
    const result = mapPartiesToAuthorizedParties([standaloneOrg]);

    expect(result[0].organizationNumber).toBe('987654321');
  });

  it('nests subParties as subunits on the parent', () => {
    const result = mapPartiesToAuthorizedParties([parentOrg]);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Stor Bedrift AS');
    expect(result[0].subunits).toHaveLength(2);
    expect(result[0].subunits![0].name).toBe('Avd Oslo');
    expect(result[0].subunits![1].name).toBe('Avd Bergen');
  });

  it('subunit fields are mapped correctly', () => {
    const result = mapPartiesToAuthorizedParties([parentOrg]);
    const oslo = result[0].subunits![0];

    expect(oslo.partyUuid).toBe('uuid-child-oslo');
    expect(oslo.partyId).toBe('urn:altinn:organization:identifier-no:910000010');
    expect(oslo.type).toBe('Organization');
    expect(oslo.isDeleted).toBe(false);
    expect(oslo.organizationNumber).toBe('910000010');
  });

  it('preserves isDeleted on subunits', () => {
    const result = mapPartiesToAuthorizedParties([parentOrg]);
    const bergen = result[0].subunits![1];

    expect(bergen.isDeleted).toBe(true);
  });

  it('filters out promoted subParties from the top-level list (deduplication)', () => {
    // This simulates the flattened list from normalizeFlattenParties where
    // promotedChild appears both as a subParty of parentOrg AND as a top-level entry.
    const flatList: PartyFieldsFragment[] = [person, parentOrg, promotedChild];
    const result = mapPartiesToAuthorizedParties(flatList);

    // promotedChild has partyUuid 'uuid-child-oslo' which is in parentOrg.subParties,
    // so it should be filtered out from top level
    const topLevelIds = result.map((p) => p.partyUuid);
    expect(topLevelIds).toContain('uuid-person');
    expect(topLevelIds).toContain('uuid-parent');
    expect(topLevelIds).not.toContain('uuid-child-oslo');

    // But it still appears as a subunit of the parent
    expect(result.find((p) => p.partyUuid === 'uuid-parent')!.subunits![0].partyUuid).toBe('uuid-child-oslo');
  });

  it('maps hasOnlyAccessToSubParties to onlyHierarchyElementWithNoAccess', () => {
    const result = mapPartiesToAuthorizedParties([disabledParent]);

    expect(result[0].onlyHierarchyElementWithNoAccess).toBe(true);
  });

  it('defaults onlyHierarchyElementWithNoAccess to false when hasOnlyAccessToSubParties is false', () => {
    const result = mapPartiesToAuthorizedParties([person]);

    expect(result[0].onlyHierarchyElementWithNoAccess).toBe(false);
  });

  it('handles empty input', () => {
    expect(mapPartiesToAuthorizedParties([])).toEqual([]);
  });

  it('party with no subParties has undefined subunits', () => {
    // promotedChild has no subParties field at all (SubPartyFieldsFragment)
    // When it's NOT filtered out (no parent in the list), subunits should be undefined
    const result = mapPartiesToAuthorizedParties([promotedChild]);

    expect(result).toHaveLength(1);
    expect(result[0].subunits).toBeUndefined();
  });

  it('handles multiple parents each with their own children in a flat list', () => {
    const promotedOnlyChild: PartyFieldsFragment = {
      party: 'urn:altinn:organization:identifier-no:920000010',
      partyType: 'Organization',
      name: 'Only Child',
      isCurrentEndUser: false,
      isDeleted: false,
      hasOnlyAccessToSubParties: false,
      partyUuid: 'uuid-only-child',
      partyId: 6,
    };

    const flatList: PartyFieldsFragment[] = [person, parentOrg, promotedChild, disabledParent, promotedOnlyChild];
    const result = mapPartiesToAuthorizedParties(flatList);

    // Top level: person, parentOrg, disabledParent (promoted children filtered out)
    expect(result).toHaveLength(3);
    const topNames = result.map((p) => p.name);
    expect(topNames).toEqual(['Ola Nordmann', 'Stor Bedrift AS', 'Disabled Parent AS']);

    // Each parent has its own children nested
    expect(result[1].subunits).toHaveLength(2);
    expect(result[2].subunits).toHaveLength(1);
    expect(result[2].subunits![0].name).toBe('Only Child');
  });

  it('sets authorizedResources and authorizedRoles to empty arrays', () => {
    const result = mapPartiesToAuthorizedParties([person]);

    expect(result[0].authorizedResources).toEqual([]);
    expect(result[0].authorizedRoles).toEqual([]);
  });
});
