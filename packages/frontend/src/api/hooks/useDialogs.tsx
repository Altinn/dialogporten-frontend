import type { FilterState } from '@altinn/altinn-components';
import { keepPreviousData, useQueryClient } from '@tanstack/react-query';
import type {
  DialogStatus,
  GetAllDialogsForCountQuery,
  GetAllDialogsForPartiesQuery,
  SearchDialogFieldsFragment,
  SystemLabel,
} from 'bff-types-generated';
import i18n from 'i18next';
import { useEffect, useRef } from 'react';
import { useAuthenticatedInfiniteQuery } from '../../auth/useAuthenticatedInfiniteQuery.tsx';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { useFeatureFlag } from '../../featureFlags';
import { useFormat } from '../../i18n/useDateFnsLocale.tsx';
import type { InboxItemInput } from '../../pages/Inbox/InboxItemInput.ts';
import { normalizeFilterDefaults, removeUndefinedValues } from '../../pages/Inbox/filters';
import { useOrganizations } from '../../pages/Inbox/useOrganizations.ts';
import { useProfile } from '../../pages/Profile';
import { graphQLSDK } from '../queries.ts';
import { getPartyIds, mapDialogToToInboxItems, mergeDialogItems } from '../utils/dialog.ts';
import { useParties } from './useParties.ts';

export type InboxViewType = 'inbox' | 'drafts' | 'sent' | 'archive' | 'bin';

interface UseDialogsProps {
  filterState?: FilterState;
  search?: string;
  viewType: InboxViewType;
  serviceResources?: string[];
  partyIdsOverride?: string[];
}

interface UseDialogsOutput {
  dialogs: InboxItemInput[];
  dialogCountInconclusive: boolean;
  isSuccess: boolean;
  isLoading: boolean;
  isError: boolean;
  fetchNextPage: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
}

