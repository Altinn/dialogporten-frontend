import {
  type FooterProps,
  type HeaderProps,
  Layout,
  type LayoutProps,
  type MenuItemProps,
} from '@altinn/altinn-components';
import { Snackbar } from '@altinn/altinn-components';
import { useQueryClient } from '@tanstack/react-query';
import { type ChangeEvent, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Outlet, useSearchParams } from 'react-router-dom';
import { useDialogs } from '../../api/useDialogs.tsx';
import { useParties } from '../../api/useParties.ts';
import { getSearchStringFromQueryParams } from '../../pages/Inbox/queryParams.ts';
import { useSavedSearches } from '../../pages/SavedSearches/useSavedSearches.tsx';
import { PageRoutes } from '../../pages/routes.ts';
import { useProfile } from '../../profile';
import { BetaBanner } from '../BetaBanner/BetaBanner';
import { useAuth } from '../Login/AuthContext.tsx';
import { useAccounts } from './Accounts/useAccounts.tsx';
import { useFooter } from './Footer';
import { useGlobalMenu } from './GlobalMenu';
import { useSearchAutocompleteDialogs, useSearchString } from './Search';

export const ProtectedPageLayout = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return null;
  }
  return <PageLayout />;
};

export const PageLayout: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { searchValue, setSearchValue, onClear } = useSearchString();
  const { selectedProfile, selectedParties, parties, selectedPartyIds, allOrganizationsSelected } = useParties();
  const { dialogsByView, dialogCountInconclusive: partyDialogsCountInconclusive } = useDialogs(selectedParties);
  const { dialogsByView: allDialogsByView, dialogCountInconclusive: allDialogCountInconclusive } = useDialogs(parties);
  const { autocomplete } = useSearchAutocompleteDialogs({ selectedParties: selectedParties, searchValue });
  const { accounts, selectedAccount, accountSearch, accountGroups, onSelectAccount } = useAccounts({
    parties,
    selectedParties,
    allOrganizationsSelected,
    countableItems: allDialogsByView.inbox,
    dialogCountInconclusive: allDialogCountInconclusive,
  });
  const { currentPartySavedSearches } = useSavedSearches(selectedPartyIds);

  const needsAttentionPerView = {
    inbox: dialogsByView.inbox.filter((item) => !item.isSeenByEndUser).length,
    drafts: dialogsByView.drafts.filter((item) => !item.isSeenByEndUser).length,
    sent: dialogsByView.sent.filter((item) => !item.isSeenByEndUser).length,
    'saved-searches': 0,
    archive: dialogsByView.archive.filter((item) => !item.isSeenByEndUser).length,
    bin: dialogsByView.bin.filter((item) => !item.isSeenByEndUser).length,
  };

  const itemsPerViewCount = {
    inbox: dialogsByView.inbox.length,
    drafts: dialogsByView.drafts.length,
    sent: dialogsByView.sent.length,
    'saved-searches': currentPartySavedSearches?.length ?? 0,
    archive: dialogsByView.archive.length,
    bin: dialogsByView.bin.length,
  };

  const footer: FooterProps = useFooter();
  const { global, sidebar } = useGlobalMenu({
    itemsPerViewCount,
    needsAttentionPerView,
    dialogCountsInconclusive: partyDialogsCountInconclusive,
  });

  useProfile();

  // biome-ignore lint/correctness/useExhaustiveDependencies: Full control of what triggers this code is needed
  useEffect(() => {
    const searchString = getSearchStringFromQueryParams(searchParams);
    queryClient.setQueryData(['search'], () => searchString || '');
  }, [searchParams]);

  const headerProps: HeaderProps = {
    currentAccount: selectedAccount,
    logo: {
      as: (props: MenuItemProps) => <Link to="/" {...props} />,
    },
    search: {
      expanded: false,
      name: t('word.search'),
      placeholder: t('word.search'),
      value: searchValue,
      onClear: () => onClear(),
      onChange: (event: ChangeEvent<HTMLInputElement>) => setSearchValue(event.target.value),
      autocomplete: {
        ...autocomplete,
        items: autocomplete.items,
      },
    },
    menu: {
      menuLabel: t('word.menu'),
      items: global,
      accountGroups,
      accounts,
      onSelectAccount: (account: string) => onSelectAccount(account, PageRoutes.inbox),
      changeLabel: t('layout.menu.change_account'),
      backLabel: t('word.back'),
      ...(accountSearch && {
        accountSearch,
      }),
      logoutButton: {
        label: t('word.log_out'),
        onClick: () => {
          (window as Window).location = `/api/logout`;
        },
      },
    },
  };

  const layoutProps: LayoutProps = {
    theme: 'subtle',
    color: selectedProfile,
    header: headerProps,
    footer,
    sidebar: {
      menu: {
        items: sidebar,
      },
    },
  };

  return (
    <>
      <BetaBanner />
      <Layout color={selectedProfile} {...layoutProps}>
        <Outlet />
        <Snackbar />
      </Layout>
    </>
  );
};
