import { renderHook } from '@testing-library/react';
import type { PartyFieldsFragment } from 'bff-types-generated';
import { useTranslation } from 'react-i18next';
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCustomWrapper } from '../../../../utils/test-utils.tsx';
import { useParties } from '../../../api/hooks/useParties.ts';
import { buildPartyGraph } from '../../../api/utils/partyGraph.ts';
import { useProfile } from '../../../pages/Profile';
import { formatNorwegianId, formatSSN, useAccounts } from './useAccounts.tsx';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(),
}));

vi.mock('../../../api/hooks/useParties.ts', () => ({
  useParties: vi.fn(),
}));

vi.mock('../../../pages/Profile', () => ({
  useProfile: vi.fn(),
}));

// Test data from the issue description
const parties: PartyFieldsFragment[] = [
  {
    party: 'urn:altinn:person:identifier-no:1',
    partyType: 'Person',
    subParties: [],
    name: 'TEST TESTESEN',
    isCurrentEndUser: true,
    isDeleted: false,
    partyUuid: 'urn:altinn:person:uuid:test-testesen',
    partyId: 1,
    hasOnlyAccessToSubParties: false,
  },
  {
    party: 'urn:altinn:person:identifier-no:fff',
    partyType: 'Person',
    subParties: [],
    name: 'Banksi',
    isCurrentEndUser: false,
    isDeleted: false,
    partyUuid: 'urn:altinn:person:uuid:test-testesen',
    partyId: 1,
    hasOnlyAccessToSubParties: false,
  },
  {
    party: 'urn:altinn:person:identifier-no:eeee',
    partyType: 'Person',
    subParties: [],
    name: 'ANKI A',
    isCurrentEndUser: false,
    isDeleted: false,
    partyUuid: 'urn:altinn:person:uuid:test-testesen',
    partyId: 1,
    hasOnlyAccessToSubParties: false,
  },
  {
    party: 'urn:altinn:organization:identifier-no:2',
    partyType: 'Organization',
    subParties: [
      {
        party: 'urn:altinn:organization:identifier-sub:1',
        partyType: 'Organization',
        name: 'TESTBEDRIFT AS AVD SUB',
        isCurrentEndUser: false,
        partyUuid: 'urn:altinn:organization:uuid:testbedrift-avd-sub',
        isDeleted: true,
        partyId: 3,
      },
      {
        party: 'urn:altinn:organization:identifier-sub:3',
        partyType: 'Organization',
        name: 'TESTBEDRIFT AS',
        isCurrentEndUser: false,
        partyUuid: 'urn:altinn:organization:uuid:testbedrift-sub',
        isDeleted: false,
        partyId: 5,
      },
      {
        party: 'urn:altinn:organization:identifier-sub:100',
        partyType: 'Organization',
        name: 'Bavdeling A SUB',
        isCurrentEndUser: false,
        partyUuid: 'urn:altinn:organization:uuid:testbedrift-avd-oslo',
        isDeleted: false,
        partyId: 4,
      },
      {
        party: 'urn:altinn:organization:identifier-sub:2',
        partyType: 'Organization',
        name: 'Avdeling A SUB',
        isCurrentEndUser: false,
        partyUuid: 'urn:altinn:organization:uuid:testbedrift-avd-oslo',
        isDeleted: false,
        partyId: 4,
      },
    ],
    name: 'TESTBEDRIFT AS',
    isCurrentEndUser: false,
    isDeleted: true,
    partyUuid: 'urn:altinn:organization:uuid:testbedrift-main',
    hasOnlyAccessToSubParties: false,
    partyId: 6,
  },
  {
    party: 'urn:altinn:organization:identifier-no:1',
    partyType: 'Organization',
    subParties: [],
    name: 'Firma AS',
    isCurrentEndUser: true,
    isDeleted: false,
    partyUuid: 'urn:altinn:organization:uuid:firma-as',
    hasOnlyAccessToSubParties: false,
    partyId: 2,
  },
  {
    party: 'urn:altinn:organization:identifier-no:4',
    partyType: 'Organization',
    subParties: [],
    name: 'Abba AS',
    isCurrentEndUser: true,
    isDeleted: false,
    partyUuid: 'urn:altinn:organization:uuid:firma-as',
    hasOnlyAccessToSubParties: false,
    partyId: 2,
  },
];

const partiesPartyGraph = buildPartyGraph(parties);

