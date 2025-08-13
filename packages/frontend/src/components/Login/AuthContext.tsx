import { useQuery } from '@tanstack/react-query';
import type React from 'react';
import { createContext, useContext, useEffect } from 'react';
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
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: 'always',
    retry: 3,
  });

  useEffect(() => {
    if (!isAuthenticated && isFetchedAfterMount) {
      (window as Window).location = `/api/login`;
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
