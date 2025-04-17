import { DialogList, DsAlert, DsButton, DsParagraph, Heading, Section, Toolbar } from '@altinn/altinn-components';
import type { FilterState } from '@altinn/altinn-components/dist/types/lib/components/Toolbar/Toolbar';
import { DialogStatus, SystemLabel } from 'bff-types-generated';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { type InboxViewType, useDialogs } from '../../api/hooks/useDialogs.tsx';
import { useDialogsCount } from '../../api/hooks/useDialogsCount.tsx';
import { useParties } from '../../api/hooks/useParties.ts';
import { createFiltersURLQuery } from '../../auth';
import { useAccounts } from '../../components/PageLayout/Accounts/useAccounts.tsx';
import { useSearchDialogs, useSearchString } from '../../components/PageLayout/Search/';
import { SaveSearchButton } from '../../components/SavedSearchButton/SaveSearchButton.tsx';
import { isSavedSearchDisabled } from '../../components/SavedSearchButton/savedSearchEnabled.ts';
import { PageRoutes } from '../routes.ts';
import { readFiltersFromURLQuery } from './filters.ts';
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
  const [filterState, setFilterState] = useState<FilterState>(readFiltersFromURLQuery(location.search, viewType));
  const [_, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const presetFiltersByView: Record<InboxViewType, Partial<FilterState>> = {
    inbox: {
      status: [DialogStatus.New, DialogStatus.InProgress, DialogStatus.RequiresAttention, DialogStatus.Completed],
      label: SystemLabel.Default,
    },
    drafts: {
      status: [DialogStatus.Draft],
      label: SystemLabel.Default,
    },
    sent: {
      status: [DialogStatus.Sent],
      label: SystemLabel.Default,
    },
    archive: {
      systemLabel: SystemLabel.Archive,
    },
    bin: {
      systemLabel: SystemLabel.Bin,
    },
  };

  const shouldRedirectOutOfView = (viewType: InboxViewType, filters: FilterState): boolean => {
    const preset = presetFiltersByView[viewType];
    if (!preset || viewType === 'inbox') return false;

    const presetKeys = Object.keys(preset);
    const filterKeys = Object.keys(filters);

    // If any preset filter (e.g. label or status) is missing from current filters
    const isMissingPresetKey = ['label', 'status'].some((key) => {
      const presetValue = preset[key];
      const currentValue = filters[key];
      if (!presetValue || !currentValue) return true;

      return Array.isArray(presetValue)
        ? !Array.isArray(currentValue) || !presetValue.every((v) => currentValue.includes(v))
        : currentValue !== presetValue;
    });

    // If filters include additional keys beyond preset (scope widened)
    const isWidenedScope = filterKeys.some((key) => !presetKeys.includes(key));

    return isMissingPresetKey || isWidenedScope;
  };

  const onFiltersChange = (filters: FilterState) => {
    const currentURL = new URL(window.location.href);
    const filterKeys = Object.keys(filters);
    const updatedURL = createFiltersURLQuery(filters, filterKeys, currentURL.toString());

    if (shouldRedirectOutOfView(viewType, filters)) {
      navigate(PageRoutes.inbox + `?${updatedURL.searchParams.toString()}`);
    } else {
      setSearchParams(updatedURL.searchParams, { replace: true });
      setFilterState(filters);
    }
  };

  /* Used to populate account menu */
  const { dialogCountsByViewType, dialogCountInconclusive: dialogForAllPartiesCountInconclusive } = useDialogsCount(
    parties,
    viewType,
  );
  const { enteredSearchValue } = useSearchString();
  const {
    dialogs: allDialogsForView,
    isLoading: isLoadingDialogs,
    isSuccess: dialogsSuccess,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  } = useDialogs(selectedParties, viewType, filterState);
  const displaySearchResults = enteredSearchValue.length > 0;

  const {
    searchResults,
    isFetching: isFetchingSearchResults,
    isSuccess: searchSuccess,
  } = useSearchDialogs({
    parties: selectedParties,
    searchValue: enteredSearchValue,
  });

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

  const dataSourceSuccess = displaySearchResults ? searchSuccess : dialogsSuccess;
  const dataSource = displaySearchResults ? searchResults : allDialogsForView;
  const { filters, getFilterLabel } = useFilters({ dialogs: dataSource, filterState });

  const isLoading = isLoadingParties || isFetchingSearchResults || isLoadingDialogs;
  const { groupedDialogs, groups } = useGroupedDialogs({
    items: dataSource,
    displaySearchResults,
    filters: filterState,
    viewType,
    isLoading,
    isFetchingNextPage,
  });

  if (unableToLoadParties) {
    return (
      <section className={styles.noParties}>
        <DsAlert data-color="danger">
          <Heading data-size="xs">{t('inbox.unable_to_load_parties.title')}</Heading>
          <DsParagraph>
            {t('inbox.unable_to_load_parties.body')}
            <a href="/api/logout">{t('inbox.unable_to_load_parties.link')}</a>
          </DsParagraph>
        </DsAlert>
      </section>
    );
  }

  if (partiesEmptyList) {
    return (
      <section className={styles.noParties}>
        <h1 className={styles.noPartiesText}>{t('inbox.no_parties_found')}</h1>
      </section>
    );
  }

  const savedSearchDisabled = isSavedSearchDisabled(filterState, enteredSearchValue);

  return (
    <>
      <section className={styles.filtersArea} data-testid="inbox-toolbar">
        {selectedAccount ? (
          <>
            <Toolbar
              key={`toolbar-${filters.length}`}
              data-testid="inbox-toolbar"
              accountMenu={{
                accounts,
                accountSearch,
                accountGroups,
                currentAccount: selectedAccount,
                onSelectAccount: (account: string) => onSelectAccount(account, PageRoutes[viewType]),
                isVirtualized: accounts.length > 20,
              }}
              filterState={filterState}
              getFilterLabel={getFilterLabel}
              onFilterStateChange={onFiltersChange}
              filters={filters}
              showResultsLabel={t('filter.show_all_results')}
              removeButtonAltText={t('filter_bar.remove_filter')}
              addFilterButtonLabel={t('filter_bar.add_filter')}
            >
              <SaveSearchButton viewType={viewType} disabled={savedSearchDisabled} filterState={filterState} />
            </Toolbar>
          </>
        ) : null}
      </section>
      <Section spacing={3} margin="section">
        {dataSourceSuccess && !dataSource.length && <h1>{t(`inbox.heading.title.${viewType}`, { count: 0 })}</h1>}
        <DialogList
          items={groupedDialogs}
          groups={groups}
          sortGroupBy={([aKey], [bKey]) => (groups[bKey]?.orderIndex ?? 0) - (groups[aKey]?.orderIndex ?? 0)}
        />
        {hasNextPage && (
          <DsButton aria-label={t('dialog.aria.fetch_more')} onClick={fetchNextPage} variant="tertiary">
            {t('dialog.fetch_more')}
          </DsButton>
        )}
      </Section>
    </>
  );
};
