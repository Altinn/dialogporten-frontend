import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import type { GetAllDialogsForPartiesQuery, PartyFieldsFragment } from 'bff-types-generated';
import { useRef } from 'react';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import type { InboxItemInput } from '../../pages/Inbox/InboxItemInput.ts';
import { useOrganizations } from '../../pages/Inbox/useOrganizations.ts';
import { graphQLSDK } from '../queries.ts';
import { getPartyIds, getQueryVariables, mapDialogToToInboxItems } from '../utils/dialog.ts';
import { useParties } from './useParties.ts';

export type InboxViewType = 'inbox' | 'drafts' | 'sent' | 'archive' | 'bin';
export type DialogsByView = { [key in InboxViewType]: InboxItemInput[] };
interface UseDialogsOutput {
  dialogs: InboxItemInput[];
  dialogCountInconclusive: boolean;
  dialogsByView: DialogsByView;
  isSuccess: boolean;
  isLoading: boolean;
  isError: boolean;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
}

export const useDialogs = (parties: PartyFieldsFragment[], viewType?: InboxViewType): UseDialogsOutput => {
  const { organizations } = useOrganizations();
  const { selectedParties } = useParties();
  const partiesToUse = parties ? parties : selectedParties;
  const partyIds = getPartyIds(partiesToUse);
  const previousTokensRef = useRef<string>('');
  const viewTypeKey = viewType ?? 'global';

  const { data, isSuccess, isLoading, isError, fetchNextPage, isFetchingNextPage } =
    useInfiniteQuery<GetAllDialogsForPartiesQuery>({
      queryKey: [QUERY_KEYS.DIALOGS, partyIds, viewTypeKey],
      staleTime: 1000 * 60 * 10,
      retry: 3,
      queryFn: (args) => {
        const continuationToken = args.pageParam as string | undefined;
        return graphQLSDK.getAllDialogsForParties({
          partyURIs: partyIds,
          continuationToken,
          limit: 100,
          ...getQueryVariables(viewType),
        });
      },
      enabled: partyIds.length > 0,
      gcTime: 0,
      getNextPageParam(lastPage: GetAllDialogsForPartiesQuery): unknown | undefined | null {
        const hasNextPage = lastPage?.searchDialogs?.hasNextPage;
        const continuationToken = lastPage?.searchDialogs?.continuationToken;
        if (hasNextPage && typeof continuationToken === 'string') {
          previousTokensRef.current = continuationToken;
          return continuationToken;
        }
      },
      getPreviousPageParam(): unknown | undefined | null {
        return previousTokensRef;
      },
      initialData: undefined,
      initialPageParam: undefined,
      placeholderData: keepPreviousData,
    });

  const content = data?.pages.flatMap((page) => page.searchDialogs?.items ?? []) || [];
  const dialogCountInconclusive =
    data?.pages?.[data?.pages.length - 1]?.searchDialogs?.hasNextPage === true ||
    data?.pages?.[data?.pages.length - 1]?.searchDialogs?.items === null;
  const dialogs = mapDialogToToInboxItems(content, parties, organizations);

  return {
    isLoading,
    isSuccess,
    isError,
    fetchNextPage,
    dialogs,
    dialogsByView: {
      inbox: dialogs.filter((dialog) => dialog.viewType === 'inbox'),
      drafts: dialogs.filter((dialog) => dialog.viewType === 'drafts'),
      sent: dialogs.filter((dialog) => dialog.viewType === 'sent'),
      archive: dialogs.filter((dialog) => dialog.viewType === 'archive'),
      bin: dialogs.filter((dialog) => dialog.viewType === 'bin'),
    },
    dialogCountInconclusive,
    hasNextPage: data?.pages?.[data?.pages.length - 1]?.searchDialogs?.hasNextPage ?? false,
    isFetchingNextPage,
  };
};
