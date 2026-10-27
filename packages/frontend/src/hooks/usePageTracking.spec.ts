import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Analytics } from '../analytics/analytics.ts';
import { usePageTracking } from './usePageTracking.ts';

vi.mock('../analytics/analytics.ts', () => ({
  Analytics: {
    startPageTracking: vi.fn(),
    stopPageTracking: vi.fn(),
    flush: vi.fn(),
    isValidTrackablePage: vi.fn(() => true),
  },
}));

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(MemoryRouter, { initialEntries: ['/inbox'] }, children);

const firePageShow = (persisted: boolean) => {
  const event = new Event('pageshow') as PageTransitionEvent;
  Object.defineProperty(event, 'persisted', { value: persisted });
  window.dispatchEvent(event);
};

describe('usePageTracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('stops the page view and flushes on pagehide', () => {
    renderHook(() => usePageTracking(true), { wrapper });

    window.dispatchEvent(new Event('pagehide'));

    expect(Analytics.stopPageTracking).toHaveBeenCalledTimes(1);
    expect(Analytics.stopPageTracking).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/inbox' }));
    expect(Analytics.flush).toHaveBeenCalledTimes(1);
  });

  it('stops the page view in the cleanup when pagehide did not fire', () => {
    const { unmount } = renderHook(() => usePageTracking(true), { wrapper });

    unmount();

    expect(Analytics.stopPageTracking).toHaveBeenCalledTimes(1);
    expect(Analytics.flush).not.toHaveBeenCalled();
  });

  it('starts a new page view when the page is restored from the back/forward cache', () => {
    const { unmount } = renderHook(() => usePageTracking(true), { wrapper });
    expect(Analytics.startPageTracking).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new Event('pagehide'));
    expect(Analytics.stopPageTracking).toHaveBeenCalledTimes(1);

    firePageShow(true);

    expect(Analytics.startPageTracking).toHaveBeenCalledTimes(2);

    unmount();

    expect(Analytics.stopPageTracking).toHaveBeenCalledTimes(2);
  });

  it('ignores pageshow when the page is not restored from the back/forward cache', () => {
    renderHook(() => usePageTracking(true), { wrapper });

    firePageShow(false);

    expect(Analytics.startPageTracking).toHaveBeenCalledTimes(1);
  });

  it('does nothing when analytics is not allowed', () => {
    const { unmount } = renderHook(() => usePageTracking(false), { wrapper });

    window.dispatchEvent(new Event('pagehide'));
    firePageShow(true);
    unmount();

    expect(Analytics.startPageTracking).not.toHaveBeenCalled();
    expect(Analytics.stopPageTracking).not.toHaveBeenCalled();
    expect(Analytics.flush).not.toHaveBeenCalled();
  });
});
