import { BookmarksSection, PageBase, Toolbar } from '@altinn/altinn-components';
import { useParties } from '../../api/hooks/useParties.ts';
import { type CountableItem, useAccounts } from '../../components/PageLayout/Accounts/useAccounts.tsx';
import { PageRoutes } from '../routes.ts';
import styles from './savedSearchesPage.module.css';
import { useSavedSearches } from './useSavedSearches.tsx';

export const SavedSearchesPage = () => {
  const { selectedPartyIds, parties, selectedParties, allOrganizationsSelected } = useParties();
  const { savedSearches, bookmarkSectionProps } = useSavedSearches(selectedPartyIds);

  const { accounts, selectedAccount, accountSearch, accountGroups, onSelectAccount } = useAccounts({
    parties,
    selectedParties,
    allOrganizationsSelected,
    countableItems: (savedSearches ?? []).map((s) => ({
      party: Array.isArray(s.data.urn) ? s.data.urn[0] : '',
    })) as CountableItem[],
    dialogCountInconclusive: false,
  });

  return (
    <>
      <PageBase margin="page">
        <div className={styles.gridContainer}>
          {selectedAccount ? (
            <Toolbar
              accountMenu={{
                items: accounts,
                search: accountSearch,
                groups: accountGroups,
                currentAccount: selectedAccount,
                onSelectAccount: (account: string) => onSelectAccount(account, PageRoutes.savedSearches),
              }}
            />
          ) : null}
        </div>
      </PageBase>
      {bookmarkSectionProps && <BookmarksSection {...bookmarkSectionProps} />}
    </>
  );
};
