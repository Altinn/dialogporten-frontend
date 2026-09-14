import { useConsent } from '@altinn/altinn-components';
import { useEffect } from 'react';
import { setAnalyticsEnabled } from '../analytics/analytics.ts';
import { useFeatureFlag } from '../featureFlags';

export const useAnalyticsConsent = (): boolean => {
  const { consent } = useConsent();
  const isCookieBannerEnabled = useFeatureFlag<boolean>('global.enableCookieBanner');
  const isAnalyticsAllowed = isCookieBannerEnabled && consent.statistics;

  useEffect(() => {
    setAnalyticsEnabled(isAnalyticsAllowed);
  }, [isAnalyticsAllowed]);

  return isAnalyticsAllowed;
};
