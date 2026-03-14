import type { GetServiceResourcesQuery, ServiceResource } from 'bff-types-generated';
import { useMemo } from 'react';
import { useAuthenticatedQuery } from '../../auth/useAuthenticatedQuery.tsx';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { useFeatureFlag } from '../../featureFlags';
import { fetchServiceResources } from '../queries.ts';
import { useParties } from './useParties.ts';

interface UseServiceResourceOutput {
  serviceResources: ServiceResource[];
  isSuccess: boolean;
  isLoading: boolean;
}

export const useServiceResource = (): UseServiceResourceOutput => {
  const { selectedParties } = useParties();
  const isServiceFilterEnabled = useFeatureFlag<boolean>('filters.enableServiceFilter');
  const enabled = isServiceFilterEnabled && selectedParties.length > 0;

  const { data, isLoading, isSuccess } = useAuthenticatedQuery<GetServiceResourcesQuery>({
    queryKey: [QUERY_KEYS.SERVICE_RESOURCES],
    queryFn: () => fetchServiceResources({}),
    retry: 3,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    enabled,
  });
  const serviceResources = useMemo(
    () =>
      ((data?.serviceResources ?? []) as ServiceResource[])
        .map((item) => ({
          ...item,
          id: `urn:altinn:resource:${item?.id ?? ''}`,
        }))
        .sort((a, b) => {
          const titleA = a.title?.nb || a.title?.en || a.title?.nn || '';
          const titleB = b.title?.nb || b.title?.en || b.title?.nn || '';
          return titleA.localeCompare(titleB, undefined, { sensitivity: 'base' });
        }),
    [data?.serviceResources],
  );

  return { serviceResources, isLoading, isSuccess };
};
