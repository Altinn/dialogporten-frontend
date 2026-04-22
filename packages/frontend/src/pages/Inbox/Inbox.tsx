import { BulkFooter, BulkHeader, type FilterState, ToolbarFilter, ToolbarSearch } from '@altinn/altinn-components';
import {
  BookmarkModal,
  Button,
  DialogList,
  DsAlert,
  DsParagraph,
  Heading,
  PageBase,
  type SeenByLogItemProps,
  Toolbar,
  ToolbarMenu,
} from '@altinn/altinn-components';
import type { TFunction } from 'i18next';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useSearchParams } from 'react-router-dom';
import { MAX_COUNT_BULK_DIALOGS, useBulkActions } from '../../api/hooks/useBulkActions.tsx';
import { type InboxViewType, MAX_DIALOG_PARTY_SIZE, useDialogs } from '../../api/hooks/useDialogs.tsx';
import { useParties } from '../../api/hooks/useParties.ts';
import { createFiltersURLQuery } from '../../auth';
import { EmptyState } from '../../components/EmptyState/EmptyState.tsx';
import { Notice } from '../../components/Notice';
import { useAccounts } from '../../components/PageLayout/Accounts/useAccounts.tsx';
import { useSearchString } from '../../components/PageLayout/Search/';
import { getPageRouteTitle } from '../../components/PageLayout/pageRouteToTitle.ts';
import { useHeaderConfig } from '../../components/PageLayout/useHeaderConfig.tsx';
import { SINotice } from '../../components/SINotice/SINotice.tsx';
import { SaveSearchButton } from '../../components/SavedSearchButton/SaveSearchButton.tsx';
import { isSavedSearchDisabled } from '../../components/SavedSearchButton/savedSearchEnabled.ts';
import { SeenByModal } from '../../components/SeenByModal/SeenByModal.tsx';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { useFeatureFlag } from '../../featureFlags';
import { useAlertBanner } from '../../hooks/useAlertBanner.ts';
import { usePageTitle } from '../../hooks/usePageTitle.tsx';
import { useInboxOnboarding } from '../../onboardingTour';
import { useGlobalState } from '../../useGlobalState.ts';
import { useSavedSearches } from '../SavedSearches/useSavedSearches.tsx';
import { PageRoutes } from '../routes.ts';
import { AlertBanner } from './AlertBanner.tsx';
import { Altinn2ActiveSchemasNotification } from './Altinn2ActiveSchemasNotification.tsx';
import { FilterCategory, hasValidFilters, readFiltersFromURLQuery } from './filters';
import styles from './inbox.module.css';
import { FixedGlobalQueryParams, encodeSubAccountIds } from './queryParams.ts';
import { useBookmarkModal } from './useBookmarkModal.tsx';
import { useFilters } from './useFilters.tsx';
import useGroupedDialogs from './useGroupedDialogs.tsx';
import { useMockError } from './useMockError.tsx';
import { useSubAccounts } from './useSubAccounts.tsx';

interface InboxProps {
  viewType: InboxViewType;
}

export interface CurrentSeenByLog {
  title: string;
  dialogId: string;
  items: SeenByLogItemProps[];
}

type LimitReachedNoticeContent = {
  title: string;
  description: string;
};

const getLimitReachedNoticeContent = ({
  t,
  isSubPartiesLimitReached,
  shouldShowSubAccountsNudge,
  isServiceFilterEnabled,
  selectedPartiesCount,
  subAccountsCount,
  currentAccountName,
}: {
  t: TFunction;
  isSubPartiesLimitReached: boolean;
  shouldShowSubAccountsNudge: boolean;
  isServiceFilterEnabled: boolean;
  selectedPartiesCount: number;
  subAccountsCount: number;
  currentAccountName?: string;
}): LimitReachedNoticeContent => {
  if (isSubPartiesLimitReached) {
    if (currentAccountName) {
      return {
        title: t('subAccountsLimitReached.title'),
        description: t('subAccountsLimitReached.withOrg.description', {
          count: subAccountsCount,
          orgName: currentAccountName,
          limit: MAX_DIALOG_PARTY_SIZE,
        }),
      };
    }
    return {
      title: t('subAccountsLimitReached.title'),
      description: t('subAccountsLimitReached.description', { count: subAccountsCount, limit: MAX_DIALOG_PARTY_SIZE }),
    };
  }

  if (shouldShowSubAccountsNudge) {
    return {
      title: t('organizationLimitReached.subAccounts.title'),
      description: t('organizationLimitReached.subAccounts.description', {
        count: selectedPartiesCount,
        limit: MAX_DIALOG_PARTY_SIZE,
      }),
    };
  }

  if (isServiceFilterEnabled) {
    return {
      title: t('organizationLimitReached.serviceFilter.title'),
      description: t('organizationLimitReached.serviceFilter.description', {
        count: selectedPartiesCount,
        limit: MAX_DIALOG_PARTY_SIZE,
      }),
    };
  }

  return {
    title: t('organizationLimitReached.title'),
    description: t('organizationLimitReached.description', {
      count: selectedPartiesCount,
      limit: MAX_DIALOG_PARTY_SIZE,
    }),
  };
};

