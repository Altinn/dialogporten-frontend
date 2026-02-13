import { useQuery } from '@tanstack/react-query';
import type { GetAllDialogsForPartiesQuery, SearchDialogFieldsFragment } from 'bff-types-generated';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';

/* Aggregate of unique dialogs during user session for relevance, powered by useDialogs */
export const useDialogsForRecommendations = (): SearchDialogFieldsFragment[] => {
  const { data: recommendationsCache } = useQuery<GetAllDialogsForPartiesQuery>({
    queryKey: [QUERY_KEYS.DIALOGS_FOR_RECOMMENDATIONS],
    enabled: false,
    queryFn: async () => ({ searchDialogs: { items: [], hasNextPage: false } }),
  });
  return recommendationsCache?.searchDialogs?.items ?? [];
};
