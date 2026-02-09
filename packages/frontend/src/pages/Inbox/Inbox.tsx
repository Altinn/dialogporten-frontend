import {
  Button,
  DialogList,
  DsAlert,
  DsParagraph,
  Heading,
  PageBase,
  Section,
  type SeenByLogItemProps,
  Toolbar,
} from '@altinn/altinn-components';
import type { FilterState } from '@altinn/altinn-components/dist/types/lib/components/Toolbar/Toolbar';
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
import { FilterCategory, readFiltersFromURLQuery } from './filters.ts';
import { useFilters } from './useFilters.tsx';
import useGroupedDialogs from './useGroupedDialogs.tsx';
import { useMockError } from './useMockError.tsx';

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
    allOrganizationsSelected,
    parties,
    partiesEmptyList,
    isError: unableToLoadParties,
    isLoading: isLoadingParties,
    organizationLimitReached,
  } = useParties();

  const location = useLocation();
  const [filterState, setFilterState] = useState<FilterState>(readFiltersFromURLQuery(location.search));
  const [currentSeenByLogModal, setCurrentSeenByLogModal] = useState<CurrentSeenByLog | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const isAltinn2MessagesEnabled = useFeatureFlag<boolean>('inbox.enableAltinn2Messages');
  const isAlertBannerEnabled = useFeatureFlag<boolean>('inbox.enableAlertBanner');
  const isServiceFilterEnabled = useFeatureFlag<boolean>('filters.enableServiceFilter');
  const alertBannerContent = useAlertBanner();

  const onFiltersChange = (filters: FilterState) => {
    const currentURL = new URL(window.location.href);
    const allowedFilters = Object.values(FilterCategory);
    const updatedURL = createFiltersURLQuery(filters, allowedFilters, currentURL.toString());
    setSearchParams(updatedURL.searchParams, { replace: true });
    setFilterState(filters);
  };

  const { enteredSearchValue } = useSearchString();
  const validSearchString = enteredSearchValue.length > 2 ? enteredSearchValue : undefined;
  const hasValidFilters = Object.values(filterState).some((arr) => typeof arr !== 'undefined' && arr?.length > 0);
  const searchMode = viewType === 'inbox' && (hasValidFilters || !!validSearchString);
  const savedSearchDisabled = isSavedSearchDisabled(filterState, enteredSearchValue);

  const selectedServices = (filterState.service ?? []) as string[];
  const selectedServicesCount = selectedServices.length;
  const serviceLimitReached = selectedServicesCount > 20;

  const isLimitReached =
    (organizationLimitReached && !isServiceFilterEnabled) ||
    (organizationLimitReached && isServiceFilterEnabled && selectedServicesCount === 0) ||
    (organizationLimitReached && isServiceFilterEnabled && serviceLimitReached);

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
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (location.search) {
      setFilterState(readFiltersFromURLQuery(location.search));
    }
  }, [searchParams.toString()]);

  const { accounts, selectedAccount, accountSearch, accountGroups, onSelectAccount, filterAccount } = useAccounts({
    parties,
    selectedParties,
    allOrganizationsSelected,
    options: {
      showGroups: true,
    },
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

  if (unableToLoadParties) {
    return (
      <PageBase>
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
      <PageBase margin="page">
        <Notice title={t('inbox.no_parties_found')} />
      </PageBase>
    );
  }

  return (
    <PageBase margin="page">
      <section data-testid="inbox-toolbar" style={{ marginTop: '-1rem' }}>
        {selectedAccount ? (
          <Toolbar
            data-testid="inbox-toolbar"
            accountMenu={{
              items: accounts,
              search: accountSearch,
              groups: accountGroups,
              currentAccount: selectedAccount,
              onSelectAccount: (account: string) => onSelectAccount(account, PageRoutes[viewType]),
              filterAccount,
              isVirtualized: true,
              title: t('parties.change_label'),
            }}
            filterState={filterState}
            getFilterLabel={getFilterLabel}
            onFilterStateChange={onFiltersChange}
            filters={filters}
            showResultsLabel={t('filter.show_all_results')}
            removeButtonAltText={t('filter_bar.remove_filter')}
            addFilterButtonLabel={hasValidFilters ? t('filter_bar.add') : t('filter_bar.add_filter')}
          >
            <SaveSearchButton viewType={viewType} disabled={savedSearchDisabled} filterState={filterState} />
          </Toolbar>
        ) : null}
      </section>
      <AlertBanner showAlertBanner={isAlertBannerEnabled && !!alertBannerContent} />
      <Section>
        {isAltinn2MessagesEnabled && <Altinn2ActiveSchemasNotification selectedAccount={selectedAccount} />}
        {dialogsSuccess && !dialogItems.length && !isLoading && !isLimitReached && (
          <EmptyState query={enteredSearchValue} viewType={viewType} searchMode={searchMode} />
        )}
        {isLimitReached && (
          <Notice
            title={
              isServiceFilterEnabled
                ? t('organizationLimitReached.serviceFilter.title')
                : t('organizationLimitReached.title')
            }
            description={
              isServiceFilterEnabled
                ? t('organizationLimitReached.serviceFilter.description', { count: selectedParties.length })
                : t('organizationLimitReached.description', { count: selectedParties.length })
            }
          />
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
      </Section>
      <SeenByModal
        title={currentSeenByLogModal?.title}
        items={currentSeenByLogModal?.items}
        isOpen={!!currentSeenByLogModal}
        onClose={() => setCurrentSeenByLogModal(null)}
      />
    </PageBase>
  );
};