export const useDialogs = ({
  viewType,
  filterState,
  search,
  serviceResources = [],
  partyIdsOverride = [],
}: UseDialogsProps): UseDialogsOutput => {
  const { organizations } = useOrganizations();
  const disableFlipNamesPatch = useFeatureFlag<boolean>('dialogporten.disableFlipNamesPatch');
  const isDeletedUnitsFilterEnabled = useFeatureFlag<boolean>('inbox.enableDeletedUnitsFilter');
  const enableSubAccountsMenu = useFeatureFlag<boolean>('filters.enableSubAccountsMenu');
  const { shouldShowDeletedEntities } = useProfile();
  const { selectedParties, parties: allParties, allOrganizationsSelected } = useParties();
  const format = useFormat();

  const shouldExcludeDeleted = isDeletedUnitsFilterEnabled && !shouldShowDeletedEntities;
  const partiesToUse =
    allOrganizationsSelected && shouldExcludeDeleted
      ? selectedParties.filter((party) => !party.isDeleted)
      : selectedParties;

  const isPartyIdsOverridden = partyIdsOverride.length > 0;
  const partyIds = isPartyIdsOverridden ? partyIdsOverride : getPartyIds(partiesToUse, !enableSubAccountsMenu);
  const previousTokensRef = useRef<string>('');
  const viewTypeKey = viewType ?? 'global';
  const applicableParties =
    allOrganizationsSelected && !isPartyIdsOverridden && serviceResources?.length ? [] : partyIds;

  const queryVariables = normalizeFilterDefaults({
    filters: {
      partyURIs: applicableParties,
      status: filterState?.status ? (filterState.status as [DialogStatus]) : undefined,
      org: Array.isArray(filterState?.org) && filterState?.org?.length > 0 ? (filterState?.org as string[]) : undefined,
      systemLabel: filterState?.systemLabel as SystemLabel[] | undefined,
      updatedAfter: filterState?.updated,
      fromDate: filterState?.fromDate,
      toDate: filterState?.toDate,
      serviceResources,
    },
    viewType,
    searchQuery: search,
  });

  const queryClient = useQueryClient();
  const queryVariableKey = removeUndefinedValues(queryVariables);
  const previousPartyIdsRef = useRef<string[]>([]);

  const { data, isSuccess, isLoading, isFetching, isError, fetchNextPage, isFetchingNextPage, isPlaceholderData } =
    useAuthenticatedInfiniteQuery<GetAllDialogsForPartiesQuery>({
      queryKey: [QUERY_KEYS.DIALOGS, partyIds, viewTypeKey, queryVariableKey, search, serviceResources],
      staleTime: 1000 * 60 * 10,
      gcTime: 0,
      retry: 3,
      queryFn: (args) => {
        const continuationToken = args.pageParam as string | undefined;
        const searchString = (search ?? '').length >= 3 ? search : undefined; //min 3 characters to search, API requirement
        return graphQLSDK.getAllDialogsForParties({
          ...queryVariables,
          continuationToken,
          limit: 100,
          search: searchString,
          searchLanguageCode: i18n.language,
        });
      },
      enabled:
        partyIds.length > 0 &&
        partyIds.length <= 20 &&
        (applicableParties.length > 0 || serviceResources.length > 0) &&
        (applicableParties.length <= 20 || serviceResources.length <= 0),
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (!data) return;

    const partyIds = selectedParties.map((party) => party.party);
    const selectedPartiesChanged =
      !previousPartyIdsRef.current.length || partyIds.join(',') !== previousPartyIdsRef.current.join(',');
    const currentData = queryClient.getQueryData<GetAllDialogsForCountQuery>([QUERY_KEYS.DIALOGS_FOR_RECOMMENDATIONS]);
    const allNewItems: SearchDialogFieldsFragment[] =
      data.pages.flatMap((page) => page.searchDialogs?.items ?? []) ?? [];

    if (selectedPartiesChanged) {
      queryClient.setQueryData<GetAllDialogsForCountQuery>([QUERY_KEYS.DIALOGS_FOR_RECOMMENDATIONS], {
        searchDialogs: {
          items: allNewItems,
          hasNextPage: false,
        },
      });
    } else if (allNewItems.length === 0) {
      return;
    } else {
      const existingItems: SearchDialogFieldsFragment[] =
        !selectedPartiesChanged && currentData?.searchDialogs?.items
          ? (currentData.searchDialogs.items as SearchDialogFieldsFragment[])
          : [];

      const mergedItems = mergeDialogItems(existingItems, allNewItems);
      const hasNextPage = data.pages[data.pages.length - 1]?.searchDialogs?.hasNextPage ?? false;

      queryClient.setQueryData<GetAllDialogsForCountQuery>([QUERY_KEYS.DIALOGS_FOR_RECOMMENDATIONS], {
        searchDialogs: {
          items: mergedItems,
          hasNextPage,
        },
      });
    }
    previousPartyIdsRef.current = partyIds;
  }, [data, selectedParties]);

  const content = data?.pages.flatMap((page) => page.searchDialogs?.items ?? []) || [];
  const dialogCountInconclusive =
    data?.pages?.[data?.pages.length - 1]?.searchDialogs?.hasNextPage === true ||
    data?.pages?.[data?.pages.length - 1]?.searchDialogs?.items === null ||
    partyIds.length >= 20;
  const dialogs = mapDialogToToInboxItems(content, allParties, organizations, format, disableFlipNamesPatch);
  /*  isFetching && isPlaceholderData is used to determine if we are fetching the initial data for the query key */
  const isActuallyLoading = isLoading || (isFetching && isPlaceholderData);

  return {
    isLoading: isActuallyLoading,
    isSuccess,
    isError,
    fetchNextPage,
    dialogs,
    dialogCountInconclusive,
    hasNextPage: data?.pages?.[data?.pages.length - 1]?.searchDialogs?.hasNextPage ?? false,
    isFetchingNextPage,
  };
};
