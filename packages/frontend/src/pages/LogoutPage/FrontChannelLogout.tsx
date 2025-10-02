import { useEffect } from 'react';
import { useErrorLogger } from '../../hooks/useErrorLogger';

export const FrontChannelLogout = () => {
  const { logError } = useErrorLogger();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get('sid');
    const iss = params.get('iss');

    if (sid && iss) {
      void fetch(`/api/frontchannel-logout?sid=${sid}&iss=${encodeURIComponent(iss)}`).catch((error) => {
        logError(
          error as Error,
          {
            context: 'FrontChannelLogout.fetch',
          },
          'Error fetching front channel logout',
        );
      });
    }
  }, [logError]);
  return null;
};
