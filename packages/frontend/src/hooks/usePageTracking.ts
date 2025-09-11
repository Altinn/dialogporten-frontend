import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Analytics } from '../analytics';

export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page view on route change
    Analytics.trackPageView(
      undefined, // Let the analytics determine the name
      undefined, // Let it use current URL
      {
        'route.pathname': location.pathname,
        'route.search': location.search,
        'route.hash': location.hash,
        'route.state': location.state ? JSON.stringify(location.state) : '',
      },
    );
  }, [location]);
};
