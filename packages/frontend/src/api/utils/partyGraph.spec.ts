import type { PartyFieldsFragment } from 'bff-types-generated';
import { describe, expect, it } from 'vitest';
import { buildPartyGraph } from './partyGraph.ts';

/**
 * Fixtures simulate the output of normalizeFlattenParties:
 * - Parents appear with their subParties array intact
 * - SubParties are promoted to top-level entries (without subParties field)
 */

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
      partyUuid: 'uuid-org-sub-1',
      partyId: 3,
    },
    {
      party: 'urn:altinn:organization:identifier-no:910000003',
      partyType: 'Organization',
      name: 'Stor Bedrift Avd Bergen',
      isCurrentEndUser: false,
      isDeleted: false,
      partyUuid: 'uuid-org-sub-2',
      partyId: 4,
    },
  ],
};

// Promoted sub-parties (as normalizeFlattenParties produces)
const promotedSub1: PartyFieldsFragment = {
  party: 'urn:altinn:organization:identifier-no:910000002',
  partyType: 'Organization',
  name: 'Stor Bedrift Avd Oslo',
  isCurrentEndUser: false,
  isDeleted: false,
  hasOnlyAccessToSubParties: false,
  partyUuid: 'uuid-org-sub-1',
  partyId: 3,
};

const promotedSub2: PartyFieldsFragment = {
  party: 'urn:altinn:organization:identifier-no:910000003',
  partyType: 'Organization',
  name: 'Stor Bedrift Avd Bergen',
  isCurrentEndUser: false,
  isDeleted: false,
  hasOnlyAccessToSubParties: false,
  partyUuid: 'uuid-org-sub-2',
  partyId: 4,
};

const standaloneOrg: PartyFieldsFragment = {
  party: 'urn:altinn:organization:identifier-no:920000001',
  partyType: 'Organization',
  name: 'Standalone AS',
  isCurrentEndUser: false,
  isDeleted: false,
  hasOnlyAccessToSubParties: false,
  partyUuid: 'uuid-standalone',
  partyId: 5,
  subParties: [],
};

const disabledParent: PartyFieldsFragment = {
  party: 'urn:altinn:organization:identifier-no:930000001',
  partyType: 'Organization',
  name: 'Disabled Parent AS',
  isCurrentEndUser: false,
  isDeleted: false,
  hasOnlyAccessToSubParties: true,
  partyUuid: 'uuid-disabled',
  partyId: 6,
  subParties: [
    {
      party: 'urn:altinn:organization:identifier-no:930000002',
      partyType: 'Organization',
      name: 'Only Child',
      isCurrentEndUser: false,
      isDeleted: false,
      partyUuid: 'uuid-only-child',
      partyId: 7,
    },
  ],
};

const promotedOnlyChild: PartyFieldsFragment = {
  party: 'urn:altinn:organization:identifier-no:930000002',
  partyType: 'Organization',
  name: 'Only Child',
  isCurrentEndUser: false,
  isDeleted: false,
  hasOnlyAccessToSubParties: false,
  partyUuid: 'uuid-only-child',
  partyId: 7,
};

// Full flat list as normalizeFlattenParties would produce
const flatList: PartyFieldsFragment[] = [
  endUser,
  parentOrg,
  promotedSub1,
  promotedSub2,
  standaloneOrg,
  disabledParent,
  promotedOnlyChild,
];

