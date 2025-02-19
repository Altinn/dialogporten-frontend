import { useSnackbar } from '@altinn/altinn-components';
import { ArrowForwardIcon, ClockDashedIcon, EnvelopeOpenIcon, TrashIcon } from '@navikt/aksel-icons';
import { format } from 'date-fns';
import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useSearchParams } from 'react-router-dom';
import { type InboxViewType, useDialogs } from '../../api/useDialogs.tsx';
import { useParties } from '../../api/useParties.ts';
import { ActionPanel, FilterBar, InboxItem, InboxItems, PartyDropdown, useSelectedDialogs } from '../../components';
import type { FilterBarRef } from '../../components/FilterBar/FilterBar.tsx';
import { FosToolbar } from '../../components/FosToolbar';
import { InboxItemsHeader } from '../../components/InboxItem/InboxItemsHeader.tsx';
import { useSearchDialogs, useSearchString } from '../../components/PageLayout/Search/';
import { SaveSearchButton } from '../../components/SavedSearchButton/SaveSearchButton.tsx';
import { FeatureFlagKeys, useFeatureFlag } from '../../featureFlags';
import { useSavedSearches } from '../SavedSearches/useSavedSearches.ts';
import { InboxSkeleton } from './InboxSkeleton.tsx';
import { filterDialogs } from './filters.ts';
import styles from './inbox.module.css';
import { useFilters } from './useFilters.tsx';
import useGroupedDialogs from './useGroupedDialogs.tsx';

interface InboxProps {
  viewType: InboxViewType;
}

export const Inbox = ({ viewType }: InboxProps) => {
  const { openSnackbar } = useSnackbar();
  const { t } = useTranslation();
  const filterBarRef = useRef<FilterBarRef>(null);
  const disableBulkActions = useFeatureFlag<boolean>(FeatureFlagKeys.DisableBulkActions);
  const location = useLocation();
  const { selectedItems, setSelectedItems, selectedItemCount, inSelectionMode } = useSelectedDialogs();
  const { selectedParties, selectedPartyIds } = useParties();
  const { enteredSearchValue } = useSearchString();
  const { saveSearch } = useSavedSearches(selectedPartyIds);
  const {
    searchResults,
    isFetching: isFetchingSearchResults,
    isSuccess: searchSuccess,
  } = useSearchDialogs({
    parties: selectedParties,
    searchValue: enteredSearchValue,
  });

  const [searchParams] = useSearchParams();
  const searchBarParam = new URLSearchParams(searchParams);
  const searchParamOrg = searchBarParam.get('org') ?? undefined;

  const { dialogsByView, isLoading: isLoadingDialogs, isSuccess: dialogsIsSuccess } = useDialogs(selectedParties);
  const dialogsForView = dialogsByView[viewType];
  const displaySearchResults = enteredSearchValue.length > 0 || !!searchParamOrg;

  const dataSource = displaySearchResults ? searchResults : dialogsForView;
  const dataSourceFetchSuccess = displaySearchResults ? searchSuccess : dialogsIsSuccess;
  const { filters, onFiltersChange, filterSettings } = useFilters({ dialogs: dataSource });
  const filteredItems = useMemo(() => filterDialogs(dataSource, filters, format), [dataSource, filters]);
  const dialogsGroupedByCategory = useGroupedDialogs({
    items: filteredItems,
    displaySearchResults,
    filters,
    viewType,
  });

  const handleCheckedChange = (checkboxValue: string, checked: boolean) => {
    setSelectedItems((prev: Record<string, boolean>) => ({
      ...prev,
      [checkboxValue]: checked,
    }));
  };

  const savedSearchDisabled = !filters?.length && !enteredSearchValue;
  const showFilterButton = filterSettings.length > 0;

  if (isFetchingSearchResults || isLoadingDialogs) {
    return <InboxSkeleton numberOfItems={5} />;
  }

  if (filteredItems.length === 0 && dataSourceFetchSuccess) {
    return (
      <div>
        <section className={styles.filtersArea}>
          <div className={styles.gridContainer}>
            <div className={styles.filterSaveContainer}>
              <PartyDropdown counterContext={viewType} />
              <FilterBar
                ref={filterBarRef}
                settings={filterSettings}
                onFilterChange={onFiltersChange}
                initialFilters={filters}
                addFilterBtnClassNames={styles.hideForSmallScreens}
                resultsCount={filteredItems.length}
              />
            </div>
          </div>
        </section>
        <InboxItemsHeader title={t(`inbox.heading.no_results.${viewType}`)} />
      </div>
    );
  }

  return (
    <div>
      <section className={styles.filtersArea}>
        <div className={styles.gridContainer}>
          <div className={styles.filterSaveContainer}>
            <PartyDropdown counterContext={viewType} />
            <FilterBar
              ref={filterBarRef}
              settings={filterSettings}
              onFilterChange={onFiltersChange}
              initialFilters={filters}
              addFilterBtnClassNames={styles.hideForSmallScreens}
              resultsCount={filteredItems.length}
            />
            <SaveSearchButton
              viewType={viewType}
              className={styles.hideForSmallScreens}
              disabled={savedSearchDisabled}
              activeFilters={filters}
            />
          </div>
        </div>
        <FosToolbar
          onFilterBtnClick={() => {
            filterBarRef?.current?.openFilter();
          }}
          onSaveBtnClick={() =>
            saveSearch({ filters, selectedParties: selectedPartyIds, enteredSearchValue, viewType })
          }
          hideFilterButton={!showFilterButton}
          hideSaveButton={savedSearchDisabled}
        />
      </section>
      {inSelectionMode && !disableBulkActions && (
        <ActionPanel
          actionButtons={[
            {
              label: t('actionPanel.buttons.share'),
              icon: <ArrowForwardIcon />,
              onClick: () => {
                openSnackbar({ message: 'del clicked', color: 'success' });
                setSelectedItems({});
              },
            },
            {
              label: t('actionPanel.buttons.mark_as_read'),
              icon: <EnvelopeOpenIcon />,
              onClick: () => {
                openSnackbar({ message: 'read clicked', color: 'success' });
                setSelectedItems({});
              },
            },
            {
              label: t('actionPanel.buttons.archive'),
              icon: <ClockDashedIcon />,
              onClick: () => {
                openSnackbar({ message: 'arkiv clicked', color: 'success' });
                setSelectedItems({});
              },
            },
            {
              label: t('actionPanel.buttons.delete'),
              icon: <TrashIcon />,
              onClick: () => {
                openSnackbar({ message: 'delete clicked', color: 'success' });
                setSelectedItems({});
              },
            },
          ]}
          selectedItemCount={selectedItemCount}
          onUndoSelection={() => setSelectedItems({})}
        />
      )}
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
