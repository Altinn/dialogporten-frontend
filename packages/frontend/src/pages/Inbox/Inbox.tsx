import { Toolbar } from '@altinn/altinn-components';
import { format } from 'date-fns';
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { type InboxViewType, useDialogs } from '../../api/useDialogs.tsx';
import { useParties } from '../../api/useParties.ts';
import { InboxItem, InboxItems, useSelectedDialogs } from '../../components';
import { InboxItemsHeader } from '../../components/InboxItem/InboxItemsHeader.tsx';
import { useAccounts } from '../../components/PageLayout/Accounts/useAccounts.tsx';
import { useSearchDialogs, useSearchString } from '../../components/PageLayout/Search/';
import { InboxSkeleton } from './InboxSkeleton.tsx';
import { filterDialogs } from './filters.ts';
import styles from './inbox.module.css';
import { useFilters } from './useFilters.tsx';
import useGroupedDialogs from './useGroupedDialogs.tsx';

interface InboxProps {
  viewType: InboxViewType;
}

export const Inbox = ({ viewType }: InboxProps) => {
  const location = useLocation();
  const { selectedItems, setSelectedItems } = useSelectedDialogs();
  const { selectedParties, allOrganizationsSelected, parties } = useParties();
  const {
    dialogsByView,
    isLoading: isLoadingDialogs,
    dialogCountInconclusive: allDialogCountInconclusive,
  } = useDialogs(selectedParties);
  const { dialogsByView: allDialogsByView } = useDialogs(parties);
  const { enteredSearchValue } = useSearchString();
  const { searchResults, isFetching: isFetchingSearchResults } = useSearchDialogs({
    parties: selectedParties,
    searchValue: enteredSearchValue,
  });
  const { accounts, selectedAccount, accountSearch, accountGroups, onSelectAccount } = useAccounts({
    parties,
    selectedParties,
    allOrganizationsSelected,
    dialogs: allDialogsByView.inbox,
    dialogCountInconclusive: allDialogCountInconclusive,
  });

  const dialogsForView = dialogsByView[viewType];
  const displaySearchResults = enteredSearchValue.length > 0;
  const dataSource = displaySearchResults ? searchResults : dialogsForView;
  const { filterState, filters } = useFilters({ dialogs: dataSource });
  const filteredItems = useMemo(() => filterDialogs(dataSource, filterState, format), [dataSource, filterState]);
  const dialogsGroupedByCategory = useGroupedDialogs({
    items: filteredItems,
    displaySearchResults,
    filters: filterState,
    viewType,
  });

  const handleCheckedChange = (checkboxValue: string, checked: boolean) => {
    setSelectedItems((prev: Record<string, boolean>) => ({
      ...prev,
      [checkboxValue]: checked,
    }));
  };

  if (isFetchingSearchResults || isLoadingDialogs) {
    return <InboxSkeleton numberOfItems={5} />;
  }

  return (
    <div>
      <section className={styles.filtersArea}>
        <div className={styles.gridContainer}>
          <Toolbar
            accountMenu={{
              accounts,
              accountSearch,
              accountGroups,
              currentAccount: selectedAccount,
              onSelectAccount,
            }}
            filterState={filterState}
            filters={filters}
            showResultsLabel="Vis alle treff"
          />
        </div>
      </section>
      <section>
        {dialogsGroupedByCategory.map(({ id, label, items }) => {
          const hideSelectAll = items.every((item) => selectedItems[item.id]);
          return (
            <InboxItems key={id}>
              <InboxItemsHeader
                hideSelectAll={hideSelectAll}
                onSelectAll={() => {
                  const newItems = Object.fromEntries(items.map((item) => [item.id, true]));
                  setSelectedItems({
                    ...selectedItems,
                    ...newItems,
                  });
                }}
                title={label}
              />
              {items.map((item) => (
                <InboxItem
                  key={item.id}
                  checkboxValue={item.id}
                  title={item.title}
                  summary={item.summary}
                  sender={item.sender}
                  receiver={item.receiver}
                  isUnread={!item.isSeenByEndUser}
                  isChecked={selectedItems[item.id]}
                  onCheckedChange={(checked) => handleCheckedChange(item.id, checked)}
                  metaFields={item.metaFields}
                  viewType={viewType}
                  linkTo={`/inbox/${item.id}/${location.search}`}
                />
              ))}
            </InboxItems>
          );
        })}
      </section>
    </div>
  );
};
