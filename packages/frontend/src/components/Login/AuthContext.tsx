import { useQuery } from '@tanstack/react-query';
import type React from 'react';
import { createContext, useContext, useEffect, useRef } from 'react';
import { getIsAuthenticated } from '../../auth';

interface AuthContextProps {
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: isAuthenticated, isFetchedAfterMount } = useQuery({
    queryKey: ['isAuthenticated'],
    queryFn: async () => getIsAuthenticated(),
    refetchInterval: 30 * 1000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: 'always',
    retry: 3,
  });

  const didNavigate = useRef(false);

  useEffect(() => {
    if (!isFetchedAfterMount || didNavigate.current) return;

    if (isAuthenticated === false) {
      didNavigate.current = true;
      const deliberateLogout = window.location.pathname.includes('/loggedout');
      alert('referrer' + document.referrer);
      const returnTo = deliberateLogout ? '/' : encodeURIComponent(window.location.href);
      window.location.assign(`/api/login?returnTo=${returnTo}`);
    }
  }, [isAuthenticated, isFetchedAfterMount]);

  return <AuthContext.Provider value={{ isAuthenticated: isAuthenticated ?? false }}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(AuthContext);
  if (!context) {
    if (import.meta.env.MODE === 'test') return { isAuthenticated: true };
    throw new Error('useAuth can only be used within AuthProvider');
  }
  return context;
};