describe('buildPartyGraph', () => {
  const graph = buildPartyGraph(flatList);

  describe('deduplication', () => {
    it('deduplicates promoted sub-parties that share URN with nested entries', () => {
      // parentOrg has 2 subs, disabledParent has 1. Plus endUser, parentOrg, standaloneOrg, disabledParent = 7 unique
      expect(graph.parties).toHaveLength(7);
    });

    it('partyByUrn has one entry per unique URN', () => {
      expect(graph.partyByUrn.size).toBe(7);
    });
  });

  describe('lookup maps', () => {
    it('finds party by URN', () => {
      const p = graph.partyByUrn.get('urn:altinn:organization:identifier-no:910000002');
      expect(p).toBeDefined();
      expect(p!.name).toBe('Stor Bedrift Avd Oslo');
    });

    it('finds party by UUID', () => {
      const p = graph.partyByUuid.get('uuid-org-parent');
      expect(p).toBeDefined();
      expect(p!.name).toBe('Stor Bedrift AS');
    });

    it('returns undefined for unknown URN', () => {
      expect(graph.partyByUrn.get('urn:altinn:organization:identifier-no:999999999')).toBeUndefined();
    });
  });

  describe('currentEndUser', () => {
    it('identifies the current end user', () => {
      expect(graph.currentEndUser).toBeDefined();
      expect(graph.currentEndUser!.name).toBe('Ola Nordmann');
      expect(graph.currentEndUser!.isCurrentEndUser).toBe(true);
    });
  });

  describe('parent/child relationships', () => {
    it('marks parent org as isParent: true', () => {
      const p = graph.partyByUrn.get(parentOrg.party)!;
      expect(p.isParent).toBe(true);
    });

    it('parent has correct subParties references', () => {
      const p = graph.partyByUrn.get(parentOrg.party)!;
      expect(p.subParties).toHaveLength(2);
      expect(p.subParties.map((s) => s.name).sort()).toEqual(['Stor Bedrift Avd Bergen', 'Stor Bedrift Avd Oslo']);
    });

    it('children reference their parent', () => {
      const child = graph.partyByUrn.get('urn:altinn:organization:identifier-no:910000002')!;
      expect(child.parentParty).toBeDefined();
      expect(child.parentParty!.party).toBe(parentOrg.party);
    });

    it('children are not marked as parents', () => {
      const child = graph.partyByUrn.get('urn:altinn:organization:identifier-no:910000002')!;
      expect(child.isParent).toBe(false);
      expect(child.subParties).toEqual([]);
    });

    it('standalone org with empty subParties is NOT a parent', () => {
      const p = graph.partyByUrn.get(standaloneOrg.party)!;
      expect(p.isParent).toBe(false);
      expect(p.parentParty).toBeUndefined();
      expect(p.subParties).toEqual([]);
    });

    it('disabled parent (hasOnlyAccessToSubParties) is still marked as parent', () => {
      const p = graph.partyByUrn.get(disabledParent.party)!;
      expect(p.isParent).toBe(true);
      expect(p.hasOnlyAccessToSubParties).toBe(true);
      expect(p.subParties).toHaveLength(1);
    });

    it('child of disabled parent references back', () => {
      const child = graph.partyByUrn.get('urn:altinn:organization:identifier-no:930000002')!;
      expect(child.parentParty).toBeDefined();
      expect(child.parentParty!.party).toBe(disabledParent.party);
    });
  });

  describe('derived fields', () => {
    it('sets isPerson for Person type', () => {
      expect(graph.currentEndUser!.isPerson).toBe(true);
      expect(graph.currentEndUser!.isOrganization).toBe(false);
    });

    it('sets isOrganization for Organization type', () => {
      const org = graph.partyByUrn.get(parentOrg.party)!;
      expect(org.isOrganization).toBe(true);
      expect(org.isPerson).toBe(false);
    });

    it('sets isPerson for SelfIdentified type', () => {
      const selfId: PartyFieldsFragment = {
        party: 'urn:altinn:person:identifier-no:99999999999',
        partyType: 'SelfIdentified',
        name: 'Self User',
        isCurrentEndUser: true,
        isDeleted: false,
        hasOnlyAccessToSubParties: false,
        partyUuid: 'uuid-self',
        partyId: 99,
      };
      const g = buildPartyGraph([selfId]);
      expect(g.parties[0].isPerson).toBe(true);
      expect(g.parties[0].isOrganization).toBe(false);
    });
  });

  describe('referential integrity', () => {
    it('parent.subParties[i] is the same object as partyByUrn.get(urn)', () => {
      const parent = graph.partyByUrn.get(parentOrg.party)!;
      for (const child of parent.subParties) {
        expect(child).toBe(graph.partyByUrn.get(child.party));
      }
    });

    it('child.parentParty is the same object as partyByUrn.get(parentUrn)', () => {
      const child = graph.partyByUrn.get('urn:altinn:organization:identifier-no:910000002')!;
      expect(child.parentParty).toBe(graph.partyByUrn.get(parentOrg.party));
    });
  });

  describe('empty input', () => {
    it('handles empty party list', () => {
      const g = buildPartyGraph([]);
      expect(g.parties).toEqual([]);
      expect(g.partyByUrn.size).toBe(0);
      expect(g.partyByUuid.size).toBe(0);
      expect(g.currentEndUser).toBeUndefined();
    });
  });
});
