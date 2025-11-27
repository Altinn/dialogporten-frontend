import { useEffect } from 'react';

export const FrontChannelLogout = () => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get('sid');
    const iss = params.get('iss');

    if (sid && iss) {
      void fetch(`/api/frontchannel-logout?sid=${sid}&iss=${encodeURIComponent(iss)}`);
    }
  }, []);
  return null;
};