describe('useAccounts', () => {
  const mockT = vi.fn((key: string) => key);
  const mockSetSelectedPartyIds = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useTranslation as Mock).mockReturnValue({ t: mockT });
    (useParties as Mock).mockReturnValue({
      setSelectedPartyIds: mockSetSelectedPartyIds,
      partyGraph: partiesPartyGraph,
    });
    (useProfile as Mock).mockReturnValue({ favoritesGroup: { parties: [] } });
  });

  it('should return empty state when no selected parties', () => {
    const { result } = renderHook(
      () =>
        useAccounts({
          parties,
          selectedParties: [],
          allOrganizationsSelected: false,
          isLoading: false,
        }),
      {
        wrapper: createCustomWrapper(),
      },
    );

    expect(result.current.accounts).toEqual([]);
    expect(result.current.accountGroups).toEqual({});
    expect(result.current.accountSearch).toBeUndefined();
  });

  it('should process parties correctly with selected parties', () => {
    const selectedParties = [parties[0]]; // TEST TESTESEN (current end user)

    const { result } = renderHook(
      () =>
        useAccounts({
          parties,
          selectedParties,
          allOrganizationsSelected: false,
          isLoading: false,
        }),
      {
        wrapper: createCustomWrapper(),
      },
    );

    expect(result.current.accounts.length).toBeGreaterThan(0);

    // Should have current end user account
    const endUserAccount = result.current.accounts.find((acc) => acc.isCurrentEndUser);
    expect(endUserAccount).toBeDefined();
    expect(endUserAccount?.name).toBe('TEST TESTESEN');
    expect(endUserAccount?.type).toBe('person');
    expect(endUserAccount?.badge?.label).toBe('badge.you');
  });

  it('should separate persons and organizations correctly', () => {
    const selectedParties = parties;

    const { result } = renderHook(
      () =>
        useAccounts({
          parties,
          selectedParties,
          allOrganizationsSelected: false,
          isLoading: false,
        }),
      {
        wrapper: createCustomWrapper(),
      },
    );

    const personAccounts = result.current.accounts.filter((acc) => acc.type === 'person');
    const organizationAccounts = result.current.accounts.filter((acc) => acc.type === 'company');

    // Should have persons (excluding current end user from other people)
    expect(personAccounts.length).toBeGreaterThan(0);

    // Should have organizations
    expect(organizationAccounts.length).toBeGreaterThan(0);
  });

  it('should handle deleted parties with badges', () => {
    const selectedParties = parties;

    const { result } = renderHook(
      () =>
        useAccounts({
          parties,
          selectedParties,
          allOrganizationsSelected: false,
          isLoading: false,
        }),
      {
        wrapper: createCustomWrapper(),
      },
    );

    const deletedAccounts = result.current.accounts.filter((acc) => acc.isDeleted);
    expect(deletedAccounts.length).toBeGreaterThan(0);

    for (const account of deletedAccounts) {
      expect(account.badge?.color).toBe('neutral');
      expect(account.badge?.label).toBe('badge.deleted');
    }
  });

  it('should handle options correctly', () => {
    const selectedParties = parties;
    const options = {
      showDescription: false,
      showFavorites: false,
      showGroups: true,
    };

    const { result } = renderHook(
      () =>
        useAccounts({
          parties,
          selectedParties,
          allOrganizationsSelected: false,
          isLoading: false,
          options,
        }),
      {
        wrapper: createCustomWrapper(),
      },
    );

    // When showDescription is false, accounts should not have descriptions
    const accountsWithDescription = result.current.accounts.filter((acc) => acc.description);
    expect(accountsWithDescription.length).toBe(0);
  });
});

/**
 * Dedicated fixtures for parent/child relationship tests.
 *
 * These simulate the output of normalizeFlattenParties — a flat list where:
 * - Parent orgs appear with their subParties array intact
 * - SubParties are promoted to top-level entries WITHOUT a subParties array
 */
const parentOrg: PartyFieldsFragment = {
  party: 'urn:altinn:organization:identifier-no:100000001',
  partyType: 'Organization',
  subParties: [
    {
      party: 'urn:altinn:organization:identifier-no:100000010',
      partyType: 'Organization',
      name: 'Child Org Alpha',
      isCurrentEndUser: false,
      isDeleted: false,
      partyUuid: 'uuid-child-alpha',
      partyId: 11,
    },
    {
      party: 'urn:altinn:organization:identifier-no:100000011',
      partyType: 'Organization',
      name: 'Child Org Beta',
      isCurrentEndUser: false,
      isDeleted: false,
      partyUuid: 'uuid-child-beta',
      partyId: 12,
    },
  ],
  name: 'Parent Org',
  isCurrentEndUser: false,
  isDeleted: false,
  hasOnlyAccessToSubParties: false,
  partyUuid: 'uuid-parent-org',
  partyId: 10,
};

