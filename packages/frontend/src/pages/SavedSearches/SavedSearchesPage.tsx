import { BookmarksSettingsList, PageBase, Toolbar } from '@altinn/altinn-components';
import { t } from 'i18next';
import { useParties } from '../../api/hooks/useParties.ts';
import { createMessageBoxLink } from '../../auth';
import { Notice } from '../../components/Notice';
import { useAccounts } from '../../components/PageLayout/Accounts/useAccounts.tsx';
import { usePageTitle } from '../../hooks/usePageTitle.tsx';
import { PageRoutes } from '../routes.ts';
import styles from './savedSearchesPage.module.css';
import { useSavedSearches } from './useSavedSearches.tsx';

export const SavedSearchesPage = () => {
  const {
    selectedPartyIds,
    parties,
    selectedParties,
    allOrganizationsSelected,
    isSelfIdentifiedUser,
    currentPartyUuid,
  } = useParties();
  const { bookmarkSectionProps } = useSavedSearches(selectedPartyIds);

  usePageTitle({ baseTitle: t('sidebar.saved_searches') });

  const { accounts, selectedAccount, accountSearch, accountGroups, onSelectAccount } = useAccounts({
    parties,
    selectedParties,
    allOrganizationsSelected,
    options: {
      showGroups: true,
    },
  });

  if (isSelfIdentifiedUser) {
    return (
      <Notice
        title={t('notice.self_identified_warning.title')}
        description={t('notice.self_identified_warning.description')}
        link={{
          href: createMessageBoxLink(currentPartyUuid),
          label: t('notice.self_identified_warning.button_link'),
        }}
      />
    );
  }
  return (
    <PageBase margin="page">
      <div className={styles.gridContainer} style={{ marginTop: '-1rem' }}>
        {selectedAccount ? (
          <Toolbar
            accountMenu={{
              items: accounts,
              search: accountSearch,
              groups: accountGroups,
              currentAccount: selectedAccount,
              onSelectAccount: (account: string) => onSelectAccount(account, PageRoutes.savedSearches),
              isVirtualized: true,
              title: t('parties.change_label'),
            }}
          />
        ) : null}
      </div>
      {bookmarkSectionProps && <BookmarksSettingsList {...bookmarkSectionProps} />}
    </PageBase>
  );
};
