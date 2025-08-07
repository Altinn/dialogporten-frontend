import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type {
  CountableDialogFieldsFragment,
  GetAllDialogsForCountQuery,
  PartyFieldsFragment,
} from 'bff-types-generated';
import { useMemo } from 'react';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { graphQLSDK } from '../queries.ts';
import { getPartyIds, getQueryVariables } from '../utils/dialog.ts';
import { getViewTypes } from '../utils/viewType.ts';
import type { InboxViewType } from './useDialogs.tsx';
import { useParties } from './useParties.ts';

export type DialogsByViewCount = { [key in InboxViewType]: CountableDialogFieldsFragment[] };
interface UseDialogsOutput {
  dialogCountInconclusive: boolean;
  dialogCountsByViewType: DialogsByViewCount;
  dialogCounts: CountableDialogFieldsFragment[];
}

export const useDialogsCount = (parties?: PartyFieldsFragment[], viewType?: InboxViewType): UseDialogsOutput => {
  const { selectedParties } = useParties();
  const partiesToUse = parties ? parties : selectedParties;
  const partyIds = getPartyIds(partiesToUse);

  const { data } = useQuery<GetAllDialogsForCountQuery>({
    queryKey: [QUERY_KEYS.COUNT_DIALOGS, partyIds, viewType],
    staleTime: 1000 * 60 * 10,
    retry: 3,
    queryFn: () =>
      graphQLSDK.getAllDialogsForCount(
        getQueryVariables({
          viewType,
          variables: {
            partyURIs: partyIds,
            limit: 1000, // TODO: Adjust limit based on performance and requirements
          },
        }),
      ),
    enabled: partyIds.length > 0 && partyIds.length <= 20,
    gcTime: 10 * 1000,
    placeholderData: keepPreviousData,
  });

  const dialogCountsByViewType = useMemo(() => {
    const items = data?.searchDialogs?.items ?? [];
    const counts: DialogsByViewCount = {
      inbox: [],
      drafts: [],
      sent: [],
      archive: [],
      bin: [],
    };

    for (const dialog of items) {
      const viewType = getViewTypes({ status: dialog.status, systemLabel: dialog.endUserContext?.systemLabels })[0];
      if (viewType && counts[viewType]) {
        counts[viewType].push(dialog);
      }
    }
    return counts;
  }, [data]);

  return {
    dialogCountsByViewType,
    dialogCountInconclusive: data?.searchDialogs?.hasNextPage ?? false,
    dialogCounts: data?.searchDialogs?.items ?? [],
  };
};