const disabledParentOrg: PartyFieldsFragment = {
  party: 'urn:altinn:organization:identifier-no:100000099',
  partyType: 'Organization',
  subParties: [
    {
      party: 'urn:altinn:organization:identifier-no:100000098',
      partyType: 'Organization',
      name: 'Only Child',
      isCurrentEndUser: false,
      isDeleted: false,
      partyUuid: 'uuid-only-child',
      partyId: 21,
    },
  ],
  name: 'Disabled Parent',
  isCurrentEndUser: false,
  isDeleted: false,
  hasOnlyAccessToSubParties: true,
  partyUuid: 'uuid-disabled-parent',
  partyId: 20,
};

// Promoted subParties as they appear in the flat list (no subParties field)
const promotedChildAlpha: PartyFieldsFragment = {
  party: 'urn:altinn:organization:identifier-no:100000010',
  partyType: 'Organization',
  name: 'Child Org Alpha',
  isCurrentEndUser: false,
  isDeleted: false,
  hasOnlyAccessToSubParties: false,
  partyUuid: 'uuid-child-alpha',
  partyId: 11,
};

const promotedChildBeta: PartyFieldsFragment = {
  party: 'urn:altinn:organization:identifier-no:100000011',
  partyType: 'Organization',
  name: 'Child Org Beta',
  isCurrentEndUser: false,
  isDeleted: false,
  hasOnlyAccessToSubParties: false,
  partyUuid: 'uuid-child-beta',
  partyId: 12,
};

const promotedOnlyChild: PartyFieldsFragment = {
  party: 'urn:altinn:organization:identifier-no:100000098',
  partyType: 'Organization',
  name: 'Only Child',
  isCurrentEndUser: false,
  isDeleted: false,
  hasOnlyAccessToSubParties: false,
  partyUuid: 'uuid-only-child',
  partyId: 21,
};

const standaloneOrg: PartyFieldsFragment = {
  party: 'urn:altinn:organization:identifier-no:200000001',
  partyType: 'Organization',
  subParties: [],
  name: 'Standalone Org',
  isCurrentEndUser: false,
  isDeleted: false,
  hasOnlyAccessToSubParties: false,
  partyUuid: 'uuid-standalone',
  partyId: 30,
};

const endUserPerson: PartyFieldsFragment = {
  party: 'urn:altinn:person:identifier-no:01010112345',
  partyType: 'Person',
  subParties: [],
  name: 'Ola Nordmann',
  isCurrentEndUser: true,
  isDeleted: false,
  hasOnlyAccessToSubParties: false,
  partyUuid: 'uuid-enduser',
  partyId: 1,
};

// Flat list simulating normalizeFlattenParties output
const relationshipParties: PartyFieldsFragment[] = [
  endUserPerson,
  parentOrg,
  promotedChildAlpha,
  promotedChildBeta,
  disabledParentOrg,
  promotedOnlyChild,
  standaloneOrg,
];

const relationshipPartyGraph = buildPartyGraph(relationshipParties);

