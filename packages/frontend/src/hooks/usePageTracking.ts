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

    // Start tracking when the route component mounts
    Analytics.startPageTracking(pageInfo);

    // The page view is reported when it is left. Guard so it is stopped exactly
    // once, whether that happens on route change/unmount or on `pagehide`.
    let pageViewStopped = false;
    const stopCurrentPageView = () => {
      if (pageViewStopped) {
        return;
      }
      pageViewStopped = true;
      Analytics.stopPageTracking(pageInfo);
    };

    // When the user closes the tab, reloads, or navigates away to an external
    // page, React never runs the cleanup. Stop the page view on `pagehide` and
    // flush so the telemetry is sent before the page goes away.
    const handlePageHide = () => {
      stopCurrentPageView();
      Analytics.flush();
    };

    // If the page is restored from the back/forward cache, the page view was
    // already stopped above, so start a new one. `visibilitychange` is
    // deliberately not used: switching tabs must not end the page view.
    const handlePageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) {
        return;
      }
      pageViewStopped = false;
      Analytics.startPageTracking(pageInfo);
    };

    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('pageshow', handlePageShow);

    // Stop tracking when the route component unmounts or changes
    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('pageshow', handlePageShow);
      stopCurrentPageView();
    };
  }, [location.pathname, isAnalyticsAllowed]);
};
