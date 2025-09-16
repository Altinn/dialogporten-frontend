import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Analytics } from '../analytics';

export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page view on route change
    Analytics.trackPageView({
      url: window.location.href,
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
      state: location.state ? JSON.stringify(location.state) : '',
    });
  }, [location]);
};
