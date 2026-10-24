import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { Analytics } from '../analytics/analytics.ts';

export const usePageTracking = (isAnalyticsAllowed: boolean) => {
  const location = useLocation();

  // biome-ignore lint/correctness/useExhaustiveDependencies: Intentionally track only on pathname and consent changes (avoid duplicate page views caused by query/state churn).
  useEffect(() => {
    if (!isAnalyticsAllowed) {
      return;
    }

    if (!Analytics.isValidTrackablePage(location.pathname)) {
      console.debug(`Skipping page tracking for route: ${location.pathname}`);
      return;
    }

    const pageInfo = {
      url: window.location.href,
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
      state: location.state ? JSON.stringify(location.state) : '',
    };

    let stopped = false;
    const stop = () => {
      if (stopped) {
        return;
      }
      stopped = true;
      Analytics.stopPageTracking(pageInfo);
    };

    const onPageHide = () => {
      stop();
      Analytics.flush();
    };

    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      stopped = false;
      Analytics.startPageTracking(pageInfo);
    };

    // Start tracking when the route component mounts
    Analytics.startPageTracking(pageInfo);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('pageshow', onPageShow);

    // Stop tracking when the route component unmounts or changes
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('pageshow', onPageShow);
      stop();
    };
  }, [location.pathname, isAnalyticsAllowed]);
};
