import { act, renderHook } from '@testing-library/react';
import type { SavedSearchesFieldsFragment } from 'bff-types-generated';
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCustomWrapper } from '../../../tests/test-utils.tsx';
import {
  convertFilterStateToFilters,
  convertFiltersToFilterState,
  filterSavedSearches,
  useSavedSearches,
} from './useSavedSearches.tsx';

vi.mock('react-i18next', () => ({
  useTranslation: vi.fn(() => ({ t: (key: string) => key })),
}));

const mockOpenSnackbar = vi.fn();
vi.mock('@altinn/altinn-components', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@altinn/altinn-components')>();
  return { ...actual, useSnackbar: () => ({ openSnackbar: mockOpenSnackbar }) };
});

vi.mock('../../api/hooks/useParties.ts', () => ({
  useParties: vi.fn(() => ({
    currentEndUser: { party: 'urn:altinn:person:identifier-no:1' },
    setSelectedPartyIds: vi.fn(),
    partyGraph: { partyByUrn: new Map() },
  })),
}));

vi.mock('../../api/hooks/useServiceResource.ts', () => ({
  useServiceResource: vi.fn(() => ({ serviceResourceById: new Map() })),
}));

vi.mock('../Inbox/useOrganizations.ts', () => ({
  useOrganizations: vi.fn(() => ({ organizations: [] })),
}));

vi.mock('../../i18n/useDateFnsLocale.tsx', () => ({
  useDateFnsLocale: vi.fn(() => ({ locale: {} })),
  useFormatDistance: vi.fn(() => () => 'some time ago'),
}));

vi.mock('../../hooks/useErrorLogger', () => ({
  useErrorLogger: () => ({ logError: vi.fn() }),
}));

vi.mock('../../analytics/analytics.ts', () => ({
  Analytics: { trackEvent: vi.fn() },
}));

vi.mock('../../featureFlags', () => ({
  FeatureFlagProvider: ({ children }: { children: React.ReactNode }) => children,
  useFeatureFlag: () => false,
}));

const mockCreateSavedSearch = vi.fn();
const mockDeleteSavedSearch = vi.fn();
const mockUpdateSavedSearch = vi.fn();
const mockFetchSavedSearches = vi.fn();

vi.mock('../../api/queries.ts', () => ({
  createSavedSearch: (...args: unknown[]) => mockCreateSavedSearch(...args),
  deleteSavedSearch: (...args: unknown[]) => mockDeleteSavedSearch(...args),
  updateSavedSearch: (...args: unknown[]) => mockUpdateSavedSearch(...args),
  fetchSavedSearches: (...args: unknown[]) => mockFetchSavedSearches(...args),
}));

vi.mock('../../auth/useAuthenticatedQuery.tsx', () => ({
  useAuthenticatedQuery: vi.fn(),
}));

import { useAuthenticatedQuery } from '../../auth/useAuthenticatedQuery.tsx';

const makeSavedSearch = (overrides: Partial<SavedSearchesFieldsFragment> = {}): SavedSearchesFieldsFragment => ({
  id: 1,
  name: 'My search',
  createdAt: '1700000000000',
  updatedAt: '1700000000000',
  data: {
    urn: ['urn:altinn:person:identifier-no:1'],
    filters: [],
    searchString: '',
    fromView: '/',
  },
  ...overrides,
});

const savedSearches: SavedSearchesFieldsFragment[] = [
  makeSavedSearch({ id: 1, name: 'Personal search', updatedAt: '1700000000000' }),
  makeSavedSearch({
    id: 2,
    name: 'Org search',
    updatedAt: '1700000001000',
    data: {
      urn: ['urn:altinn:organization:identifier-no:123'],
      filters: [{ id: 'status', value: 'REQUIRES_ATTENTION' }],
      searchString: 'hello',
      fromView: '/',
    },
  }),
  makeSavedSearch({
    id: 3,
    name: 'All orgs search',
    updatedAt: '1700000002000',
    data: {
      urn: ['urn:altinn:person:identifier-no:1', 'urn:altinn:organization:identifier-no:123'],
      filters: [],
      searchString: '',
      fromView: '/sent',
    },
  }),
];

