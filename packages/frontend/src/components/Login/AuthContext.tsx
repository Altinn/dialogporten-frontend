import { useQuery } from '@tanstack/react-query';
import type React from 'react';
import { createContext, useContext, useEffect } from 'react';
import { getCurrentURL, getIsAuthenticated, getStoredURL, removeStoredURL, saveURL } from '../../auth';

interface AuthContextProps {
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: isAuthenticated, isFetchedAfterMount } = useQuery({
    queryKey: ['isAuthenticated'],
    queryFn: async () => getIsAuthenticated(),
    refetchInterval: 30 * 1000,
    retry: 3,
  });

  useEffect(() => {
    if (!isAuthenticated && isFetchedAfterMount) {
      // besides it's also an indicator of a deliberate logout
      saveURL();
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
