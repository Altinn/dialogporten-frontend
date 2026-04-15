import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { PartyFieldsFragment } from 'bff-types-generated';
import type React from 'react';
import { createContext, useContext, useEffect } from 'react';
import { getCurrentURL, getIsAuthenticated, getStoredURL, removeStoredURL, savePartyBeforeRedirect, saveURL } from '../../auth';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { getPartyFromCookie } from '../../cookie.ts';

interface AuthContextProps {
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const { data: isAuthenticated, isFetchedAfterMount } = useQuery({
    queryKey: ['isAuthenticated'],
    queryFn: async () => getIsAuthenticated(),
    refetchInterval: 30 * 1000,
    retry: 3,
  });

  useEffect(() => {
    if (!isAuthenticated && isFetchedAfterMount) {
      saveURL();
      // Save the current party selection before redirect — the OIDC provider
      // overwrites the AltinnPartyUuid cookie with the preselected actor during
      // re-login, so we need to restore the user's actual selection afterward.
      // The end user UUID is included so we can verify the same user is logging
      // back in (prevents cross-user contamination on shared computers).
      const currentParty = getPartyFromCookie('AltinnPartyUuid');
      const parties = queryClient.getQueryData<PartyFieldsFragment[]>([QUERY_KEYS.PARTIES]);
      const endUserUuid = parties?.find((p) => p.isCurrentEndUser)?.partyUuid;
      if (currentParty && endUserUuid) {
        savePartyBeforeRedirect(currentParty, endUserUuid);
      }
      window.location.assign('/api/login');
    }

    const prevURL = getStoredURL();
    if (isFetchedAfterMount && isAuthenticated && prevURL) {
      removeStoredURL();
      if (prevURL !== getCurrentURL()) {
        window.location.assign(prevURL);
      }
    }
  }, [isAuthenticated, isFetchedAfterMount]);

  return <AuthContext.Provider value={{ isAuthenticated: isAuthenticated ?? false }}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (!context) {
    if (import.meta.env.MODE === 'test') {
      return { isAuthenticated: true };
    }
    throw new Error('useAuth can only be used within AuthProvider');
  }
  return context;
};
