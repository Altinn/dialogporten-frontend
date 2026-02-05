import { BookmarksSettingsList, PageBase, Toolbar } from '@altinn/altinn-components';
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

  const { accounts, accountSearch, accountGroups, onSelectAccount, currentAccountName } = useAccounts({
    parties,
    selectedParties,
    allOrganizationsSelected,
    options: {
      showGroups: true,
    },
  });

  return (
    <PageBase margin="page">
      <div className={styles.gridContainer} style={{ marginTop: '-1rem' }}>
        {currentAccountName ? (
          <Toolbar
            accountMenu={{
              items: accounts,
              search: accountSearch,
              groups: accountGroups,
              label: currentAccountName,
              onSelectId: (account: string) => onSelectAccount(account, PageRoutes.savedSearches),
              virtualized: true,
              title: t('parties.change_label'),
            }}
          />
        ) : null}
      </div>
      {bookmarkSectionProps && <BookmarksSettingsList {...bookmarkSectionProps} />}
    </PageBase>
  );
};
