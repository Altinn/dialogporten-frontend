import { renderHook } from '@testing-library/react';
import type { PartyFieldsFragment } from 'bff-types-generated';
import { act } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useAccountFilters } from './useAccountFilters.tsx';

vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(() => ({ t: (key: string) => key })),
}));

const makeParty = (overrides: Partial<PartyFieldsFragment> = {}): PartyFieldsFragment =>
  ({
    party: 'urn:altinn:person:identifier-no:1',
    partyType: 'Person',
    name: 'Ola Nordmann',
    ...overrides,
  }) as PartyFieldsFragment;

const parties: PartyFieldsFragment[] = [
  makeParty({ party: 'urn:altinn:person:identifier-no:1', partyType: 'Person', name: 'Ola Nordmann' }),
  makeParty({ party: 'urn:altinn:person:identifier-no:2', partyType: 'Person', name: 'Kari Nordmann' }),
  makeParty({ party: 'urn:altinn:organization:identifier-no:100', partyType: 'Organization', name: 'Nav Kommune' }),
  makeParty({ party: 'urn:altinn:organization:identifier-no:200', partyType: 'Organization', name: 'Oslo Kommune' }),
];

describe('useAccountFilters', () => {
  it('includes all parties by default', () => {
    const { result } = renderHook(() => useAccountFilters({ searchValue: '', parties }));
    expect(result.current.filteredParties).toHaveLength(4);
    expect(result.current.isSearching).toBe(false);
  });

  it('filters to persons only', () => {
    const { result } = renderHook(() => useAccountFilters({ searchValue: '', parties }));

    act(() => {
      result.current.setFilterState({ partyScope: ['PERSONS'] });
    });

    expect(result.current.filteredParties.every((p) => p.partyType !== 'Organization')).toBe(true);
    expect(result.current.filteredParties).toHaveLength(2);
    expect(result.current.isSearching).toBe(true);
  });

  it('filters to companies only', () => {
    const { result } = renderHook(() => useAccountFilters({ searchValue: '', parties }));

    act(() => {
      result.current.setFilterState({ partyScope: ['COMPANIES'] });
    });

    expect(result.current.filteredParties.every((p) => p.partyType === 'Organization')).toBe(true);
    expect(result.current.filteredParties).toHaveLength(2);
  });

  it('filters by search value matching the name (case-insensitive)', () => {
    const { result } = renderHook(({ searchValue }) => useAccountFilters({ searchValue, parties }), {
      initialProps: { searchValue: 'nordmann' },
    });

    expect(result.current.filteredParties.map((p) => p.name)).toEqual(['Ola Nordmann', 'Kari Nordmann']);
  });

  it('filters by search value matching the party urn', () => {
    const { result } = renderHook(({ searchValue }) => useAccountFilters({ searchValue, parties }), {
      initialProps: { searchValue: '100' },
    });

    expect(result.current.filteredParties.map((p) => p.name)).toEqual(['Nav Kommune']);
  });

  it('combines scope filter and search value', () => {
    const { result } = renderHook(({ searchValue }) => useAccountFilters({ searchValue, parties }), {
      initialProps: { searchValue: 'kommune' },
    });

    act(() => {
      result.current.setFilterState({ partyScope: ['PERSONS'] });
    });

    expect(result.current.filteredParties).toHaveLength(0);
  });

  it('returns no results for a search value matching nothing', () => {
    const { result } = renderHook(({ searchValue }) => useAccountFilters({ searchValue, parties }), {
      initialProps: { searchValue: 'nonexistent' },
    });

    expect(result.current.filteredParties).toEqual([]);
  });

  describe('getFilterLabel', () => {
    it('returns the all-parties label by default', () => {
      const { result } = renderHook(() => useAccountFilters({ searchValue: '', parties }));
      expect(result.current.getFilterLabel?.('partyScope', undefined)).toBe('parties.filter.all_parties');
    });

    it('returns a joined label for selected scopes', () => {
      const { result } = renderHook(() => useAccountFilters({ searchValue: '', parties }));

      act(() => {
        result.current.setFilterState({ partyScope: ['PERSONS', 'COMPANIES'] });
      });

      expect(result.current.getFilterLabel?.('partyScope', undefined)).toBe(
        'parties.filter.persons, parties.filter.companies',
      );
    });
  });
});
