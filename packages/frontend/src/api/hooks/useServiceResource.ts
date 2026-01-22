import type { GetServiceResourcesQuery, GetServiceResourcesQueryVariables, ServiceResource } from 'bff-types-generated';
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

interface UseServiceResourceProps {
  resourceType?: string;
  ids?: string[];
}

export const useServiceResource = (props: UseServiceResourceProps = {}): UseServiceResourceOutput => {
  const { resourceType, ids } = props;

  const { isSelfIdentifiedUser, selectedParties } = useParties();
  const isServiceFilterEnabled = useFeatureFlag<boolean>('filters.enableServiceFilter');

  const normalizedIds = useMemo(() => (ids?.length ? [...ids].sort((a, b) => a.localeCompare(b)) : undefined), [ids]);

  const variables = useMemo(() => {
    const v: GetServiceResourcesQueryVariables = {};
    if (isSelfIdentifiedUser) v.onlySelfIdentifiedUserEnabled = true;
    if (resourceType) v.resourceType = resourceType;
    if (normalizedIds?.length) v.ids = normalizedIds;
    return Object.keys(v).length ? v : undefined;
  }, [isSelfIdentifiedUser, resourceType, normalizedIds]);

  const enabled = isServiceFilterEnabled && selectedParties.length > 0;

  const { data, isLoading, isSuccess } = useAuthenticatedQuery<GetServiceResourcesQuery>({
    queryKey: [
      QUERY_KEYS.SERVICE_RESOURCES,
      { resourceType: resourceType ?? null, ids: normalizedIds ?? null, self: isSelfIdentifiedUser },
    ],
    queryFn: () => fetchServiceResources(variables),
    retry: 3,
    staleTime: 1000 * 60 * 20,
    enabled,
  });

  const serviceResources = useMemo(
    () =>
      (data?.serviceResources ?? []).map((item) => ({
        ...item,
        id: `urn:altinn:resource:${item?.id ?? ''}`,
      })) as ServiceResource[],
    [data?.serviceResources],
  );

  return { serviceResources, isLoading, isSuccess };
};
