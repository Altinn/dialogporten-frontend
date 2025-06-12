import {
  DialogList,
  DsAlert,
  DsButton,
  DsParagraph,
  Heading,
  PageBase,
  Section,
  Toolbar,
} from '@altinn/altinn-components';
import type { FilterState } from '@altinn/altinn-components/dist/types/lib/components/Toolbar/Toolbar';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useSearchParams } from 'react-router-dom';
import { type InboxViewType, useDialogs } from '../../api/hooks/useDialogs.tsx';
import { useDialogsCount } from '../../api/hooks/useDialogsCount.tsx';
import { useParties } from '../../api/hooks/useParties.ts';
import { createFiltersURLQuery } from '../../auth';
import { EmptyState } from '../../components/EmptyState/EmptyState.tsx';
import { useAccounts } from '../../components/PageLayout/Accounts/useAccounts.tsx';
import { useSearchString } from '../../components/PageLayout/Search/';
import { useWindowSize } from '../../components/PageLayout/useWindowSize.tsx';
import { SaveSearchButton } from '../../components/SavedSearchButton/SaveSearchButton.tsx';
import { isSavedSearchDisabled } from '../../components/SavedSearchButton/savedSearchEnabled.ts';
import { PageRoutes } from '../routes.ts';
import { FilterCategory, readFiltersFromURLQuery } from './filters.ts';
import styles from './inbox.module.css';
import { useFilters } from './useFilters.tsx';
import useGroupedDialogs from './useGroupedDialogs.tsx';

interface InboxProps {
  viewType: InboxViewType;
}

export const Inbox = ({ viewType }: InboxProps) => {
  const { t } = useTranslation();
  const {
    selectedParties,
    allOrganizationsSelected,
    parties,
    partiesEmptyList,
    isError: unableToLoadParties,
    isLoading: isLoadingParties,
  } = useParties();

  const location = useLocation();

  const [filterState, setFilterState] = useState<FilterState>(readFiltersFromURLQuery(location.search));
  const [searchParams, setSearchParams] = useSearchParams();

  const onFiltersChange = (filters: FilterState) => {
    const currentURL = new URL(window.location.href);
    const allowedFilters = Object.values(FilterCategory);
    const updatedURL = createFiltersURLQuery(filters, allowedFilters, currentURL.toString());
    setSearchParams(updatedURL.searchParams, { replace: true });
    setFilterState(filters);
  };

  /* Used to populate account menu */
  const { dialogCountsByViewType, dialogCountInconclusive: dialogForAllPartiesCountInconclusive } =
    useDialogsCount(parties);
  const { enteredSearchValue } = useSearchString();

  const validSearchString = enteredSearchValue.length > 2 ? enteredSearchValue : undefined;
  const hasValidFilters = Object.values(filterState).some((arr) => typeof arr !== 'undefined' && arr?.length > 0);
  const searchMode = viewType === 'inbox' && (hasValidFilters || !!validSearchString);
  const enableSavedSearch =
    (hasValidFilters || !!validSearchString) && !isSavedSearchDisabled(filterState, enteredSearchValue);

  const {
    dialogs,
    isLoading: isLoadingDialogs,
    isSuccess: dialogsSuccess,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  } = useDialogs({ parties: selectedParties, viewType, filterState, search: validSearchString });

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (location.search) {
      setFilterState(readFiltersFromURLQuery(location.search));
    }
  }, [searchParams.toString()]);

  const { accounts, selectedAccount, accountSearch, accountGroups, onSelectAccount } = useAccounts({
    parties,
    selectedParties,
    allOrganizationsSelected,
    countableItems: dialogCountsByViewType[viewType].map((dialog) => ({
      party: dialog.party,
      isSeenByEndUser: dialog.seenSinceLastUpdate?.some((s) => s.isCurrentEndUser),
    })),
    dialogCountInconclusive: dialogForAllPartiesCountInconclusive,
  });

  const { filters, getFilterLabel } = useFilters({ dialogs, viewType });

  const isLoading = isLoadingParties || isLoadingDialogs;
  const { groupedDialogs, groups } = useGroupedDialogs({
    items: dialogs,
    displaySearchResults: searchMode,
    filters: filterState,
    viewType,
    isLoading,
    isFetchingNextPage,
    getCollapsedGroupTitle: (count) => t(`inbox.heading.title.${viewType}`, { count }),
    collapseGroups: viewType !== 'inbox',
  });

  const windowSize = useWindowSize();

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
        <h1 className={styles.noPartiesText}>{t('inbox.no_parties_found')}</h1>
      </PageBase>
    );
  }

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

  return (
    <PageBase margin="page">
      <section data-testid="inbox-toolbar">
        {selectedAccount ? (
          <>
            <Toolbar
              data-testid="inbox-toolbar"
              accountMenu={{
                accounts,
                accountSearch,
                accountGroups,
                currentAccount: selectedAccount,
                onSelectAccount: (account: string) => onSelectAccount(account, PageRoutes[viewType]),
                menuItemsVirtual: {
                  isVirtualized: true,
                  scrollRefStyles: {
                    maxHeight: windowSize.isTabletOrSmaller ? 'calc(100vh - 14rem)' : 'calc(80vh - 10rem)',
                    paddingBottom: '0.5rem',
                  },
                },
              }}
              filterState={filterState}
              getFilterLabel={getFilterLabel}
              onFilterStateChange={onFiltersChange}
              filters={filters}
              showResultsLabel={t('filter.show_all_results')}
              removeButtonAltText={t('filter_bar.remove_filter')}
              addFilterButtonLabel={hasValidFilters ? t('filter_bar.add') : t('filter_bar.add_filter')}
            >
              <SaveSearchButton viewType={viewType} disabled={!enableSavedSearch} filterState={filterState} />
            </Toolbar>
          </>
        ) : null}
      </section>
      <Section>
        {dialogsSuccess && !dialogs.length && (
          <EmptyState
            title={searchMode ? t('inbox.no_results.title') : t(`inbox.heading.title.${viewType}`, { count: 0 })}
            description={searchMode ? t('inbox.no_results.description') : t(`inbox.heading.description.${viewType}`)}
          />
        )}
        <DialogList
          items={groupedDialogs}
          groups={groups}
          sortGroupBy={([aKey], [bKey]) => (groups[bKey]?.orderIndex ?? 0) - (groups[aKey]?.orderIndex ?? 0)}
          isLoading={isLoading}
        />
        {hasNextPage && (
          <DsButton aria-label={t('dialog.aria.fetch_more')} onClick={fetchNextPage} variant="tertiary">
            {t('dialog.fetch_more')}
          </DsButton>
        )}
      </Section>
    </PageBase>
  );
};
