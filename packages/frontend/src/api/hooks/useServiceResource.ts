import { useQueryClient } from '@tanstack/react-query';
import type { ServiceResource } from 'bff-types-generated';
import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthenticatedQuery } from '../../auth/useAuthenticatedQuery.tsx';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { fetchAllServiceResources, fetchConsumerServiceResources } from '../queries.ts';
import { useParties } from './useParties.ts';

interface ServiceResourcesResult {
  serviceResources?: (ServiceResource | null)[] | null;
}

interface UseServiceResourceOutput {
  serviceResources: ServiceResource[];
  serviceResourceById: Map<string, ServiceResource>;
  isSuccess: boolean;
  isLoading: boolean;
}

const useServiceResourcesQuery = (
  queryKeyPrefix: string,
  queryFn: (variables: { lang: string }) => Promise<ServiceResourcesResult>,
): UseServiceResourceOutput => {
  const { selectedParties } = useParties();
  const enabled = selectedParties.length > 0;
  const { i18n } = useTranslation();
  const queryClient = useQueryClient();

  /* Drop cache entries for other languages because size of dataset, */
  useEffect(() => {
    queryClient.removeQueries({
      predicate: (query) => query.queryKey[0] === queryKeyPrefix && query.queryKey[1] !== i18n.language,
    });
  }, [i18n.language, queryClient, queryKeyPrefix]);

  const { data, isLoading, isSuccess } = useAuthenticatedQuery<ServiceResourcesResult>({
    queryKey: [queryKeyPrefix, i18n.language],
    queryFn: () => queryFn({ lang: i18n.language }),
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

  const serviceResourceById = useMemo(() => {
    const map = new Map<string, ServiceResource>();
    for (const sr of serviceResources) {
      if (sr.id) map.set(sr.id, sr);
    }
    return map;
  }, [serviceResources]);

  return { serviceResources, serviceResourceById, isLoading, isSuccess };
};

/**
 * Service resources used by the toolbar/saved-search filters, sourced from Dialogporten
 * (DPServiceResourcesList). Use this when the resource id is passed to Dialogporten as a
 * filter on dialogs by service.
 */
export const useFilterServiceResources = (): UseServiceResourceOutput =>
  useServiceResourcesQuery(QUERY_KEYS.FILTER_SERVICE_RESOURCES, fetchConsumerServiceResources);

/**
 * Service resources used by notification settings, sourced from the Altinn Resource Registry
 * (RRServiceResourcesList). Use this when the user enables explicit notifications per service.
 */
export const useNotificationServiceResources = (): UseServiceResourceOutput =>
  useServiceResourcesQuery(QUERY_KEYS.SERVICE_RESOURCES, fetchAllServiceResources);
