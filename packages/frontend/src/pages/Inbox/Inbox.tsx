import { DialogList, Section, Toolbar } from '@altinn/altinn-components';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { type InboxViewType, useDialogs } from '../../api/useDialogs.tsx';
import { useParties } from '../../api/useParties.ts';
import { useAccounts } from '../../components/PageLayout/Accounts/useAccounts.tsx';
import { useSearchDialogs, useSearchString } from '../../components/PageLayout/Search/';
import { SaveSearchButton } from '../../components/SavedSearchButton/SaveSearchButton.tsx';
import { PageRoutes } from '../routes.ts';
import { filterDialogs } from './filters.ts';
import styles from './inbox.module.css';
import { useFilters } from './useFilters.tsx';
import useGroupedDialogs from './useGroupedDialogs.tsx';

interface InboxProps {
  viewType: InboxViewType;
}

export const Inbox = ({ viewType }: InboxProps) => {
  const { t } = useTranslation();
  const { selectedParties, allOrganizationsSelected, parties, partiesEmptyList } = useParties();
  const [searchParams] = useSearchParams();
  const searchBarParam = new URLSearchParams(searchParams);
  const searchParamOrg = searchBarParam.get('org') ?? undefined;
  const { dialogsByView: allDialogsByView } = useDialogs(parties);
  const { enteredSearchValue } = useSearchString();
  const {
    dialogsByView,
    isLoading: isLoadingDialogs,
    isSuccess: isSuccessDialogs,
    dialogCountInconclusive: allDialogCountInconclusive,
  } = useDialogs(selectedParties);

  const displaySearchResults = enteredSearchValue.length > 0 || !!searchParamOrg;

  const { searchResults, isFetching: isFetchingSearchResults } = useSearchDialogs({
    parties: selectedParties,
    searchValue: enteredSearchValue,
  });

  const { accounts, selectedAccount, accountSearch, accountGroups, onSelectAccount } = useAccounts({
    parties,
    selectedParties,
    allOrganizationsSelected,
    countableItems: allDialogsByView[viewType],
    dialogCountInconclusive: allDialogCountInconclusive,
  });

  const dialogsForView = dialogsByView[viewType];
  const dataSource = displaySearchResults ? searchResults : dialogsForView;
  const { filterState, filters, onFiltersChange, getFilterLabel } = useFilters({ dialogs: dataSource });
  const filteredItems = useMemo(() => filterDialogs(dataSource, filterState), [dataSource, filterState]);

  const isLoading = !isSuccessDialogs || isFetchingSearchResults || isLoadingDialogs;

  const { mappedGroupedDialogs, groups } = useGroupedDialogs({
    items: filteredItems,
    displaySearchResults,
    filters: filterState,
    viewType,
    isLoading,
  });

  if (partiesEmptyList) {
    return (
      <div className={styles.noParties}>
        <h1 className={styles.noPartiesText}>{t('inbox.no_parties_found')}</h1>
      </div>
    );
  }

  const savedSearchDisabled =
    !Object.keys(filterState)?.length &&
    Object.values(filterState).every((item) => item?.values?.length === 0) &&
    !enteredSearchValue;

  return (
    <>
      <section className={styles.filtersArea} data-testid="inbox-toolbar">
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
        {!filteredItems.length && <h1>{t(`inbox.heading.title.${viewType}`, { count: 0 })}</h1>}

        <DialogList items={mappedGroupedDialogs} groups={groups} />
      </Section>
    </>
  );
};
