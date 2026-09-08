import type { LabelAssignmentLogFieldsFragment, LabelAssignmentLogQuery } from 'bff-types-generated';
import { useAuthenticatedQuery } from '../../auth/useAuthenticatedQuery.ts';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { useFeatureFlag } from '../../featureFlags/useFeatureFlag.ts';
import { graphQLSDK } from '../queries.ts';

interface UseLabelAssignmentLogOutput {
  entries: LabelAssignmentLogFieldsFragment[];
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
}

export const useLabelAssignmentLog = (dialogId: string | undefined): UseLabelAssignmentLogOutput => {
  const enableLabelAssignmentLogs = useFeatureFlag<boolean>('dialogDetails.enableLabelAssignmentLogs');
  const { data, isLoading, isSuccess, isError } = useAuthenticatedQuery<LabelAssignmentLogQuery>({
    queryKey: [QUERY_KEYS.LABEL_ASSIGNMENT_LOG, dialogId],
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    queryFn: async () => graphQLSDK.labelAssignmentLog({ dialogId: dialogId ?? '' }),
    enabled: enableLabelAssignmentLogs && !!dialogId,
  });

  if (!enableLabelAssignmentLogs) {
    return { entries: [], isLoading: false, isSuccess: false, isError: false };
  }

  return {
    entries: data?.labelAssignmentLog?.labelAssignmentLog ?? [],
    isLoading,
    isSuccess,
    isError,
  };
};
