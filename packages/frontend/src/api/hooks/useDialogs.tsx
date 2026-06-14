import type { FilterState } from '@altinn/altinn-components';
import { keepPreviousData, useQueryClient } from '@tanstack/react-query';
import type {
  DialogStatus,
  GetAllDialogsForPartiesQuery,
  SearchDialogFieldsFragment,
  SystemLabel,
} from 'bff-types-generated';
import i18n from 'i18next';
import { useEffect, useMemo, useRef } from 'react';
import { useAuthenticatedInfiniteQuery } from '../../auth/useAuthenticatedInfiniteQuery.tsx';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { useFeatureFlag } from '../../featureFlags';
import { useFormat } from '../../i18n/useDateFnsLocale.tsx';
import type { InboxItemInput } from '../../pages/Inbox/InboxItemInput.ts';
import { normalizeFilterDefaults, removeUndefinedValues } from '../../pages/Inbox/filters';
import { useOrganizations } from '../../pages/Inbox/useOrganizations.ts';
import { useProfile } from '../../pages/Profile';
import { getPartyIds, mapDialogToInboxItems, mergeDialogItems } from '../../utils/dialog.ts';
import { buildOrganizationMap } from '../../utils/organizations.ts';
import { graphQLSDK } from '../queries.ts';
import { useParties } from './useParties.ts';

/* Number of max parties used to fetch dialogs with party input param from Dialogporten */
export const MAX_DIALOG_PARTY_SIZE = 100;
export const MAX_SERVICE_RESOURCE_SIZE = 20;

export type InboxViewType = 'inbox' | 'drafts' | 'sent' | 'archive' | 'bin';

export const isDialogQueryEnabled = ({
  queryPartyURIs,
  serviceResources,
}: {
  queryPartyURIs: string[];
  serviceResources: string[];
}): boolean => {
  if (serviceResources.length > MAX_SERVICE_RESOURCE_SIZE) {
    return false;
  }

  if (serviceResources.length > 0) {
    return queryPartyURIs.length <= MAX_DIALOG_PARTY_SIZE;
  }

  return queryPartyURIs.length > 0 && queryPartyURIs.length <= MAX_DIALOG_PARTY_SIZE;
};

export const isDialogCountInconclusive = ({
  partyIds,
  hasNextPage,
  itemsIsNull,
}: {
  partyIds: string[];
  hasNextPage: boolean;
  itemsIsNull: boolean;
}): boolean => hasNextPage || itemsIsNull || partyIds.length >= MAX_DIALOG_PARTY_SIZE;

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
  isQueryEnabled: boolean;
  partyLimitExceeded: boolean;
  applicablePartyCount: number;
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
  const { shouldShowDeletedEntities } = useProfile();
  const { selectedParties, selectedGroup, allOrganizationsSelected, partyGraph } = useParties();
  const format = useFormat();
  const isGroupSelected = selectedGroup !== null;

  const partiesToUse = useMemo(() => {
    if (shouldShowDeletedEntities) return selectedParties;

    const withoutDeletedSubParties = selectedParties.map((party) => ({
      ...party,
      subParties: party.subParties?.filter((subParty) => !subParty.isDeleted) ?? party.subParties,
    }));

    return isGroupSelected ? withoutDeletedSubParties.filter((party) => !party.isDeleted) : withoutDeletedSubParties;
  }, [selectedParties, isGroupSelected, shouldShowDeletedEntities]);

  const isPartyIdsOverridden = partyIdsOverride.length > 0;
  const partyIds = useMemo(
    () => (isPartyIdsOverridden ? partyIdsOverride : getPartyIds(partiesToUse)),
    [isPartyIdsOverridden, partyIdsOverride, partiesToUse],
  );
  const previousTokensRef = useRef<string>('');
  const viewTypeKey = viewType ?? 'global';
  const queryPartyURIs = allOrganizationsSelected && !isPartyIdsOverridden && serviceResources?.length ? [] : partyIds;
  const isQueryEnabled = isDialogQueryEnabled({ queryPartyURIs, serviceResources });
  const partyLimitExceeded = queryPartyURIs.length > MAX_DIALOG_PARTY_SIZE;

  const queryVariables = normalizeFilterDefaults({
    filters: {
      partyURIs: queryPartyURIs,
      status: filterState?.status ? (filterState.status as [DialogStatus]) : undefined,
      org: Array.isArray(filterState?.org) && filterState?.org?.length > 0 ? (filterState?.org as string[]) : undefined,
      systemLabel: filterState?.systemLabel as SystemLabel[] | undefined,
      isContentSeen: filterState?.isContentSeen as string[] | undefined,
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
      enabled: isQueryEnabled,
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
    const currentData = queryClient.getQueryData<GetAllDialogsForPartiesQuery>([
      QUERY_KEYS.DIALOGS_FOR_RECOMMENDATIONS,
    ]);
    const allNewItems: SearchDialogFieldsFragment[] =
      data.pages.flatMap((page) => page.searchDialogs?.items ?? []) ?? [];

    if (selectedPartiesChanged) {
      queryClient.setQueryData<GetAllDialogsForPartiesQuery>([QUERY_KEYS.DIALOGS_FOR_RECOMMENDATIONS], {
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

      queryClient.setQueryData<GetAllDialogsForPartiesQuery>([QUERY_KEYS.DIALOGS_FOR_RECOMMENDATIONS], {
        searchDialogs: {
          items: mergedItems,
          hasNextPage,
        },
      });
    }
    previousPartyIdsRef.current = partyIds;
  }, [data, selectedParties]);

  const content = data?.pages.flatMap((page) => page.searchDialogs?.items ?? []) || [];
  const lastPage = data?.pages?.[data?.pages.length - 1];
  const dialogCountInconclusive = isDialogCountInconclusive({
    partyIds,
    hasNextPage: lastPage?.searchDialogs?.hasNextPage === true,
    itemsIsNull: lastPage?.searchDialogs?.items === null,
  });
  const orgMap = useMemo(() => buildOrganizationMap(organizations), [organizations]);
  const dialogs = mapDialogToInboxItems(content, partyGraph, orgMap, format, disableFlipNamesPatch);
  /*  isFetching && isPlaceholderData is used to determine if we are fetching the initial data for the query key */
  const isActuallyLoading = isLoading || (isFetching && isPlaceholderData);

  return {
    isLoading: isActuallyLoading,
    isSuccess,
    isError,
    fetchNextPage,
    dialogs,
    dialogCountInconclusive,
    hasNextPage: isQueryEnabled ? (data?.pages?.[data?.pages.length - 1]?.searchDialogs?.hasNextPage ?? false) : false,
    isFetchingNextPage,
    isQueryEnabled,
    partyLimitExceeded,
    applicablePartyCount: partyIds.length,
  };
};
