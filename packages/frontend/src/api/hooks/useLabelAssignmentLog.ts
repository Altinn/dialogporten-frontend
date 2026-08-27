import type { LabelAssignmentLogFieldsFragment, LabelAssignmentLogQuery } from 'bff-types-generated';
import { useAuthenticatedQuery } from '../../auth/useAuthenticatedQuery.ts';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { graphQLSDK } from '../queries.ts';

interface UseLabelAssignmentLogOutput {
  entries: LabelAssignmentLogFieldsFragment[];
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
}

export const useLabelAssignmentLog = (dialogId: string | undefined): UseLabelAssignmentLogOutput => {
  // TODO: should be feature flag
  const enabled = true;
  const { data, isLoading, isSuccess, isError } = useAuthenticatedQuery<LabelAssignmentLogQuery>({
    queryKey: [QUERY_KEYS.LABEL_ASSIGNMENT_LOG, dialogId],
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    queryFn: async () => graphQLSDK.labelAssignmentLog({ dialogId: dialogId ?? '' }),
    enabled: enabled && !!dialogId,
  });

  return {
    entries: data?.labelAssignmentLog?.labelAssignmentLog ?? [],
    isLoading,
    isSuccess,
    isError,
  };
};
