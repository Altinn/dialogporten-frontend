import type { VerifiedAddressesQuery } from 'bff-types-generated';
import { getVerifiedAddresses } from '../../api/queries.ts';
import { useAuthenticatedQuery } from '../../auth/useAuthenticatedQuery.tsx';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';

export const useVerifiedAddresses = () => {
  const { data, isLoading } = useAuthenticatedQuery<VerifiedAddressesQuery>({
    queryKey: [QUERY_KEYS.VERIFIED_ADDRESSES],
    queryFn: () => getVerifiedAddresses(),
    refetchOnWindowFocus: false,
  });

  return {
    verifiedAddresses: data?.verifiedAddresses ?? [],
    isLoading,
  };
};