describe('useAccounts — parent/child relationship resolution', () => {
  const mockT = vi.fn((key: string) => key);
  const mockSetSelectedPartyIds = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useTranslation as Mock).mockReturnValue({ t: mockT });
    (useParties as Mock).mockReturnValue({
      setSelectedPartyIds: mockSetSelectedPartyIds,
      partyGraph: relationshipPartyGraph,
    });
    (useProfile as Mock).mockReturnValue({ favoritesGroup: { parties: [] } });
  });

  const renderAccounts = (overrides?: Partial<Parameters<typeof useAccounts>[0]>) =>
    renderHook(
      () =>
        useAccounts({
          parties: relationshipParties,
          selectedParties: [endUserPerson],
          allOrganizationsSelected: false,
          isLoading: false,
          ...overrides,
        }),
      { wrapper: createCustomWrapper() },
    );

  it('marks parent orgs with isParent: true', () => {
    const { result } = renderAccounts();
    const orgAccounts = result.current.accounts.filter((a) => a.type === 'company');

    const parentAccount = orgAccounts.find((a) => a.id === parentOrg.party);
    expect(parentAccount).toBeDefined();
    expect(parentAccount!.isParent).toBe(true);
  });

  it('marks promoted subParties with isParent: false', () => {
    const { result } = renderAccounts();
    const orgAccounts = result.current.accounts.filter((a) => a.type === 'company');

    const childAlphaAccount = orgAccounts.find((a) => a.id === promotedChildAlpha.party);
    expect(childAlphaAccount).toBeDefined();
    expect(childAlphaAccount!.isParent).toBe(false);
  });

  it('sets parentId on children to the parent party URN', () => {
    const { result } = renderAccounts();
    const orgAccounts = result.current.accounts.filter((a) => a.type === 'company');

    const childAlpha = orgAccounts.find((a) => a.id === promotedChildAlpha.party);
    const childBeta = orgAccounts.find((a) => a.id === promotedChildBeta.party);

    expect(childAlpha!.parentId).toBe(parentOrg.party);
    expect(childBeta!.parentId).toBe(parentOrg.party);
  });

  it('sets parentName on children to the parent name', () => {
    const { result } = renderAccounts();
    const orgAccounts = result.current.accounts.filter((a) => a.type === 'company');

    const childAlpha = orgAccounts.find((a) => a.id === promotedChildAlpha.party);
    expect(childAlpha!.parentName).toBe('Parent Org');
  });

  it('sets groupId on children to the parent party URN', () => {
    const { result } = renderAccounts();
    const orgAccounts = result.current.accounts.filter((a) => a.type === 'company');

    const childAlpha = orgAccounts.find((a) => a.id === promotedChildAlpha.party);
    const childBeta = orgAccounts.find((a) => a.id === promotedChildBeta.party);

    expect(childAlpha!.groupId).toBe(parentOrg.party);
    expect(childBeta!.groupId).toBe(parentOrg.party);
  });

  it('standalone org with empty subParties array is NOT a parent (isParent: false), no parentId, groupId equals own party', () => {
    // With PartyGraph: empty subParties means no children → isParent: false.
    // This fixes the old behavior where Array.isArray([]) was true.
    const { result } = renderAccounts();
    const orgAccounts = result.current.accounts.filter((a) => a.type === 'company');

    const standalone = orgAccounts.find((a) => a.id === standaloneOrg.party);
    expect(standalone).toBeDefined();
    expect(standalone!.isParent).toBe(false);
    expect(standalone!.parentId).toBeUndefined();
    expect(standalone!.groupId).toBe(standaloneOrg.party);
  });

  it('parent with hasOnlyAccessToSubParties is disabled', () => {
    const { result } = renderAccounts();
    const orgAccounts = result.current.accounts.filter((a) => a.type === 'company');

    const disabled = orgAccounts.find((a) => a.id === disabledParentOrg.party);
    expect(disabled).toBeDefined();
    expect(disabled!.disabled).toBe(true);
  });

  it('child description contains ↳ and partOf with parent name', () => {
    const { result } = renderAccounts();
    const orgAccounts = result.current.accounts.filter((a) => a.type === 'company');

    const childAlpha = orgAccounts.find((a) => a.id === promotedChildAlpha.party);
    expect(childAlpha!.description).toBeDefined();
    expect(childAlpha!.description).toContain('↳');
    expect(childAlpha!.description).toContain('Parent Org');
  });

  it('parent description does NOT contain ↳', () => {
    const { result } = renderAccounts();
    const orgAccounts = result.current.accounts.filter((a) => a.type === 'company');

    const parent = orgAccounts.find((a) => a.id === parentOrg.party);
    expect(parent!.description).toBeDefined();
    expect(parent!.description).not.toContain('↳');
  });
});

describe('useAccounts — organization sort order', () => {
  const mockT = vi.fn((key: string) => key);
  const mockSetSelectedPartyIds = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useTranslation as Mock).mockReturnValue({ t: mockT });
    (useParties as Mock).mockReturnValue({
      setSelectedPartyIds: mockSetSelectedPartyIds,
      partyGraph: relationshipPartyGraph,
    });
    (useProfile as Mock).mockReturnValue({ favoritesGroup: { parties: [] } });
  });

  it('parents are sorted alphabetically, children grouped under their parent and sorted within', () => {
    const { result } = renderHook(
      () =>
        useAccounts({
          parties: relationshipParties,
          selectedParties: [endUserPerson],
          allOrganizationsSelected: false,
          isLoading: false,
        }),
      { wrapper: createCustomWrapper() },
    );

    const orgAccounts = result.current.accounts.filter((a) => a.type === 'company');
    const orgNames = orgAccounts.map((a) => a.name);

    // Parents sorted alphabetically: "Disabled Parent" before "Parent Org"
    // Children grouped under their parent, sorted within the group
    // Standalone orgs (no parent, not a parent) come after grouped entries

    const disabledParentIdx = orgNames.indexOf('Disabled Parent');
    const onlyChildIdx = orgNames.indexOf('Only Child');
    const parentOrgIdx = orgNames.indexOf('Parent Org');
    const childAlphaIdx = orgNames.indexOf('Child Org Alpha');
    const childBetaIdx = orgNames.indexOf('Child Org Beta');
    const standaloneIdx = orgNames.indexOf('Standalone Org');

    // Disabled Parent comes before Parent Org (alphabetical parents)
    expect(disabledParentIdx).toBeLessThan(parentOrgIdx);

    // Only Child comes right after Disabled Parent
    expect(onlyChildIdx).toBe(disabledParentIdx + 1);

    // Children come after their parent
    expect(childAlphaIdx).toBeGreaterThan(parentOrgIdx);
    expect(childBetaIdx).toBeGreaterThan(parentOrgIdx);

    // Children are sorted alphabetically within their group
    expect(childAlphaIdx).toBeLessThan(childBetaIdx);

    // Standalone org comes after all grouped entries
    expect(standaloneIdx).toBeGreaterThan(childBetaIdx);
  });
});

