import {
  type Color,
  type FooterProps,
  type HeaderProps,
  Layout,
  type LayoutProps,
  type MenuItemProps,
  type Size,
} from '@altinn/altinn-components';
import { Snackbar } from '@altinn/altinn-components';
import { useQueryClient } from '@tanstack/react-query';
import { type ChangeEvent, useEffect, useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Outlet, useLocation, useSearchParams } from 'react-router-dom';
import { useParties } from '../../api/hooks/useParties.ts';
import { updateLanguage } from '../../api/queries.ts';
import { createHomeLink } from '../../auth';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { i18n } from '../../i18n/config.ts';
import { getSearchStringFromQueryParams } from '../../pages/Inbox/queryParams.ts';
import { useProfile } from '../../pages/Profile';
import { PageRoutes } from '../../pages/routes.ts';
import { useGlobalState } from '../../useGlobalState.ts';
import { BetaModal } from '../BetaModal';
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
  const { selectedProfile, selectedParties, parties, allOrganizationsSelected, currentEndUser } = useParties();
  const { autocomplete } = useAutocomplete({ selectedParties: selectedParties, searchValue });

  const { accounts, selectedAccount, accountSearch, accountGroups, onSelectAccount } = useAccounts({
    parties,
    selectedParties,
    allOrganizationsSelected,
  });

  const footer: FooterProps = useFooter();
  const { mobileMenu, desktopMenu, sidebarMenu } = useGlobalMenu();

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
      void i18n.changeLanguage(language);
    }
  };

  const [isErrorState] = useGlobalState<boolean>(QUERY_KEYS.ERROR_STATE, false);

  const headerProps: HeaderProps = {
    currentAccount: selectedAccount,
    logo: {
      as: (props: MenuItemProps) => {
        // @ts-ignore
        return <Link to={createHomeLink()} {...props} />;
      },
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
    mobileMenu,
    globalMenu: {
      menuLabel: t('word.menu'),
      menu: desktopMenu,
      onSelectAccount: (account: string) => onSelectAccount(account, PageRoutes.inbox),
      backLabel: t('word.back'),
      currentEndUserLabel: t('parties.current_end_user', { name: currentEndUser?.name ?? 'n/a' }),
      accountMenu: {
        items: accounts,
        groups: accountGroups,
        ...(accountSearch && {
          search: accountSearch,
        }),
        isVirtualized: true,
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
        { label: t('word.locale.nb'), value: 'nb', checked: i18n.language === 'nb' },
        { label: t('word.locale.nn'), value: 'nn', checked: i18n.language === 'nn' },
        { label: t('word.locale.en'), value: 'en', checked: i18n.language === 'en' },
      ],
      onSelect: (lang) => handleUpdateLanguage(lang),
    },
  };

  const color = isProfile ? 'neutral' : selectedProfile;

  const layoutProps: LayoutProps = {
    theme: isErrorState ? 'default' : 'subtle',
    skipLink: {
      href: '#main-content',
      color: 'inherit' as Color,
      size: 'xs' as Size,
      children: t('skip_link.jumpto'),
    },
    color,
    header: headerProps,
    footer,
    sidebar: { menu: sidebarMenu, hidden: isErrorState },
  };

  return (
    <>
      <Layout {...layoutProps}>
        <Outlet />
        <Snackbar />
        <BetaModal />
      </Layout>
    </>
  );
};