describe('convertFilterStateToFilters', () => {
  it('converts a FilterState with arrays to flat list of filters', () => {
    const result = convertFilterStateToFilters({
      status: ['REQUIRES_ATTENTION', 'IN_PROGRESS'],
      org: ['nav'],
    });
    expect(result).toEqual([
      { id: 'status', value: 'REQUIRES_ATTENTION' },
      { id: 'status', value: 'IN_PROGRESS' },
      { id: 'org', value: 'nav' },
    ]);
  });

  it('returns empty array for empty state', () => {
    expect(convertFilterStateToFilters({})).toEqual([]);
  });

  it('skips non-array values', () => {
    // FilterState allows non-array values; function should skip them
    const result = convertFilterStateToFilters({ search: 'hello' } as never);
    expect(result).toEqual([]);
  });
});

describe('convertFiltersToFilterState', () => {
  it('groups filters by id into arrays', () => {
    const result = convertFiltersToFilterState([
      { id: 'status', value: 'REQUIRES_ATTENTION' },
      { id: 'status', value: 'IN_PROGRESS' },
      { id: 'org', value: 'nav' },
    ]);
    expect(result).toEqual({
      status: ['REQUIRES_ATTENTION', 'IN_PROGRESS'],
      org: ['nav'],
    });
  });

  it('returns empty object for null/undefined input', () => {
    expect(convertFiltersToFilterState(null)).toEqual({});
    expect(convertFiltersToFilterState(undefined)).toEqual({});
    expect(convertFiltersToFilterState([])).toEqual({});
  });

  it('skips filters with missing id or value', () => {
    const result = convertFiltersToFilterState([
      { id: 'status', value: 'OK' },
      { id: null, value: 'bad' },
      { id: 'org', value: null },
      null,
    ]);
    expect(result).toEqual({ status: ['OK'] });
  });

  it('is the inverse of convertFilterStateToFilters for standard input', () => {
    const original = { status: ['REQUIRES_ATTENTION', 'IN_PROGRESS'], org: ['nav'] };
    const roundTripped = convertFiltersToFilterState(convertFilterStateToFilters(original));
    expect(roundTripped).toEqual(original);
  });
});

describe('filterSavedSearches', () => {
  it('includes searches whose urn matches a selected party', () => {
    const result = filterSavedSearches(savedSearches, ['urn:altinn:person:identifier-no:1']);
    const ids = result.map((s) => s.id);
    expect(ids).toContain(1); // personal search with matching urn
  });

  it('includes searches with empty urn (global searches)', () => {
    const globalSearch = makeSavedSearch({ id: 99, data: { urn: [], filters: [], searchString: '', fromView: '/' } });
    const result = filterSavedSearches([globalSearch], ['urn:altinn:person:identifier-no:1']);
    expect(result).toHaveLength(1);
  });

  it('excludes searches whose urn does not match any selected party', () => {
    const result = filterSavedSearches(savedSearches, ['urn:altinn:organization:identifier-no:999']);
    const ids = result.map((s) => s.id);
    expect(ids).not.toContain(1); // personal search for different party
  });

  it('returns empty array when given empty input', () => {
    expect(filterSavedSearches([], ['urn:altinn:person:identifier-no:1'])).toEqual([]);
  });
});

