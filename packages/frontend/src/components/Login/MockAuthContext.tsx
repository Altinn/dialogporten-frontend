import type React from 'react';
import { createContext, useContext } from 'react';

interface AuthContextProps {
  isAuthenticated: boolean;
}

const MockAuthContext = createContext<AuthContextProps | undefined>(undefined);

export const MockAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <MockAuthContext.Provider value={{ isAuthenticated: true }}>{children}</MockAuthContext.Provider>;
};

export const useAuth = (): AuthContextProps => {
  const context = useContext(MockAuthContext);
  if (!context) {
    throw new Error('useAuth can only be used within AuthProvider');
  }
  return context;
};
