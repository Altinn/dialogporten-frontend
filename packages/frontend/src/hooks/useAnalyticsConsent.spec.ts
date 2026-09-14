import { acceptAllConsent, clearConsent, rejectAllConsent } from '@altinn/altinn-components';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setAnalyticsEnabled } from '../analytics/analytics.ts';
import { useAnalyticsConsent } from './useAnalyticsConsent.ts';

let mockIsCookieBannerEnabled = false;

vi.mock('../analytics/analytics.ts', () => ({
  setAnalyticsEnabled: vi.fn(),
}));

vi.mock('../featureFlags', () => ({
  useFeatureFlag: () => mockIsCookieBannerEnabled,
}));

describe('useAnalyticsConsent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearConsent();
  });

  it('keeps analytics disabled when the cookie banner is disabled, even with stored consent', () => {
    mockIsCookieBannerEnabled = false;
    acceptAllConsent();

    const { result } = renderHook(() => useAnalyticsConsent());

    expect(result.current).toBe(false);
    expect(setAnalyticsEnabled).toHaveBeenLastCalledWith(false);
  });

  it('keeps analytics disabled until consent is given when the cookie banner is enabled', () => {
    mockIsCookieBannerEnabled = true;

    const { result } = renderHook(() => useAnalyticsConsent());

    expect(result.current).toBe(false);
    expect(setAnalyticsEnabled).toHaveBeenLastCalledWith(false);

    act(() => acceptAllConsent());

    expect(result.current).toBe(true);
    expect(setAnalyticsEnabled).toHaveBeenLastCalledWith(true);
  });

  it('keeps analytics disabled when consent is rejected', () => {
    mockIsCookieBannerEnabled = true;
    rejectAllConsent();

    const { result } = renderHook(() => useAnalyticsConsent());

    expect(result.current).toBe(false);
    expect(setAnalyticsEnabled).not.toHaveBeenCalledWith(true);
  });

  it('disables analytics when consent is withdrawn', () => {
    mockIsCookieBannerEnabled = true;
    acceptAllConsent();

    const { result } = renderHook(() => useAnalyticsConsent());

    expect(setAnalyticsEnabled).toHaveBeenLastCalledWith(true);

    act(() => clearConsent());

    expect(result.current).toBe(false);
    expect(setAnalyticsEnabled).toHaveBeenLastCalledWith(false);
  });
});
