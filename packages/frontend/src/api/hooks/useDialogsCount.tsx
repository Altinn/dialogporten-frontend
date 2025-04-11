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
import { getViewType } from '../utils/viewType.ts';
import { useParties } from './useParties.ts';

export type InboxViewType = 'inbox' | 'drafts' | 'sent' | 'archive' | 'bin';
export type DialogsByViewCount = { [key in InboxViewType]: CountableDialogFieldsFragment[] };
interface UseDialogsOutput {
  dialogCountInconclusive: boolean;
  dialogCountsByViewType: DialogsByViewCount;
}

export const useDialogsCount = (parties: PartyFieldsFragment[], viewType?: InboxViewType): UseDialogsOutput => {
  const { selectedParties } = useParties();
  const partiesToUse = parties ? parties : selectedParties;
  const partyIds = getPartyIds(partiesToUse);

  const { data } = useQuery<GetAllDialogsForCountQuery>({
    queryKey: [QUERY_KEYS.COUNT_DIALOGS, partyIds, viewType],
    staleTime: 1000 * 60 * 10,
    retry: 3,
    queryFn: () =>
      graphQLSDK.getAllDialogsForCount({
        partyURIs: partyIds,
        ...getQueryVariables(viewType),
      }),
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
      const viewType = getViewType(dialog);
      if (counts[viewType]) {
        counts[viewType].push(dialog);
      }
    }
    return counts;
  }, [data]);

  return {
    dialogCountsByViewType,
    dialogCountInconclusive: data?.searchDialogs?.hasNextPage === true || data?.searchDialogs?.items === null,
  };
};
