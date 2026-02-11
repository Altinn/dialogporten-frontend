import { logError } from '../analytics/errorLogger.ts';
export const useErrorLogger = () => {
  const logErrorWrapper = (error: Error, context?: Record<string, unknown>, errorMessage?: string) => {
    logError(error, context, errorMessage);
  };

  return { logError: logErrorWrapper };
};
