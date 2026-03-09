import { type FilterState, ToolbarFilter, ToolbarSearch } from '@altinn/altinn-components';
import {
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
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useSearchParams } from 'react-router-dom';
import { type InboxViewType, useDialogs } from '../../api/hooks/useDialogs.tsx';
import { useParties } from '../../api/hooks/useParties.ts';
import { createFiltersURLQuery } from '../../auth';
import { EmptyState } from '../../components/EmptyState/EmptyState.tsx';
import { Notice } from '../../components/Notice';
import { useAccounts } from '../../components/PageLayout/Accounts/useAccounts.tsx';
import { useSearchString } from '../../components/PageLayout/Search/';
import { getPageRouteTitle } from '../../components/PageLayout/pageRouteToTitle.ts';
import { useHeaderConfig } from '../../components/PageLayout/useHeaderConfig.tsx';
import { SaveSearchButton } from '../../components/SavedSearchButton/SaveSearchButton.tsx';
import { isSavedSearchDisabled } from '../../components/SavedSearchButton/savedSearchEnabled.ts';
import { SeenByModal } from '../../components/SeenByModal/SeenByModal.tsx';
import { useFeatureFlag } from '../../featureFlags';
import { useAlertBanner } from '../../hooks/useAlertBanner.ts';
import { usePageTitle } from '../../hooks/usePageTitle.tsx';
import { useInboxOnboarding } from '../../onboardingTour';
import { PageRoutes } from '../routes.ts';
import { AlertBanner } from './AlertBanner.tsx';
import { Altinn2ActiveSchemasNotification } from './Altinn2ActiveSchemasNotification.tsx';
import { FilterCategory, hasValidFilters, readFiltersFromURLQuery } from './filters';
import { FixedGlobalQueryParams, encodeSubAccountIds } from './queryParams.ts';
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
        }),
      };
    }
    return {
      title: t('subAccountsLimitReached.title'),
      description: t('subAccountsLimitReached.description', { count: subAccountsCount }),
    };
  }

  if (shouldShowSubAccountsNudge) {
    return {
      title: t('organizationLimitReached.subAccounts.title'),
      description: t('organizationLimitReached.subAccounts.description', { count: selectedPartiesCount }),
    };
  }

  if (isServiceFilterEnabled) {
    return {
      title: t('organizationLimitReached.serviceFilter.title'),
      description: t('organizationLimitReached.serviceFilter.description', { count: selectedPartiesCount }),
    };
  }

  return {
    title: t('organizationLimitReached.title'),
    description: t('organizationLimitReached.description', { count: selectedPartiesCount }),
  };
};

