import type { GetNotificationAddressByOrgNumberQuery } from 'bff-types-generated';
import { useAuthenticatedQuery } from '../../auth/useAuthenticatedQuery.tsx';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { graphQLSDK } from '../queries.ts';

export const useNotificationAddressByOrgNumber = (orgnr: string | undefined) => {
  const { data, isLoading } = useAuthenticatedQuery<GetNotificationAddressByOrgNumberQuery>({
    queryKey: [QUERY_KEYS.NOTIFICATION_ADDRESS_BY_ORG_NUMBER, orgnr],
    staleTime: 300_000,
    retry: false,
    queryFn: async () => graphQLSDK.getNotificationAddressByOrgNumber({ orgnr: orgnr ?? '' }),
    enabled: !!orgnr,
  });

  const status = data?.getNotificationAddressByOrgNumber?.status;
  // Only a 403 means the user lacks access to this org's mandatory notification addresses.
  // A 404 (no addresses configured yet) or a successful response should still show the link.
  const hasAccess = status !== 403;

  return { hasAccess, isLoading };
};
