import { BookmarksSection, PageBase, Toolbar } from '@altinn/altinn-components';
import { t } from 'i18next';
import { useParties } from '../../api/hooks/useParties.ts';
import { useAccounts } from '../../components/PageLayout/Accounts/useAccounts.tsx';
import { usePageTitle } from '../../hooks/usePageTitle.tsx';
import { PageRoutes } from '../routes.ts';
import styles from './savedSearchesPage.module.css';
import { useSavedSearches } from './useSavedSearches.tsx';

export const SavedSearchesPage = () => {
  const { selectedPartyIds, parties, selectedParties, allOrganizationsSelected } = useParties();
  const { bookmarkSectionProps } = useSavedSearches(selectedPartyIds);

  usePageTitle({ baseTitle: t('sidebar.saved_searches') });

  const { accounts, selectedAccount, accountSearch, accountGroups, onSelectAccount } = useAccounts({
    parties,
    selectedParties,
    allOrganizationsSelected,
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
