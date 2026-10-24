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

    // Leaving the app never unmounts the route, so end and send the page view on pagehide
    const onPageHide = () => {
      Analytics.stopPageTracking(pageInfo);
      Analytics.flush();
    };

    // A page restored from the back/forward cache is not remounted, so start a new page view
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        Analytics.startPageTracking(pageInfo);
      }
    };

    // Start tracking when the route component mounts
    Analytics.startPageTracking(pageInfo);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('pageshow', onPageShow);

    // Stop tracking when the route component unmounts or changes
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('pageshow', onPageShow);
      Analytics.stopPageTracking(pageInfo);
    };
  }, [location.pathname, isAnalyticsAllowed]);
};