export const Inbox = ({ viewType }: InboxProps) => {
  useMockError();
  const { t } = useTranslation();

  const {
    selectedParties,
    selectedPartyIds,
    setSelectedPartyIds,
    allOrganizationsSelected,
    parties,
    partiesEmptyList,
    isError: unableToLoadParties,
    isLoading: isLoadingParties,
    organizationLimitReached,
    partyGraph,
  } = useParties();

  const { items: savedSearchItems, onSaveSearch, onCloseSavedSearch } = useSavedSearches(selectedPartyIds);
  const { bookmarkModalProps, onSaveSuccess } = useBookmarkModal(savedSearchItems, onSaveSearch, onCloseSavedSearch);
  const [bulkMode, setBulkMode] = useGlobalState<boolean>(QUERY_KEYS.BULK_MODE, false);
  const [bulkedIds, setBulkedIds] = useGlobalState<string[]>(QUERY_KEYS.BULK_MODE_SELECTED_IDS, []);
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentSeenByLogModal, setCurrentSeenByLogModal] = useState<CurrentSeenByLog | null>(null);
  const subAccountsParam = searchParams.get(FixedGlobalQueryParams.subAccounts) ?? '';

  const [filterState, setFilterState] = useState<FilterState>(() => readFiltersFromURLQuery(searchParams.toString()));

  // Sync URL → filterState for external navigation (back button, link clicks, etc.)
  useEffect(() => {
    setFilterState(readFiltersFromURLQuery(searchParams.toString()));
  }, [searchParams]);

  const { inboxSearch } = useHeaderConfig(filterState);

  const isAltinn2MessagesEnabled = useFeatureFlag<boolean>('inbox.enableAltinn2Messages');
  const isAlertBannerEnabled = useFeatureFlag<boolean>('inbox.enableAlertBanner');
  const isServiceFilterEnabled = useFeatureFlag<boolean>('filters.enableServiceFilter');
  const isSubAccountsMenuEnabled = useFeatureFlag<boolean>('filters.enableSubAccountsMenu');
  const alertBannerContent = useAlertBanner();

  const onFiltersChange = useCallback(
    (filters: FilterState) => {
      // Update state synchronously so ToolbarFilter sees it immediately
      setFilterState(filters);

      const allowedFilters = Object.values(FilterCategory);
      setSearchParams(
        (prev) => {
          const baseURL = new URL(`${window.location.origin}${window.location.pathname}?${prev.toString()}`);
          return createFiltersURLQuery(filters, allowedFilters, baseURL.toString()).searchParams;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const { enteredSearchValue } = useSearchString();
  const validSearchString = enteredSearchValue.length > 2 ? enteredSearchValue : undefined;
  const selectedServices = (filterState.service ?? []) as string[];
  const selectedServicesCount = selectedServices.length;
  const serviceLimitReached = selectedServicesCount > 20;

  const { accounts, accountSearch, accountGroups, onSelectAccount, currentAccountName } = useAccounts({
    parties,
    selectedParties,
    allOrganizationsSelected,
    partyGraph,
    setSelectedPartyIds,
    options: {
      showGroups: true,
    },
  });

  const {
    subAccounts,
    getSubAccountLabel,
    partyIdsOverride,
    searchable: subAccountsSearchable,
    subAccountGroups,
  } = useSubAccounts({
    accounts,
    selectedParties,
    allOrganizationsSelected,
  });
  const searchMode = hasValidFilters(filterState) || !!validSearchString;
  const showSubAccountsMenu = isSubAccountsMenuEnabled && subAccounts.length > 0;
  const isSubPartiesLimitReached =
    isSubAccountsMenuEnabled &&
    ((subAccounts.length > MAX_DIALOG_PARTY_SIZE && !partyIdsOverride.length) ||
      partyIdsOverride.length > MAX_DIALOG_PARTY_SIZE);
  const subAccountsCount = Math.max(subAccounts.length - 1, 0);
  const hasSubAccountOverrideWithinLimit =
    isSubAccountsMenuEnabled && !!partyIdsOverride?.length && partyIdsOverride.length <= MAX_DIALOG_PARTY_SIZE;
  const shouldShowSubAccountsNudge = isSubAccountsMenuEnabled && (!partyIdsOverride || partyIdsOverride.length === 0);
  const organizationLimitApplies = organizationLimitReached && !hasSubAccountOverrideWithinLimit;

  const isLimitReached =
    (organizationLimitApplies && !isServiceFilterEnabled) ||
    (organizationLimitApplies && isServiceFilterEnabled && selectedServicesCount === 0) ||
    (organizationLimitApplies && isServiceFilterEnabled && serviceLimitReached) ||
    isSubPartiesLimitReached ||
    selectedServicesCount > 20;

  const limitReachedNoticeContent = getLimitReachedNoticeContent({
    t,
    isSubPartiesLimitReached,
    shouldShowSubAccountsNudge,
    isServiceFilterEnabled,
    selectedPartiesCount: selectedParties.length,
    subAccountsCount,
    currentAccountName,
  });
  const subAccountsParamForSave = useMemo(() => {
    if (subAccountsParam) return subAccountsParam;
    return encodeSubAccountIds(partyIdsOverride ?? []) ?? '';
  }, [partyIdsOverride, subAccountsParam]);

  const savedSearchFilterState = useMemo<FilterState>(() => {
    if (!subAccountsParamForSave) return filterState;
    return {
      ...filterState,
      [FixedGlobalQueryParams.subAccounts]: [subAccountsParamForSave],
    };
  }, [filterState, subAccountsParamForSave]);

  const savedSearchDisabled = isSavedSearchDisabled(savedSearchFilterState, partyIdsOverride, enteredSearchValue);

  const {
    dialogs,
    isLoading: isLoadingDialogs,
    isSuccess: dialogsSuccess,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  } = useDialogs({
    viewType,
    filterState,
    search: validSearchString,
    serviceResources: selectedServices,
    partyIdsOverride: isSubAccountsMenuEnabled && partyIdsOverride?.length ? partyIdsOverride : [],
  });

  const onCloseBulkMode = useCallback(() => {
    setBulkMode(false);
    setBulkedIds([]);
  }, [setBulkMode, setBulkedIds]);

  const onSelectAll = useCallback(() => {
    setBulkedIds(dialogs.map((d) => d.id).slice(0, MAX_COUNT_BULK_DIALOGS));
  }, [dialogs, setBulkedIds]);

  const { footerActions, headerActions } = useBulkActions({
    selectedDialogIds: bulkedIds,
    allDialogs: dialogs,
    onSelectAll,
    onDismiss: onCloseBulkMode,
  });

  const { filters, getFilterLabel } = useFilters({ viewType });

  usePageTitle({
    baseTitle: viewType,
    searchValue: enteredSearchValue,
    filterState,
    getFilterLabel,
  });

  const isLoading = isLoadingParties || isLoadingDialogs;

  // biome-ignore lint/correctness/useExhaustiveDependencies: This hook does not specify all of its dependencies
  useEffect(() => {
    const scrollToId = location?.state?.scrollToId;
    const listElToScroll = document.getElementById(scrollToId);
    if (!isLoading) {
      if (listElToScroll) {
        listElToScroll.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [isLoading]);

  useInboxOnboarding({
    isLoadingParties,
    isLoadingDialogs,
    dialogsSuccess,
    dialog: dialogs[0] || null,
    viewType,
  });

  const { groupedDialogs, groups } = useGroupedDialogs({
    onSeenByLogModalChange: setCurrentSeenByLogModal,
    items: dialogs,
    hasNextPage,
    displaySearchResults: searchMode,
    filters: filterState,
    viewType,
    isLoading,
    isFetchingNextPage,
  });

  const dialogItems = useMemo(() => {
    return isLimitReached ? [] : groupedDialogs;
  }, [groupedDialogs, isLimitReached]);

  const dialogListGroups = useMemo(() => {
    const firstKey = Object.keys(groups)[0];
    if (!firstKey) return groups;
    return {
      ...groups,
      [firstKey]: {
        title: <span className={styles.searchButtonWrapper}>{groups[firstKey]?.title}</span>,
      },
    };
  }, [groups]);

  const sortGroupBy = useCallback(
    ([aKey]: [string, unknown], [bKey]: [string, unknown]) =>
      (groups[bKey]?.orderIndex ?? 0) - (groups[aKey]?.orderIndex ?? 0),
    [groups],
  );

  const highlightWords = useMemo(
    () => (searchMode ? [enteredSearchValue] : undefined),
    [searchMode, enteredSearchValue],
  );

  if (unableToLoadParties) {
    return (
      <PageBase>
        <Heading as="h1" size="xl">
          {t(getPageRouteTitle(PageRoutes[viewType]))}
        </Heading>
        <DsAlert data-color="danger">
          <Heading data-size="xs">{t('inbox.unable_to_load_parties.title')}</Heading>
          <DsParagraph>
            {t('inbox.unable_to_load_parties.body')}
            <a href="/api/logout">{t('inbox.unable_to_load_parties.link')}</a>
          </DsParagraph>
        </DsAlert>
      </PageBase>
    );
  }

  if (partiesEmptyList) {
    return (
      <PageBase>
        <Heading as="h1" size="xl">
          {t(getPageRouteTitle(PageRoutes[viewType]))}
        </Heading>
        <Notice title={t('inbox.no_parties_found')} />
      </PageBase>
    );
  }

  return (
    <PageBase>
      <BulkHeader
        hidden={!bulkMode}
        title={t(
          bulkedIds?.length >= MAX_COUNT_BULK_DIALOGS
            ? 'bulk_action.header.selected_max_reached'
            : 'bulk_action.header.selected',
          { count: bulkedIds?.length ?? 0 },
        )}
        options={headerActions}
        dismissable={true}
        onDismiss={onCloseBulkMode}
        color={bulkedIds.length >= MAX_COUNT_BULK_DIALOGS ? 'warning' : 'company'}
      />
      {!searchMode && <Heading as="h1" size="xl">
        {t(getPageRouteTitle(PageRoutes[viewType]))}
      </Heading>}
      <div data-testid="inbox-toolbar">
        {currentAccountName ? (
          <Toolbar>
            <ToolbarMenu
              disabled={bulkMode}
              size="md"
              items={accounts}
              search={accountSearch}
              groups={accountGroups}
              label={currentAccountName}
              onSelectId={(id: string) => {
                onSelectAccount(id, PageRoutes[viewType]);
              }}
              title={t('parties.change_label')}
              searchable
              virtualized
            />
            {showSubAccountsMenu && (
              <ToolbarMenu
                disabled={bulkMode}
                id="toolbarmenu-subAccounts"
                items={subAccounts}
                groups={subAccountGroups}
                label={getSubAccountLabel()}
                searchable={subAccountsSearchable}
                virtualized
              />
            )}
            <ToolbarSearch {...inboxSearch} disabled={bulkMode} />
            <ToolbarFilter
              disabled={bulkMode}
              filters={filters}
              filterState={filterState}
              onFilterStateChange={onFiltersChange}
              getFilterLabel={(name: string, filterValues: (string | number)[] | undefined) =>
                getFilterLabel?.(name, filterValues, filterState)
              }
              addLabel={t('filter_bar.add_filter')}
              addNextLabel={t('filter_bar.add')}
              resetLabel={t('filter_bar.reset_filters')}
              submitLabel={t('filter.show_all_results')}
              removeLabel={t('filter_bar.remove_filter')}
            />
            <SaveSearchButton
              viewType={viewType}
              disabled={savedSearchDisabled}
              filterState={savedSearchFilterState}
              onSaveSuccess={onSaveSuccess}
            />
          </Toolbar>
        ) : null}
      </div>
      <SINotice />
      <AlertBanner showAlertBanner={isAlertBannerEnabled && !!alertBannerContent} />
      {isAltinn2MessagesEnabled && <Altinn2ActiveSchemasNotification selectedAccountId={selectedParties?.[0]?.party} />}
      {dialogsSuccess && !dialogItems.length && !isLoading && !isLimitReached && (
        <EmptyState viewType={viewType} savable={searchMode || !!(partyIdsOverride?.length ?? 0)} />
      )}
      {isLimitReached && (
        <Notice title={limitReachedNoticeContent.title} description={limitReachedNoticeContent.description} />
      )}
      <>
        <DialogList
          items={dialogItems}
          groups={dialogListGroups}
          sortGroupBy={sortGroupBy}
          isLoading={isLoading}
          highlightWords={highlightWords}
        />
        {hasNextPage && (
          <Button aria-label={t('dialog.aria.fetch_more')} onClick={fetchNextPage} variant="outline" size="lg">
            <span data-size="md">{t('dialog.fetch_more')}</span>
          </Button>
        )}
      </>
      <SeenByModal
        title={currentSeenByLogModal?.title}
        items={currentSeenByLogModal?.items}
        isOpen={!!currentSeenByLogModal}
        onClose={() => setCurrentSeenByLogModal(null)}
      />
      <BookmarkModal {...bookmarkModalProps} />
      {footerActions.length > 0 && <BulkFooter hidden={!bulkMode} actions={footerActions} />}
    </PageBase>
  );
};
