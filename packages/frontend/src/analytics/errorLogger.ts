import { Analytics } from './analytics.ts';

/**
 * Standalone error logging function for use in non-React contexts
 * (utility functions, middleware, etc.)
 */
export const logError = (error: Error, context?: Record<string, unknown>, errorMessage?: string) => {
  if (errorMessage) {
    console.error(errorMessage, error);
  } else {
    console.error(error);
  }
  Analytics.trackException(
    {
      exception: error,
    },
    {
      ...context,
      ...(errorMessage && { errorMessage }),
    },
  );
};
