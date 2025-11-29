import type { FilterState } from '@altinn/altinn-components/dist/types/lib/components/Toolbar/Toolbar';
import { keepPreviousData, useQueryClient } from '@tanstack/react-query';
import type { DialogStatus, GetAllDialogsForPartiesQuery, PartyFieldsFragment, SystemLabel } from 'bff-types-generated';
import { useEffect, useRef } from 'react';
import { useAuthenticatedInfiniteQuery } from '../../auth/useAuthenticatedInfiniteQuery.tsx';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { useFeatureFlag } from '../../featureFlags';
import { useFormat } from '../../i18n/useDateFnsLocale.tsx';
import type { InboxItemInput } from '../../pages/Inbox/InboxItemInput.ts';
import { normalizeFilterDefaults } from '../../pages/Inbox/filters.ts';
import { useOrganizations } from '../../pages/Inbox/useOrganizations.ts';
import { graphQLSDK } from '../queries.ts';
import { getPartyIds, mapDialogToToInboxItems } from '../utils/dialog.ts';
import { useParties } from './useParties.ts';

export type InboxViewType = 'inbox' | 'drafts' | 'sent' | 'archive' | 'bin';
export type DialogsByView = { [key in InboxViewType]: InboxItemInput[] };

interface UseDialogsProps {
  queryKey: string;
  parties?: PartyFieldsFragment[];
  viewType?: InboxViewType;
  filterState?: FilterState;
  search?: string;
}

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

export const useDialogs = ({ parties, viewType, filterState, search, queryKey }: UseDialogsProps): UseDialogsOutput => {
  const { organizations } = useOrganizations();
  const disableFlipNamesPatch = useFeatureFlag<boolean>('dialogporten.disableFlipNamesPatch');

  const disableDialogCount = useFeatureFlag<boolean>('inbox.disableDialogCount');
  const { selectedParties, isSelfIdentifiedUser } = useParties();
  const format = useFormat();
  const partiesToUse = parties ? parties : selectedParties;
  const partyIds = getPartyIds(partiesToUse, true);
  const previousTokensRef = useRef<string>('');
  const viewTypeKey = viewType ?? 'global';
  const queryVariables = normalizeFilterDefaults({
    filters: {
      partyURIs: partyIds,
      status: filterState?.status ? (filterState.status as [DialogStatus]) : undefined,
      org: Array.isArray(filterState?.org) && filterState?.org?.length > 0 ? (filterState?.org as string[]) : undefined,
      systemLabel: filterState?.systemLabel as SystemLabel[] | undefined,
      updatedAfter: filterState?.updated,
    },
    viewType,
    searchQuery: search,
  });

  const { data, isSuccess, isLoading, isFetching, isError, fetchNextPage, isFetchingNextPage, isPlaceholderData } =
    useAuthenticatedInfiniteQuery<GetAllDialogsForPartiesQuery>({
      queryKey: [queryKey, partyIds, viewTypeKey, queryVariables, search],
      staleTime: 1000 * 60 * 10,
      retry: 3,
      queryFn: (args) => {
        const continuationToken = args.pageParam as string | undefined;
        const searchString = (search ?? '').length >= 3 ? search : undefined;
        return graphQLSDK.getAllDialogsForParties({
          ...queryVariables,
          continuationToken,
          limit: 100,
          search: searchString,
        });
      },
      enabled: partyIds.length > 0 && partyIds.length <= 20 && !isSelfIdentifiedUser,
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

  const queryClient = useQueryClient();

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (disableDialogCount && data) {
      const allItems = data.pages.flatMap((page) => page.searchDialogs?.items ?? []) ?? [];
      const hasNextPage = data.pages[data.pages.length - 1]?.searchDialogs?.hasNextPage ?? false;
      queryClient.setQueryData([QUERY_KEYS.COUNT_DIALOGS], {
        searchDialogs: {
          items: allItems,
          hasNextPage,
        },
      });
    }
  }, [disableDialogCount, data, selectedParties]);

  const content = data?.pages.flatMap((page) => page.searchDialogs?.items ?? []) || [];
  const dialogCountInconclusive =
    data?.pages?.[data?.pages.length - 1]?.searchDialogs?.hasNextPage === true ||
    data?.pages?.[data?.pages.length - 1]?.searchDialogs?.items === null ||
    partyIds.length >= 20;
  const dialogs = mapDialogToToInboxItems(content, parties ?? [], organizations, format, disableFlipNamesPatch);
  /*  isFetching && isPlaceholderData is used to determine if we are fetching the initial data for the query key */
  const isActuallyLoading = isLoading || (isFetching && isPlaceholderData);

  return {
    isLoading: isActuallyLoading,
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
