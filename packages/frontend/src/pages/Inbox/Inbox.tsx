import { DialogList, Heading, Section, Toolbar } from '@altinn/altinn-components';
import { Alert, Paragraph } from '@digdir/designsystemet-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { type InboxViewType, useDialogs } from '../../api/useDialogs.tsx';
import { useParties } from '../../api/useParties.ts';
import { useAccounts } from '../../components/PageLayout/Accounts/useAccounts.tsx';
import { useSearchDialogs, useSearchString } from '../../components/PageLayout/Search/';
import { SaveSearchButton } from '../../components/SavedSearchButton/SaveSearchButton.tsx';
import { isSavedSearchDisabled } from '../../components/SavedSearchButton/savedSearchEnabled.ts';
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
  const {
    selectedParties,
    allOrganizationsSelected,
    parties,
    partiesEmptyList,
    isError: unableToLoadParties,
    isLoading: isLoadingParties,
  } = useParties();
  const [searchParams] = useSearchParams();
  const searchBarParam = new URLSearchParams(searchParams);
  const searchParamOrg = searchBarParam.get('org') ?? undefined;
  const { dialogsByView: allDialogsByView } = useDialogs(parties);
  const { enteredSearchValue } = useSearchString();
  const {
    dialogsByView,
    isLoading: isLoadingDialogs,
    dialogCountInconclusive: allDialogCountInconclusive,
    isSuccess: dialogsSuccess,
  } = useDialogs(selectedParties);

  const displaySearchResults = enteredSearchValue.length > 0 || !!searchParamOrg;

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
    countableItems: allDialogsByView[viewType],
    dialogCountInconclusive: allDialogCountInconclusive,
  });

  const dialogsForView = dialogsByView[viewType];
  const dataSourceSuccess = displaySearchResults ? searchSuccess : dialogsSuccess;
  const dataSource = displaySearchResults ? searchResults : dialogsForView;
  const { filterState, filters, onFiltersChange, getFilterLabel } = useFilters({ dialogs: dataSource });
  const filteredItems = useMemo(() => filterDialogs(dataSource, filterState), [dataSource, filterState]);

  const isLoading = isLoadingParties || isFetchingSearchResults || isLoadingDialogs;
  const { mappedGroupedDialogs, groups } = useGroupedDialogs({
    items: filteredItems,
    displaySearchResults,
    filters: filterState,
    viewType,
    isLoading,
  });

  if (unableToLoadParties) {
    return (
      <section className={styles.noParties}>
        <Alert data-color="danger">
          <Heading data-size="xs">{t('inbox.unable_to_load_parties.title')}</Heading>
          <Paragraph>
            {t('inbox.unable_to_load_parties.body')}
            <a href="/api/logout">{t('inbox.unable_to_load_parties.link')}</a>
          </Paragraph>
        </Alert>
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
        {dataSourceSuccess && !filteredItems.length && <h1>{t(`inbox.heading.title.${viewType}`, { count: 0 })}</h1>}
        <DialogList
          items={mappedGroupedDialogs}
          groups={groups}
          sortGroupBy={([aKey], [bKey]) => (groups[bKey]?.orderIndex ?? 0) - (groups[aKey]?.orderIndex ?? 0)}
        />
      </Section>
    </>
  );
};