describe('useSavedSearches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setupAuthQuery = (overrides: Record<string, unknown> = {}) => {
    (useAuthenticatedQuery as Mock).mockReturnValue({
      data: { savedSearches },
      isLoading: false,
      isSuccess: true,
      ...overrides,
    });
  };

  it('returns loading state with placeholder items', () => {
    (useAuthenticatedQuery as Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      isSuccess: false,
    });

    const { result } = renderHook(() => useSavedSearches(['urn:altinn:person:identifier-no:1']), {
      wrapper: createCustomWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.items).toHaveLength(3);
    expect(result.current.items[0].id).toMatch(/^loading-/);
  });

  it('returns empty state when successful but no saved searches', () => {
    setupAuthQuery({ data: { savedSearches: [] } });

    const { result } = renderHook(() => useSavedSearches(['urn:altinn:person:identifier-no:1']), {
      wrapper: createCustomWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.items).toEqual([]);
    expect(result.current.description).toBe('savedSearches.noSearchesFound');
  });

  it('returns sorted items when data is available', () => {
    setupAuthQuery();

    const { result } = renderHook(() => useSavedSearches(['urn:altinn:person:identifier-no:1']), {
      wrapper: createCustomWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.items.length).toBe(savedSearches.length);
    // Items should be sorted by updatedAt descending
    expect(result.current.items[0].id).toBe('3'); // highest updatedAt
    expect(result.current.items[1].id).toBe('2');
    expect(result.current.items[2].id).toBe('1');
  });

  it('assigns correct group IDs', () => {
    setupAuthQuery();

    const { result } = renderHook(() => useSavedSearches(['urn:altinn:person:identifier-no:1']), {
      wrapper: createCustomWrapper(),
    });

    // Search 1: urn matches currentEndUser => personal
    expect(result.current.items.find((i) => i.id === '1')?.groupId).toBe('personal');
    // Search 2: single org urn => that urn
    expect(result.current.items.find((i) => i.id === '2')?.groupId).toBe('urn:altinn:organization:identifier-no:123');
    // Search 3: multiple urns => all-organizations
    expect(result.current.items.find((i) => i.id === '3')?.groupId).toBe('all-organizations');
  });

  it('builds groups from saved searches', () => {
    setupAuthQuery();

    const { result } = renderHook(() => useSavedSearches(['urn:altinn:person:identifier-no:1']), {
      wrapper: createCustomWrapper(),
    });

    expect(result.current.groups).toHaveProperty('personal');
    expect(result.current.groups).toHaveProperty('all-organizations');
    // Org-specific group should exist
    expect(result.current.groups).toHaveProperty('urn:altinn:organization:identifier-no:123');
  });

  it('each item has a context menu with search, edit, and delete actions', () => {
    setupAuthQuery();

    const { result } = renderHook(() => useSavedSearches(['urn:altinn:person:identifier-no:1']), {
      wrapper: createCustomWrapper(),
    });

    const item = result.current.items[0];
    expect(item.contextMenu?.items).toHaveLength(3);
    expect(item.contextMenu?.items.map((m) => m.id)).toEqual([
      expect.stringContaining('-link'),
      expect.stringContaining('-edit'),
      expect.stringContaining('-delete'),
    ]);
  });

  it('saveSearch calls createSavedSearch and shows success snackbar', async () => {
    setupAuthQuery();
    mockCreateSavedSearch.mockResolvedValue({ createSavedSearch: { id: 42 } });

    const { result } = renderHook(() => useSavedSearches(['urn:altinn:person:identifier-no:1']), {
      wrapper: createCustomWrapper(),
    });

    let id: string | undefined;
    await act(async () => {
      id = await result.current.saveSearch({
        filters: { status: ['REQUIRES_ATTENTION'] },
        selectedParties: ['urn:altinn:person:identifier-no:1'],
        enteredSearchValue: 'test',
        viewType: 'inbox',
      });
    });

    expect(mockCreateSavedSearch).toHaveBeenCalledOnce();
    expect(id).toBe('42');
    expect(mockOpenSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'savedSearches.saved_success', color: 'company' }),
    );
  });

  it('saveSearch shows error snackbar on failure', async () => {
    setupAuthQuery();
    mockCreateSavedSearch.mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() => useSavedSearches(['urn:altinn:person:identifier-no:1']), {
      wrapper: createCustomWrapper(),
    });

    await act(async () => {
      await result.current.saveSearch({
        filters: {},
        selectedParties: [],
        enteredSearchValue: '',
        viewType: 'inbox',
      });
    });

    expect(mockOpenSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'savedSearches.saved_error', color: 'danger' }),
    );
  });

  it('onDeleteSavedSearch calls deleteSavedSearch and shows success snackbar', async () => {
    setupAuthQuery();
    mockDeleteSavedSearch.mockResolvedValue({});

    const { result } = renderHook(() => useSavedSearches(['urn:altinn:person:identifier-no:1']), {
      wrapper: createCustomWrapper(),
    });

    await act(async () => {
      await result.current.onDeleteSavedSearch('7');
    });

    expect(mockDeleteSavedSearch).toHaveBeenCalledWith(7);
    expect(mockOpenSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'savedSearches.deleted_success', color: 'company' }),
    );
  });

  it('onDeleteSavedSearch shows error snackbar on failure', async () => {
    setupAuthQuery();
    mockDeleteSavedSearch.mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useSavedSearches(['urn:altinn:person:identifier-no:1']), {
      wrapper: createCustomWrapper(),
    });

    await act(async () => {
      await result.current.onDeleteSavedSearch('7');
    });

    expect(mockOpenSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'savedSearches.delete_failed', color: 'danger' }),
    );
  });

  it('onSaveSearch calls updateSavedSearch and shows success snackbar', async () => {
    setupAuthQuery();
    mockUpdateSavedSearch.mockResolvedValue({});

    const { result } = renderHook(() => useSavedSearches(['urn:altinn:person:identifier-no:1']), {
      wrapper: createCustomWrapper(),
    });

    // onSaveSearch is only available when not loading and has data
    expect(result.current.onSaveSearch).toBeDefined();

    await act(async () => {
      result.current.onSaveSearch!('2', 'New title');
    });

    expect(mockUpdateSavedSearch).toHaveBeenCalledWith(2, 'New title');
    expect(mockOpenSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'savedSearches.update_success', color: 'company' }),
    );
  });

  it('manages openedSavedSearch state via onCloseSavedSearch', () => {
    setupAuthQuery();

    const { result } = renderHook(() => useSavedSearches(['urn:altinn:person:identifier-no:1']), {
      wrapper: createCustomWrapper(),
    });

    // Initially no opened search
    expect(result.current.openedSavedSearch).toBeNull();

    // Close handler resets to null (idempotent)
    act(() => {
      result.current.onCloseSavedSearch();
    });
    expect(result.current.openedSavedSearch).toBeNull();
  });

  it('filters currentPartySavedSearches by selected party IDs', () => {
    setupAuthQuery();

    const { result } = renderHook(() => useSavedSearches(['urn:altinn:organization:identifier-no:123']), {
      wrapper: createCustomWrapper(),
    });

    // Only search #2 has urn matching this org
    const ids = result.current.currentPartySavedSearches?.map((s) => s.id);
    expect(ids).toContain(2);
    expect(ids).not.toContain(1);
  });

  it('sets isCTALoading during saveSearch', async () => {
    setupAuthQuery();
    let resolveCreate: (v: unknown) => void;
    mockCreateSavedSearch.mockReturnValue(
      new Promise((resolve) => {
        resolveCreate = resolve;
      }),
    );

    const { result } = renderHook(() => useSavedSearches(['urn:altinn:person:identifier-no:1']), {
      wrapper: createCustomWrapper(),
    });

    expect(result.current.isCTALoading).toBe(false);

    let savePromise: Promise<unknown>;
    act(() => {
      savePromise = result.current.saveSearch({
        filters: {},
        selectedParties: [],
        enteredSearchValue: '',
        viewType: 'inbox',
      });
    });

    // Loading should be true while the promise is pending
    expect(result.current.isCTALoading).toBe(true);

    await act(async () => {
      resolveCreate!({ createSavedSearch: { id: 1 } });
      await savePromise;
    });

    expect(result.current.isCTALoading).toBe(false);
  });
});
