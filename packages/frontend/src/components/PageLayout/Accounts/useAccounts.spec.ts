import { renderHook } from '@testing-library/react';
import type { PartyFieldsFragment } from 'bff-types-generated';
import { useTranslation } from 'react-i18next';
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCustomWrapper } from '../../../../utils/test-utils.tsx';
import { useParties } from '../../../api/hooks/useParties.ts';
import { useProfile } from '../../../pages/Profile';
import { PageRoutes } from '../../../pages/routes.ts';
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

describe('useAccounts', () => {
  const mockT = vi.fn((key: string) => key);
  const mockSetSelectedPartyIds = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    (useTranslation as Mock).mockReturnValue({ t: mockT });
    (useParties as Mock).mockReturnValue({ setSelectedPartyIds: mockSetSelectedPartyIds });
    (useProfile as Mock).mockReturnValue({ favoritesGroup: { parties: [] } });
  });

  it('should return loading state when isLoading is true', () => {
    const { result } = renderHook(
      () =>
        useAccounts({
          parties: [],
          selectedParties: [],
          allOrganizationsSelected: false,
          isLoading: true,
        }),
      {
        wrapper: createCustomWrapper(),
      },
    );

    expect(result.current.accounts).toHaveLength(1);
    expect(result.current.accounts[0].loading).toBe(true);
    expect(result.current.accountGroups).toEqual({ loading: { title: 'profile.accounts.loading' } });
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
      expect(account.badge?.color).toBe('danger');
      expect(account.badge?.label).toBe('badge.deleted');
    }
  });

  it('should provide search functionality when parties count exceeds threshold', () => {
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

    // Should provide search when parties > 2
    expect(result.current.accountSearch).toBeDefined();
    expect(result.current.accountSearch?.placeholder).toBe('parties.search');
    expect(result.current.filterAccount).toBeDefined();
  });

  it('should handle onSelectAccount correctly', () => {
    const selectedParties = [parties[0]];

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

    // Test selecting an account
    result.current.onSelectAccount('urn:altinn:person:identifier-no:1', PageRoutes.inbox);

    expect(mockSetSelectedPartyIds).toHaveBeenCalledWith(['urn:altinn:person:identifier-no:1'], false);
  });

  it('should handle all organizations selection', () => {
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

    // Test selecting all organizations
    result.current.onSelectAccount('ALL', PageRoutes.inbox);

    expect(mockSetSelectedPartyIds).toHaveBeenCalledWith([], true);
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
