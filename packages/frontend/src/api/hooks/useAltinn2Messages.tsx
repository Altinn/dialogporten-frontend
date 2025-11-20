import type { Altinn2messagesQuery } from 'bff-types-generated';
import { useAuthenticatedQuery } from '../../auth/useAuthenticatedQuery.tsx';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { fetchAltinn2Messages } from '../queries.ts';

export const useAltinn2Messages = () => {
  const { data, isLoading, isSuccess } = useAuthenticatedQuery<Altinn2messagesQuery>({
    queryKey: [QUERY_KEYS.ALTINN2_MESSAGES],
    queryFn: () => fetchAltinn2Messages(),
    retry: 3,
    staleTime: 1000 * 60 * 10,
  });

  return {
    altinn2messages: data?.altinn2messages,
    isLoading,
    isSuccess,
  };
};
