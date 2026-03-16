import { useQueryClient } from '@tanstack/react-query';
import type { GetServiceResourcesQuery, ServiceResource } from 'bff-types-generated';
import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { i18n } = useTranslation();
  const queryClient = useQueryClient();
  const prevLanguageRef = useRef(i18n.language);

  useEffect(() => {
    if (prevLanguageRef.current !== i18n.language) {
      prevLanguageRef.current = i18n.language;
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SERVICE_RESOURCES] });
    }
  }, [i18n.language, queryClient]);

  const { data, isLoading, isSuccess } = useAuthenticatedQuery<GetServiceResourcesQuery>({
    /* i18n is not added as key to prevent multiple caches */
    queryKey: [QUERY_KEYS.SERVICE_RESOURCES],
    queryFn: () => fetchServiceResources({ lang: i18n.language }),
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
        .map(
          (item) =>
            ({
              ...item,
              id: `urn:altinn:resource:${item?.id ?? ''}`,
            }) as ServiceResource,
        )
        .sort((a, b) => {
          return (a.title ?? '').localeCompare(b.title ?? '', undefined, { sensitivity: 'base' });
        }),
    [data?.serviceResources],
  );

  return { serviceResources, isLoading, isSuccess };
};
