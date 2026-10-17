import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FeatureFlagContext } from '../featureFlags';
import type { AlertBannerResponse } from './alertBanner.ts';
import { useAlertBanner } from './useAlertBanner.ts';

vi.mock('../components/Login/AuthContext.tsx', () => ({
  useAuth: () => ({ isAuthenticated: true }),
}));

const alertBannerResponse: AlertBannerResponse = {
  nb: { title: 'Driftsmelding', description: 'Vi har problemer med innboksen' },
  en: { title: 'Service notice', description: 'We are having problems with the inbox' },
};

const createWrapper = (isAlertBannerEnabled: boolean) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <FeatureFlagContext.Provider value={{ 'inbox.enableAlertBanner': isAlertBannerEnabled }}>
        {children}
      </FeatureFlagContext.Provider>
    </QueryClientProvider>
  );
};

describe('useAlertBanner', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({ ok: true, json: async () => alertBannerResponse });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not request the alert banner while inbox.enableAlertBanner is off', async () => {
    const { result } = renderHook(() => useAlertBanner(), { wrapper: createWrapper(false) });

    await act(async () => {});

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current).toBeNull();
  });

  it('returns the content for the current language when inbox.enableAlertBanner is on', async () => {
    const { result } = renderHook(() => useAlertBanner(), { wrapper: createWrapper(true) });

    await waitFor(() => expect(result.current).toEqual(alertBannerResponse.nb));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/alert-banner');
  });
});
