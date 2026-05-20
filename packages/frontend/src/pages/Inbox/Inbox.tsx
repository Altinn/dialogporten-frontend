import {
  BookmarkModal,
  BulkFooter,
  BulkHeader,
  Button,
  DialogList,
  DsAlert,
  DsParagraph,
  type FilterState,
  Heading,
  PageBase,
  type SeenByLogItemProps,
  Toolbar,
  ToolbarFilter,
  ToolbarMenu,
  ToolbarSearch,
  Typography,
} from '@altinn/altinn-components';
import { XMarkIcon } from '@navikt/aksel-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useSearchParams } from 'react-router-dom';
import { MAX_COUNT_BULK_DIALOGS, useBulkActions } from '../../api/hooks/useBulkActions.tsx';
import {
  type InboxViewType,
  MAX_DIALOG_PARTY_SIZE,
  MAX_SERVICE_RESOURCE_SIZE,
  isDialogQueryEnabled,
  useDialogs,
} from '../../api/hooks/useDialogs.tsx';
import { useParties } from '../../api/hooks/useParties.ts';
import { createFiltersURLQuery } from '../../auth';
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
import { useGlobalState } from '../../useGlobalState.ts';
import { useSavedSearches } from '../SavedSearches/useSavedSearches.tsx';
import { PageRoutes } from '../routes.ts';
import { AccountNavigator } from './AccountNavigator.tsx';
import { AlertBanner } from './AlertBanner.tsx';
import { Altinn2ActiveSchemasNotification } from './Altinn2ActiveSchemasNotification.tsx';
import { FilterCategory, hasValidFilters, readFiltersFromURLQuery } from './filters';
import styles from './inbox.module.css';
import {
  FixedGlobalQueryParams,
  VariableGlobalQueryParams,
  encodeSubAccountIds,
  getSelectedSubAccountsFromQueryParams,
} from './queryParams.ts';
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
    partyGraph,
    organizationLimitReached,
  } = useParties();

  const { saveSearch, onSaveSearch, onDeleteSavedSearch } = useSavedSearches(selectedPartyIds);
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
  const alertBannerContent = useAlertBanner();

  const onFiltersChange = useCallback(
    (filters: FilterState, clearSearch = false) => {
      // Update state synchronously so ToolbarFilter sees it immediately
      setFilterState(filters);

      const allowedFilters = Object.values(FilterCategory);
      setSearchParams(
        (prev) => {
          const baseURL = new URL(`${window.location.origin}${window.location.pathname}?${prev.toString()}`);
          const next = createFiltersURLQuery(filters, allowedFilters, baseURL.toString()).searchParams;
          if (clearSearch) {
            next.delete(VariableGlobalQueryParams.search);
          }
          return next;
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
  const serviceLimitReached = selectedServicesCount > MAX_SERVICE_RESOURCE_SIZE;

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

  const partyIdsFromParams = useMemo(() => getSelectedSubAccountsFromQueryParams(searchParams), [searchParams]);
  const hasSubAccountOverrideWithinLimit =
    !!partyIdsFromParams.length && partyIdsFromParams.length <= MAX_DIALOG_PARTY_SIZE;
  const {
    subAccounts,
    getSubAccountLabel,
    partyIdsOverride,
    searchable: subAccountsSearchable,
    subAccountGroups,
    accountNavigatorHidden,
  } = useSubAccounts({
    accounts,
    selectedParties,
    allOrganizationsSelected,
    selectedServicesCount,
    hasSubAccountOverrideWithinLimit,
  });
  const searchMode = hasValidFilters(filterState) || !!validSearchString;
  const showSubAccountsMenu = subAccounts.length > 0;
  const allSubAccountsSelected = partyIdsOverride?.length === 0;

  const isLimitReached = !isDialogQueryEnabled({
    queryPartyURIs: allSubAccountsSelected ? (organizationLimitReached ? [] : selectedPartyIds) : partyIdsOverride,
    serviceResources: selectedServices,
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

  const { bookmarkModalProps, openSaveModal, openEditModal } = useBookmarkModal({
    filterState: savedSearchFilterState,
    enteredSearchValue,
    viewType,
    selectedPartyIds,
    saveSearch,
    updateSavedSearchTitle: (id, name) => onSaveSearch?.(id, name) ?? Promise.resolve(),
    deleteSavedSearch: onDeleteSavedSearch,
  });

  const savedSearchDisabled = isSavedSearchDisabled(savedSearchFilterState, partyIdsOverride, enteredSearchValue);
  const onResetAllFilter = () => {
    onFiltersChange({}, true);
  };

  const {
    dialogs,
    isLoading: isLoadingDialogs,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  } = useDialogs({
    viewType,
    filterState,
    search: validSearchString,
    serviceResources: selectedServices,
    partyIdsOverride: partyIdsOverride?.length ? partyIdsOverride : [],
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

  const { groupedDialogs, groups, title, description } = useGroupedDialogs({
    onSeenByLogModalChange: setCurrentSeenByLogModal,
    items: dialogs,
    hasNextPage,
    displaySearchResults: searchMode,
    filters: filterState,
    filterState,
    onFiltersChange,
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
      {!searchMode && (
        <Heading as="h1" size="xl">
          {t(getPageRouteTitle(PageRoutes[viewType]))}
        </Heading>
      )}
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
              showResetButton={false}
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
            {searchMode && !bulkMode && (
              <Button onClick={onResetAllFilter} variant="ghost">
                <XMarkIcon aria-hidden="true" />
                <span>{t('filter_bar.reset_filters')}</span>
              </Button>
            )}
            <SaveSearchButton
              viewType={viewType}
              hidden={savedSearchDisabled || bulkMode}
              filterState={savedSearchFilterState}
              onSaveClick={openSaveModal}
              onEditClick={openEditModal}
            />
          </Toolbar>
        ) : (
          <Toolbar>
            <Button as="div" loading>
              {t('word.loading')}
            </Button>
          </Toolbar>
        )}
      </div>
      <SINotice />
      <AlertBanner showAlertBanner={isAlertBannerEnabled && !!alertBannerContent} />
      {isAltinn2MessagesEnabled && <Altinn2ActiveSchemasNotification selectedAccountId={selectedParties?.[0]?.party} />}
      <>
        <AccountNavigator
          hidden={accountNavigatorHidden}
          subAccounts={subAccounts}
          partyIdsOverride={partyIdsOverride}
        />
        {serviceLimitReached && (
          <Typography variant="subtle" size="sm">
            <p>{t('inbox.service_limit_reached.description', { count: MAX_SERVICE_RESOURCE_SIZE })} </p>
          </Typography>
        )}
        <DialogList
          title={
            isLimitReached ? undefined : searchMode ? (
              isLoading ? (
                <Heading as="h2" loading>
                  {t('word.loading')}
                </Heading>
              ) : (
                title
              )
            ) : undefined
          }
          items={dialogItems}
          groups={dialogListGroups}
          sortGroupBy={sortGroupBy}
          isLoading={isLoading}
          highlightWords={highlightWords}
          description={isLimitReached ? undefined : description}
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
