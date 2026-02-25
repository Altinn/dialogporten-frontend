import type { Altinn2messagesQuery } from 'bff-types-generated';
import { useAuthenticatedQuery } from '../../auth/useAuthenticatedQuery.tsx';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { useFeatureFlag } from '../../featureFlags';
import { fetchAltinn2Messages } from '../queries.ts';
import { useParties } from './useParties.ts';

export const useAltinn2Messages = (selectedAccountIdentifier?: string) => {
  const { isSelfIdentifiedUser } = useParties();
  const enabled =
    useFeatureFlag<boolean>('inbox.enableAltinn2Messages') && (isSelfIdentifiedUser || !!selectedAccountIdentifier);
  const { data, isLoading, isSuccess } = useAuthenticatedQuery<Altinn2messagesQuery>({
    queryKey: [QUERY_KEYS.ALTINN2_MESSAGES, selectedAccountIdentifier],
    queryFn: () => fetchAltinn2Messages(selectedAccountIdentifier ?? '', isSelfIdentifiedUser),
    retry: 3,
    staleTime: 1000 * 60 * 10,
    enabled,
  });

  return {
    altinn2messages: data?.altinn2messages ?? [],
    isLoading,
    isSuccess,
  };
};