describe('useAccounts — person accounts sort order', () => {
  const mockT = vi.fn((key: string) => key);
  const mockSetSelectedPartyIds = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useTranslation as Mock).mockReturnValue({ t: mockT });
    (useParties as Mock).mockReturnValue({
      setSelectedPartyIds: mockSetSelectedPartyIds,
      partyGraph: partiesPartyGraph,
    });
    (useProfile as Mock).mockReturnValue({ favoritesGroup: { parties: [] } });
  });

  it('other people (not current end user) are sorted alphabetically by name', () => {
    const { result } = renderHook(
      () =>
        useAccounts({
          parties,
          selectedParties: [parties[0]],
          allOrganizationsSelected: false,
          isLoading: false,
        }),
      { wrapper: createCustomWrapper() },
    );

    const personAccounts = result.current.accounts.filter((a) => a.type === 'person' && !a.isCurrentEndUser);
    const names = personAccounts.map((a) => a.name);

    // ANKI A should come before Banksi (alphabetical)
    expect(names.indexOf('ANKI A')).toBeLessThan(names.indexOf('Banksi'));
  });
});

describe('useAccounts — currentAccountName', () => {
  const mockT = vi.fn((key: string) => key);
  const mockSetSelectedPartyIds = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useTranslation as Mock).mockReturnValue({ t: mockT });
    (useParties as Mock).mockReturnValue({
      setSelectedPartyIds: mockSetSelectedPartyIds,
      partyGraph: partiesPartyGraph,
    });
    (useProfile as Mock).mockReturnValue({ favoritesGroup: { parties: [] } });
  });

  it('returns selected party name when a single party is selected', () => {
    const { result } = renderHook(
      () =>
        useAccounts({
          parties,
          selectedParties: [parties[0]],
          allOrganizationsSelected: false,
          isLoading: false,
        }),
      { wrapper: createCustomWrapper() },
    );

    expect(result.current.currentAccountName).toBe('TEST TESTESEN');
  });

  it('returns "all organizations" label when allOrganizationsSelected is true', () => {
    const { result } = renderHook(
      () =>
        useAccounts({
          parties,
          selectedParties: parties.filter((p) => p.partyType === 'Organization'),
          allOrganizationsSelected: true,
          isLoading: false,
        }),
      { wrapper: createCustomWrapper() },
    );

    expect(result.current.currentAccountName).toBe('parties.labels.all_organizations');
  });
});

describe('formatSSN', () => {
  it('should format SSN correctly without masking', () => {
    const result = formatSSN('12345678901', false);
    expect(result).toBe('123456\u200978901');
  });

  it('should format SSN correctly with masking', () => {
    const result = formatSSN('12345678901', true);
    expect(result).toBe('123456\u2009XXXXX');
  });
});

describe('formatNorwegianId', () => {
  it('should format person identifier correctly without masking for current user', () => {
    const result = formatNorwegianId('urn:altinn:person:identifier-no:12345678901', true);
    expect(result).toBe('123456\u200978901');
  });

  it('should format person identifier correctly with masking for non-current user', () => {
    const result = formatNorwegianId('urn:altinn:person:identifier-no:12345678901', false);
    expect(result).toBe('123456\u2009XXXXX');
  });

  it('should format organization identifier correctly', () => {
    const result = formatNorwegianId('urn:altinn:organization:identifier-no:123456789', false);
    expect(result).toBe('123\u2009456\u2009789');
  });

  it('should return empty string for invalid format', () => {
    const result = formatNorwegianId('invalid-format', false);
    expect(result).toBe('');
  });

  it('should return empty string when no identifier found', () => {
    const result = formatNorwegianId('urn:altinn:person:identifier-no:', false);
    expect(result).toBe('');
  });
});