export const Inbox = ({ viewType }: InboxProps) => {
  useMockError();
  const { t } = useTranslation();

  const {
    selectedParties,
    allOrganizationsSelected,
    parties,
    partiesEmptyList,
    isError: unableToLoadParties,
    isLoading: isLoadingParties,
    organizationLimitReached,
  } = useParties();

  const location = useLocation();
  const [filterState, setFilterState] = useState<FilterState>(readFiltersFromURLQuery(location.search));
  const { inboxSearch } = useHeaderConfig(filterState);
  const [currentSeenByLogModal, setCurrentSeenByLogModal] = useState<CurrentSeenByLog | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParamsString = searchParams.toString();
  const subAccountsParam = searchParams.get(FixedGlobalQueryParams.subAccounts) ?? '';

  const isAltinn2MessagesEnabled = useFeatureFlag<boolean>('inbox.enableAltinn2Messages');
  const isAlertBannerEnabled = useFeatureFlag<boolean>('inbox.enableAlertBanner');
  const isServiceFilterEnabled = useFeatureFlag<boolean>('filters.enableServiceFilter');
  const isSubAccountsMenuEnabled = useFeatureFlag<boolean>('filters.enableSubAccountsMenu');
  const alertBannerContent = useAlertBanner();

  const onFiltersChange = (filters: FilterState) => {
    const currentURL = new URL(window.location.href);
    const allowedFilters = Object.values(FilterCategory);
    const updatedURL = createFiltersURLQuery(filters, allowedFilters, currentURL.toString());
    setSearchParams(updatedURL.searchParams, { replace: true });

    if (!filters?.updated) {
      const { fromDate, toDate, ...restState } = filters;
      setFilterState(restState);
    } else {
      setFilterState(filters);
    }
  };

  const { enteredSearchValue } = useSearchString();
  const validSearchString = enteredSearchValue.length > 2 ? enteredSearchValue : undefined;

  const searchMode = hasValidFilters(filterState) || !!validSearchString;

  const selectedServices = (filterState.service ?? []) as string[];
  const selectedServicesCount = selectedServices.length;
  const serviceLimitReached = selectedServicesCount > 20;

  const { accounts, accountSearch, accountGroups, onSelectAccount, currentAccountName } = useAccounts({
    parties,
    selectedParties,
    allOrganizationsSelected,
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
  const showSubAccountsMenu = isSubAccountsMenuEnabled && subAccounts.length > 0;
  const isSubPartiesLimitReached =
    isSubAccountsMenuEnabled && ((subAccounts.length > 20 && !partyIdsOverride.length) || partyIdsOverride.length > 20);
  const subAccountsCount = Math.max(subAccounts.length - 1, 0);
  const hasSubAccountOverrideWithinLimit =
    isSubAccountsMenuEnabled && !!partyIdsOverride?.length && partyIdsOverride.length <= 20;
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

  const savedSearchDisabled = isSavedSearchDisabled(savedSearchFilterState, enteredSearchValue);

  const subAccountIdsToPersist = useMemo(() => {
    if (!isSubAccountsMenuEnabled || !partyIdsOverride?.length) return [];
    return partyIdsOverride;
  }, [isSubAccountsMenuEnabled, partyIdsOverride]);

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParamsString);
    const encoded = encodeSubAccountIds(subAccountIdsToPersist);

    if (encoded) {
      nextParams.set(FixedGlobalQueryParams.subAccounts, encoded);
    } else {
      nextParams.delete(FixedGlobalQueryParams.subAccounts);
    }

    if (nextParams.toString() !== searchParamsString) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParamsString, setSearchParams, subAccountIdsToPersist]);

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

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (location.search) {
      setFilterState(readFiltersFromURLQuery(location.search));
    }
  }, [searchParams.toString()]);

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
      <Heading as="h1" size="xl">
        {t(getPageRouteTitle(PageRoutes[viewType]))}
      </Heading>
      <div data-testid="inbox-toolbar">
        {currentAccountName ? (
          <Toolbar>
            <ToolbarMenu
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
                id="toolbarmenu-subAccounts"
                items={subAccounts}
                groups={subAccountGroups}
                label={getSubAccountLabel()}
                searchable={subAccountsSearchable}
                virtualized
              />
            )}
            <ToolbarSearch {...inboxSearch} />
            <ToolbarFilter
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
            <SaveSearchButton viewType={viewType} disabled={savedSearchDisabled} filterState={savedSearchFilterState} />
          </Toolbar>
        ) : null}
      </div>
      <AlertBanner showAlertBanner={isAlertBannerEnabled && !!alertBannerContent} />
      {isAltinn2MessagesEnabled && <Altinn2ActiveSchemasNotification selectedAccountId={selectedParties?.[0]?.party} />}
      {dialogsSuccess && !dialogItems.length && !isLoading && !isLimitReached && (
        <EmptyState query={enteredSearchValue} viewType={viewType} searchMode={searchMode} />
      )}
      {isLimitReached && (
        <Notice title={limitReachedNoticeContent.title} description={limitReachedNoticeContent.description} />
      )}
      <>
        <DialogList
          items={dialogItems}
          groups={groups}
          sortGroupBy={([aKey], [bKey]) => (groups[bKey]?.orderIndex ?? 0) - (groups[aKey]?.orderIndex ?? 0)}
          isLoading={isLoading}
          highlightWords={searchMode ? [enteredSearchValue] : undefined}
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
    </PageBase>
  );
};
