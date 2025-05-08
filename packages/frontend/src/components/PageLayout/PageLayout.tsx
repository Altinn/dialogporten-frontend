import {
  type FooterProps,
  type HeaderProps,
  Layout,
  type LayoutProps,
  type MenuItemProps,
} from '@altinn/altinn-components';
import { Snackbar } from '@altinn/altinn-components';
import { useQueryClient } from '@tanstack/react-query';
import { type ChangeEvent, useEffect, useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Outlet, useLocation, useSearchParams } from 'react-router-dom';
import { useDialogs } from '../../api/hooks/useDialogs.tsx';
import { useDialogsCount } from '../../api/hooks/useDialogsCount.tsx';
import { useParties } from '../../api/hooks/useParties.ts';
import { updateLanguage } from '../../api/queries.ts';
import { i18n } from '../../i18n/config.ts';
import { getSearchStringFromQueryParams } from '../../pages/Inbox/queryParams.ts';
import { useSavedSearches } from '../../pages/SavedSearches/useSavedSearches.tsx';
import { PageRoutes } from '../../pages/routes.ts';
import { useProfile } from '../../profile';
import { BetaBanner } from '../BetaBanner/BetaBanner';
import { useAuth } from '../Login/AuthContext.tsx';
import { useAccounts } from './Accounts/useAccounts.tsx';
import { useFooter } from './Footer';
import { useGlobalMenu } from './GlobalMenu';
import { useAutocomplete, useSearchString } from './Search';

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
  const { selectedProfile, selectedParties, parties, selectedPartyIds, allOrganizationsSelected, currentEndUser } =
    useParties();
  const { dialogCountsByViewType, dialogCountInconclusive: partyDialogsCountInconclusive } =
    useDialogsCount(selectedParties);
  const { dialogsByView: allDialogsByView, dialogCountInconclusive: allDialogCountInconclusive } = useDialogs({
    parties,
  });
  const { autocomplete } = useAutocomplete({ selectedParties: selectedParties, searchValue });

  const { accounts, selectedAccount, accountSearch, accountGroups, onSelectAccount } = useAccounts({
    parties,
    selectedParties,
    allOrganizationsSelected,
    countableItems: allDialogsByView.inbox,
    dialogCountInconclusive: allDialogCountInconclusive,
  });
  const { currentPartySavedSearches } = useSavedSearches(selectedPartyIds);

  const needsAttentionPerView = {
    inbox: dialogCountsByViewType.inbox.filter((item) => !item.seenSinceLastUpdate?.some((s) => s.isCurrentEndUser))
      .length,
    drafts: dialogCountsByViewType.drafts.filter((item) => !item.seenSinceLastUpdate?.some((s) => s.isCurrentEndUser))
      .length,
    sent: dialogCountsByViewType.sent.filter((item) => !item.seenSinceLastUpdate?.some((s) => s.isCurrentEndUser))
      .length,
    'saved-searches': 0,
    archive: dialogCountsByViewType.archive.filter((item) => !item.seenSinceLastUpdate?.some((s) => s.isCurrentEndUser))
      .length,
    bin: dialogCountsByViewType.bin.filter((item) => !item.seenSinceLastUpdate?.some((s) => s.isCurrentEndUser)).length,
  };

  const itemsPerViewCount = {
    inbox: dialogCountsByViewType.inbox.length,
    drafts: dialogCountsByViewType.drafts.length,
    sent: dialogCountsByViewType.sent.length,
    'saved-searches': currentPartySavedSearches?.length ?? 0,
    archive: dialogCountsByViewType.archive.length,
    bin: dialogCountsByViewType.bin.length,
  };

  const footer: FooterProps = useFooter();
  const { global, sidebar } = useGlobalMenu({
    itemsPerViewCount,
    needsAttentionPerView,
    dialogCountsInconclusive: partyDialogsCountInconclusive,
  });

  useProfile();

  const location = useLocation();
  const isProfile = location.pathname.includes(PageRoutes.profile);

  // biome-ignore lint/correctness/useExhaustiveDependencies: runs synchronously after DOM mutations but before the browser paints.
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Full control of what triggers this code is needed
  useEffect(() => {
    const searchString = getSearchStringFromQueryParams(searchParams);
    queryClient.setQueryData(['search'], () => searchString || '');
  }, [searchParams]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Not all dependencies are needed
  useEffect(() => {
    if (!searchValue) {
      onClear();
    }
  }, [searchValue]);

  const handleUpdateLanguage = async (language: string) => {
    try {
      await updateLanguage(language);
    } catch (error) {
      console.error('Failed to delete saved search:', error);
    } finally {
      i18n.changeLanguage(language);
    }
  };

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
      currentEndUserLabel: t('parties.current_end_user', { name: currentEndUser?.name ?? 'n/a' }),
      menuItemsVirtual: {
        isVirtualized: true,
        scrollRefStyles: {
          maxHeight: 'calc(80vh - 10rem)',
        },
      },
      logoutButton: {
        label: t('word.log_out'),
        onClick: () => {
          (window as Window).location = `/api/logout`;
        },
      },
    },
    locale: {
      title: 'Språk/language',
      options: [
        { label: 'Norsk Bokmål', value: 'nb', checked: i18n.language === 'nb' },
        { label: 'Norsk Nynorsk', value: 'nn', checked: i18n.language === 'nn' },
        { label: 'English', value: 'en', checked: i18n.language === 'en' },
      ],
      onChange: (e) => handleUpdateLanguage((e.target as HTMLSelectElement).value),
    },
  };

  const color = isProfile ? 'neutral' : selectedProfile;

  const layoutProps: LayoutProps = {
    theme: 'subtle',
    color,
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
      <Layout {...layoutProps}>
        <Outlet />
        <Snackbar />
      </Layout>
    </>
  );
};
