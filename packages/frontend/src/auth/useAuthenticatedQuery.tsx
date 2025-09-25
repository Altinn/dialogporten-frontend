import { type UseQueryOptions, type UseQueryResult, useQuery } from '@tanstack/react-query';
import { useAuth } from '../components/Login/AuthContext.tsx';

export function useAuthenticatedQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends readonly unknown[] = unknown[],
>(options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>): UseQueryResult<TData, TError> {
  const { isAuthenticated } = useAuth();

  return useQuery({
    ...options,
    enabled: isAuthenticated && (options.enabled ?? true),
  });
}
