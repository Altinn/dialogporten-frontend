import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Analytics } from '../analytics';

export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    if (!Analytics.isValidTrackablePage(location.pathname)) {
      console.debug(`Skipping page tracking for route: ${location.pathname}`);
      return;
    }
    Analytics.trackPageView({
      url: window.location.href,
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
      state: location.state ? JSON.stringify(location.state) : '',
    });
  }, [location]);
};
