import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePageTracking } from './usePageTracking.ts';

const { startPageTracking, stopPageTracking, flush, isValidTrackablePage, locationRef } = vi.hoisted(() => ({
  startPageTracking: vi.fn(),
  stopPageTracking: vi.fn(),
  flush: vi.fn(),
  isValidTrackablePage: vi.fn(() => true),
  locationRef: { pathname: '/inbox', search: '', hash: '', state: null } as {
    pathname: string;
    search: string;
    hash: string;
    state: unknown;
  },
}));

vi.mock('../analytics/analytics.ts', () => ({
  Analytics: {
    startPageTracking,
    stopPageTracking,
    flush,
    isValidTrackablePage,
  },
}));

vi.mock('react-router', () => ({
  useLocation: () => locationRef,
}));

const dispatchPageHide = () => {
  window.dispatchEvent(new Event('pagehide'));
};

const dispatchPageShow = (persisted: boolean) => {
  const event = new Event('pageshow');
  Object.defineProperty(event, 'persisted', { value: persisted });
  window.dispatchEvent(event);
};

describe('usePageTracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    locationRef.pathname = '/inbox';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('stops the page view and flushes when pagehide fires', () => {
    const { unmount } = renderHook(() => usePageTracking(true));

    expect(startPageTracking).toHaveBeenCalledTimes(1);

    dispatchPageHide();

    expect(stopPageTracking).toHaveBeenCalledTimes(1);
    expect(stopPageTracking).toHaveBeenCalledWith({
      url: window.location.href,
      pathname: '/inbox',
      search: '',
      hash: '',
      state: '',
    });
    expect(flush).toHaveBeenCalledTimes(1);

    unmount();
  });

  it('does not stop the page view a second time on cleanup after pagehide', () => {
    const { unmount } = renderHook(() => usePageTracking(true));

    dispatchPageHide();
    expect(stopPageTracking).toHaveBeenCalledTimes(1);

    unmount();

    expect(stopPageTracking).toHaveBeenCalledTimes(1);
    expect(flush).toHaveBeenCalledTimes(1);
  });

  it('starts a new page view when the page is restored from the back/forward cache', () => {
    const { unmount } = renderHook(() => usePageTracking(true));

    expect(startPageTracking).toHaveBeenCalledTimes(1);

    dispatchPageHide();
    dispatchPageShow(true);

    expect(startPageTracking).toHaveBeenCalledTimes(2);

    // The restored page view is tracked again, so it is stopped once on cleanup.
    unmount();
    expect(stopPageTracking).toHaveBeenCalledTimes(2);
  });

  it('does not start a new page view on pageshow without bfcache restore', () => {
    const { unmount } = renderHook(() => usePageTracking(true));

    dispatchPageShow(false);

    expect(startPageTracking).toHaveBeenCalledTimes(1);

    unmount();
    expect(stopPageTracking).toHaveBeenCalledTimes(1);
  });

  it('does nothing when analytics is not allowed', () => {
    const { unmount } = renderHook(() => usePageTracking(false));

    dispatchPageHide();
    dispatchPageShow(true);
    unmount();

    expect(startPageTracking).not.toHaveBeenCalled();
    expect(stopPageTracking).not.toHaveBeenCalled();
    expect(flush).not.toHaveBeenCalled();
  });
});
