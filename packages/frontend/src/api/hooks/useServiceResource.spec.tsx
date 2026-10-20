import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { fetchAllServiceResources, fetchConsumerServiceResources } from '../queries.ts';
import { useFilterServiceResources, useNotificationServiceResources } from './useServiceResource.ts';

vi.mock('../../components/Login/AuthContext.tsx', () => ({
  useAuth: () => ({ isAuthenticated: true }),
}));
vi.mock('./useParties.ts', () => ({
  useParties: () => ({ selectedParties: [{ party: 'urn:altinn:organization:identifier-no:1' }] }),
}));
vi.mock('../queries.ts', () => ({
  fetchAllServiceResources: vi.fn(),
  fetchConsumerServiceResources: vi.fn(),
}));

let queryClient: QueryClient;

const wrapper = ({ children }: PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

beforeEach(() => {
  vi.resetAllMocks();
  queryClient = new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } });
});

afterEach(() => {
  cleanup();
  queryClient.clear();
});

describe('useFilterServiceResources', () => {
  it('retries once, then refetches an error without data on the next mount', async () => {
    vi.mocked(fetchConsumerServiceResources).mockRejectedValue(new Error('Synthetic upstream failure'));
    const first = renderHook(() => useFilterServiceResources(), { wrapper });
    const queryKey = [QUERY_KEYS.FILTER_SERVICE_RESOURCES, 'nb'];

    await waitFor(() => expect(queryClient.getQueryState(queryKey)?.status).toBe('error'));
    expect(fetchConsumerServiceResources).toHaveBeenCalledTimes(2);
    expect(queryClient.getQueryData(queryKey)).toBeUndefined();
    expect(first.result.current.isSuccess).toBe(false);
    first.unmount();

    vi.mocked(fetchConsumerServiceResources).mockResolvedValue({
      serviceResources: [{ id: 'service-a', title: 'A', org: 'org' }],
    });
    const second = renderHook(() => useFilterServiceResources(), { wrapper });
    await waitFor(() => expect(second.result.current.isSuccess).toBe(true));

    expect(fetchConsumerServiceResources).toHaveBeenCalledTimes(3);
    expect(fetchConsumerServiceResources).toHaveBeenLastCalledWith({ lang: 'nb' });
    expect(second.result.current.serviceResourceById.get('urn:altinn:resource:service-a')?.title).toBe('A');
    expect(fetchAllServiceResources).not.toHaveBeenCalled();
  });

  it('keeps a legitimate empty result cached across mounts', async () => {
    vi.mocked(fetchConsumerServiceResources).mockResolvedValue({ serviceResources: [] });
    const first = renderHook(() => useFilterServiceResources(), { wrapper });
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
    first.unmount();

    const second = renderHook(() => useFilterServiceResources(), { wrapper });
    expect(second.result.current.isSuccess).toBe(true);
    expect(second.result.current.serviceResources).toEqual([]);
    expect(fetchConsumerServiceResources).toHaveBeenCalledTimes(1);
  });
});

describe('useNotificationServiceResources', () => {
  it('keeps the existing three retries for the resource registry query', async () => {
    vi.mocked(fetchAllServiceResources).mockRejectedValue(new Error('Synthetic registry failure'));
    renderHook(() => useNotificationServiceResources(), { wrapper });

    await waitFor(() => expect(queryClient.getQueryState([QUERY_KEYS.SERVICE_RESOURCES, 'nb'])?.status).toBe('error'));
    expect(fetchAllServiceResources).toHaveBeenCalledTimes(4);
    expect(fetchConsumerServiceResources).not.toHaveBeenCalled();
  });
});
