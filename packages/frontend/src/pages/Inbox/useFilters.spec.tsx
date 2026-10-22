import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { createCustomWrapper } from '../../../tests/test-utils.tsx';
import { FilterCategory } from './filters.tsx';
import { useFilters } from './useFilters.ts';

vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-i18next')>();
  return { ...actual, useTranslation: vi.fn(() => ({ t: (key: string) => key })) };
});

vi.mock('../../api/hooks/useServiceResource.ts', () => ({
  useFilterServiceResources: vi.fn(() => ({ serviceResources: [], isLoading: false })),
}));

vi.mock('../../api/hooks/useDialogsForRecommendations.tsx', () => ({
  useDialogsForRecommendations: vi.fn(() => []),
}));

vi.mock('./useOrganizations.ts', () => ({
  useOrganizations: vi.fn(() => ({ organizations: [] })),
}));

vi.mock('../../i18n/useDateFnsLocale.tsx', () => ({
  useDateFnsLocale: vi.fn(() => ({ locale: {} })),
}));

import { useFilterServiceResources } from '../../api/hooks/useServiceResource.ts';

const getServiceFilter = (filters: ReturnType<typeof useFilters>['filters']) =>
  filters.find((filter) => filter.name === FilterCategory.SERVICE);

describe('useFilters service filter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not fetch service resources before the service filter is opened', () => {
    renderHook(() => useFilters({ viewType: 'inbox' }), {
      wrapper: createCustomWrapper(undefined, { initialEntries: ['/?service=urn:altinn:resource:a'] }),
    });

    expect(useFilterServiceResources).toHaveBeenLastCalledWith({ enabled: false });
  });

  it('fetches service resources once the service filter opens and keeps them after it closes', () => {
    const { result } = renderHook(() => useFilters({ viewType: 'inbox' }), { wrapper: createCustomWrapper() });

    act(() => getServiceFilter(result.current.filters)?.onOpenChange?.(true));
    expect(useFilterServiceResources).toHaveBeenLastCalledWith({ enabled: true });

    act(() => getServiceFilter(result.current.filters)?.onOpenChange?.(false));
    expect(useFilterServiceResources).toHaveBeenLastCalledWith({ enabled: true });
  });

  it('marks the service filter as loading while service resources are fetched', () => {
    (useFilterServiceResources as Mock).mockReturnValue({ serviceResources: [], isLoading: true });

    const { result } = renderHook(() => useFilters({ viewType: 'inbox' }), { wrapper: createCustomWrapper() });

    expect(getServiceFilter(result.current.filters)?.loading).toBe(true);
  });
});
