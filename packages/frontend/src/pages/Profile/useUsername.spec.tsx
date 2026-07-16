import { QueryClient } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCustomWrapper } from '../../../tests/test-utils.tsx';

const mockGetPartyUsername = vi.fn();
const mockSetUsername = vi.fn();
vi.mock('../../api/queries.ts', () => ({
  getPartyUsername: (...args: unknown[]) => mockGetPartyUsername(...args),
  setUsername: (...args: unknown[]) => mockSetUsername(...args),
}));

vi.mock('../../auth/useAuthenticatedQuery.tsx', () => ({
  useAuthenticatedQuery: vi.fn(),
}));

import { useAuthenticatedQuery } from '../../auth/useAuthenticatedQuery.tsx';
import { useUsername } from './useUsername.tsx';

describe('useUsername', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null username and loading state while fetching', () => {
    (useAuthenticatedQuery as Mock).mockReturnValue({ data: undefined, isLoading: true });

    const { result } = renderHook(() => useUsername('party-uuid'), { wrapper: createCustomWrapper() });

    expect(result.current.username).toBeNull();
    expect(result.current.isLoading).toBe(true);
  });

  it('returns the username once loaded', () => {
    (useAuthenticatedQuery as Mock).mockReturnValue({
      data: { partyUsername: { username: 'ola.nordmann' } },
      isLoading: false,
    });

    const { result } = renderHook(() => useUsername('party-uuid'), { wrapper: createCustomWrapper() });

    expect(result.current.username).toBe('ola.nordmann');
    expect(result.current.isLoading).toBe(false);
  });

  it('is disabled (does not query) without a partyUuid', () => {
    (useAuthenticatedQuery as Mock).mockReturnValue({ data: undefined, isLoading: false });

    renderHook(() => useUsername(undefined), { wrapper: createCustomWrapper() });

    expect(useAuthenticatedQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
  });

  it('saveUsername invalidates the username query on success', async () => {
    (useAuthenticatedQuery as Mock).mockReturnValue({ data: undefined, isLoading: false });
    mockSetUsername.mockResolvedValue({ setUsername: { success: true } });

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUsername('party-uuid'), {
      wrapper: createCustomWrapper(queryClient),
    });

    let saveResult: { success: boolean } | undefined;
    await act(async () => {
      saveResult = await result.current.saveUsername('ola.nordmann');
    });

    expect(mockSetUsername).toHaveBeenCalledWith('ola.nordmann');
    expect(saveResult).toEqual({ success: true });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['username', 'party-uuid'] });
  });

  it('saveUsername does not invalidate the query on failure', async () => {
    (useAuthenticatedQuery as Mock).mockReturnValue({ data: undefined, isLoading: false });
    mockSetUsername.mockResolvedValue({ setUsername: { success: false, message: 'taken' } });

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUsername('party-uuid'), {
      wrapper: createCustomWrapper(queryClient),
    });

    await act(async () => {
      await result.current.saveUsername('taken-name');
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it('saveUsername does not report success when the mutation fails', async () => {
    (useAuthenticatedQuery as Mock).mockReturnValue({ data: undefined, isLoading: false });
    mockSetUsername.mockResolvedValue({ setUsername: { success: false, message: 'taken' } });

    const { result } = renderHook(() => useUsername('party-uuid'), { wrapper: createCustomWrapper() });

    let saveResult: { success: boolean; message?: string | null } | undefined;
    await act(async () => {
      saveResult = await result.current.saveUsername('taken-name');
    });

    expect(saveResult).toEqual({ success: false, message: 'taken' });
  });

  it('toggles isSaving while the mutation is in flight', async () => {
    (useAuthenticatedQuery as Mock).mockReturnValue({ data: undefined, isLoading: false });
    let resolveSetUsername: (value: unknown) => void = () => {};
    mockSetUsername.mockReturnValue(
      new Promise((resolve) => {
        resolveSetUsername = resolve;
      }),
    );

    const { result } = renderHook(() => useUsername('party-uuid'), { wrapper: createCustomWrapper() });

    expect(result.current.isSaving).toBe(false);

    let savePromise: Promise<unknown>;
    act(() => {
      savePromise = result.current.saveUsername('ola.nordmann');
    });
    expect(result.current.isSaving).toBe(true);

    await act(async () => {
      resolveSetUsername({ setUsername: { success: true } });
      await savePromise;
    });
    expect(result.current.isSaving).toBe(false);
  });
});
