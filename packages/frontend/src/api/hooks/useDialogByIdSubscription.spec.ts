import { act, renderHook } from '@testing-library/react';
import { DialogEventType } from 'bff-types-generated';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type SSEListener = (event: MessageEvent) => void;
const listeners = new Map<string, SSEListener>();

const mockClose = vi.fn();
const mockSSECtor = vi.fn();

vi.mock('sse.js', () => {
  class SSE {
    constructor(url: string, opts: unknown) {
      mockSSECtor(url, opts);
      listeners.clear();
    }
    addEventListener(name: string, cb: SSEListener) {
      listeners.set(name, cb);
    }
    close = mockClose;
  }
  return { SSE };
});

const invalidateQueries = vi.fn();
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  return { ...actual, useQueryClient: () => ({ invalidateQueries }) };
});

const navigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigate };
});

vi.mock('../../featureFlags', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../featureFlags')>();
  return {
    ...actual,
    useFeatureFlag: () => false,
  };
});

import { createCustomWrapper } from '../../../tests/test-utils';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { useDialogByIdSubscription } from './useDialogByIdSubscription';

const mockRefreshDialogToken = vi.fn().mockResolvedValue('fresh-tok');

describe('useDialogByIdSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listeners.clear();
  });

  const setHidden = (hidden: boolean) => {
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get: () => hidden,
    });
    document.dispatchEvent(new Event('visibilitychange'));
  };

  it('closes connection when tab is hidden and reconnects when visible', async () => {
    const { rerender } = renderHook(({ id, token }) => useDialogByIdSubscription(id, token, mockRefreshDialogToken), {
      wrapper: createCustomWrapper(),
      initialProps: { id: undefined as string | undefined, token: undefined as string | undefined },
    });
    rerender({ id: 'dialog-1', token: 'tok' });

    // initial connect
    expect(mockSSECtor).toHaveBeenCalledTimes(1);
    expect(mockClose).not.toHaveBeenCalled();

    // tab hidden → closes
    act(() => setHidden(true));
    expect(mockClose).toHaveBeenCalledTimes(1);

    // tab visible → refreshes token then reconnects
    await act(async () => setHidden(false));
    expect(mockSSECtor).toHaveBeenCalledTimes(2);
  });

  it('invalidates queries on DialogUpdated', () => {
    const { rerender } = renderHook(({ id, token }) => useDialogByIdSubscription(id, token, mockRefreshDialogToken), {
      wrapper: createCustomWrapper(),
      initialProps: { id: undefined as string | undefined, token: undefined as string | undefined },
    });
    rerender({ id: 'dialog-1', token: 'tok' });

    expect(mockSSECtor).toHaveBeenCalledOnce();

    act(() => {
      listeners.get('next')?.({
        data: JSON.stringify({
          data: { dialogEvents: { type: DialogEventType.DialogUpdated } },
        }),
      } as MessageEvent);
    });

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.DIALOG_BY_ID] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: [QUERY_KEYS.DIALOGS] });
  });

  it('does not connect when mock=true', () => {
    window.history.replaceState({}, '', '/?mock=true');
    renderHook(() => useDialogByIdSubscription('d', 't', mockRefreshDialogToken), { wrapper: createCustomWrapper() });
    expect(mockSSECtor).not.toHaveBeenCalled();
  });
});
