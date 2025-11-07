import type { ReactElement, ReactNode } from 'react';
import { createContext, useEffect } from 'react';
import { Analytics } from '../analytics.ts';

const LoggerContext = createContext<typeof Analytics | null>(null);

type LoggerContextProviderProps = {
  children: ReactNode;
};

export const LoggerContextProvider = ({ children }: LoggerContextProviderProps): ReactElement => {
  useEffect(() => {
    const handleWindowError = (event: ErrorEvent) => {
      if (
        event.message.includes('ResizeObserver loop') ||
        event.message.includes('ResizeObserver loop completed with undelivered notifications')
      ) {
        return;
      }

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
