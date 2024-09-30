import type { ReactNode } from 'react';
import { createContext, useEffect } from 'react';
import { Analytics } from '../Analytics';

const LoggerContext = createContext<typeof Analytics | null>(null);

type LoggerContextProviderProps = {
  children: ReactNode;
};

export const LoggerContextProvider = ({ children }: LoggerContextProviderProps): JSX.Element => {
  useEffect(() => {
    const handleWindowError = (event: ErrorEvent) => {
      Analytics.trackException({
        exception: event.error,
        properties: {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    };

    window.addEventListener('error', handleWindowError);

    return () => {
      window.removeEventListener('error', handleWindowError);
    };
  }, []);
  return <LoggerContext.Provider value={Analytics}>{children}</LoggerContext.Provider>;
};
