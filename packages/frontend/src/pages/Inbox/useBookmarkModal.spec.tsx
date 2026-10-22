import type { FilterState } from '@altinn/altinn-components';
import { act, renderHook } from '@testing-library/react';
import type { SavedSearchesFieldsFragment } from 'bff-types-generated';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBookmarkModal } from './useBookmarkModal.tsx';

vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-i18next')>();
  return { ...actual, useTranslation: vi.fn(() => ({ t: (key: string) => key })) };
});

vi.mock('../../api/hooks/useServiceResource.ts', () => ({
  useFilterServiceResources: vi.fn(() => ({ serviceResourceById: new Map() })),
}));

vi.mock('./useOrganizations.ts', () => ({
  useOrganizations: vi.fn(() => ({ organizations: [] })),
}));

vi.mock('../../i18n/useDateFnsLocale.tsx', () => ({
  useDateFnsLocale: vi.fn(() => ({ locale: {} })),
}));

import { useFilterServiceResources } from '../../api/hooks/useServiceResource.ts';

const renderBookmarkModal = (filterState: FilterState) =>
  renderHook(() =>
    useBookmarkModal({
      filterState,
      enteredSearchValue: '',
      viewType: 'inbox',
      partyURIs: [],
      saveSearch: vi.fn(),
      updateSavedSearchTitle: vi.fn(),
      deleteSavedSearch: vi.fn(),
    }),
  );

const makeSavedSearch = (filters: { id: string; value: string }[]): SavedSearchesFieldsFragment => ({
  id: 1,
  name: 'My search',
  createdAt: '1700000000000',
  updatedAt: '1700000000000',
  data: { urn: [], filters, searchString: '', fromView: '/' },
});

describe('useBookmarkModal service resources', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not fetch service resources while the modal is closed', () => {
    renderBookmarkModal({ service: ['urn:altinn:resource:a'] });

    expect(useFilterServiceResources).toHaveBeenLastCalledWith({ enabled: false });
  });

  it('fetches service resources when the save modal opens with selected services', () => {
    const { result } = renderBookmarkModal({ service: ['urn:altinn:resource:a'] });

    act(() => result.current.openSaveModal());

    expect(useFilterServiceResources).toHaveBeenLastCalledWith({ enabled: true });
  });

  it('does not fetch service resources when the save modal opens without selected services', () => {
    const { result } = renderBookmarkModal({ service: [], org: ['skd'] });

    act(() => result.current.openSaveModal());

    expect(useFilterServiceResources).toHaveBeenLastCalledWith({ enabled: false });
  });

  it('fetches service resources when editing a saved search with a service filter', () => {
    const { result } = renderBookmarkModal({});

    act(() => result.current.openEditModal(makeSavedSearch([{ id: 'service', value: 'urn:altinn:resource:a' }])));

    expect(useFilterServiceResources).toHaveBeenLastCalledWith({ enabled: true });
  });
});
