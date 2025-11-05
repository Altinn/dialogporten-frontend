import type { GlobalHeaderProps, HeaderProps, MenuItemProps } from '@altinn/altinn-components';
import type { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import type { useParties } from '../../api/hooks/useParties.ts';
import { updateLanguage } from '../../api/queries.ts';
import { createHomeLink } from '../../auth';
import { useFeatureFlag } from '../../featureFlags';
import { useErrorLogger } from '../../hooks/useErrorLogger';
import { i18n } from '../../i18n/config.ts';
import { PageRoutes } from '../../pages/routes.ts';
import { useAccounts } from './Accounts/useAccounts.tsx';
import { useGlobalMenu } from './GlobalMenu';
import { useAutocomplete, useSearchString } from './Search';

interface UseHeaderConfigProps {
  parties: ReturnType<typeof useParties>['parties'];
  selectedParties: ReturnType<typeof useParties>['selectedParties'];
  allOrganizationsSelected: ReturnType<typeof useParties>['allOrganizationsSelected'];
  isLoading: ReturnType<typeof useParties>['isLoading'];
}

interface UseHeaderConfigReturn {
  isGlobalMenuEnabled: boolean;
  headerProps: HeaderProps;
}

export const useHeaderConfig = ({
  parties,
  selectedParties,
  allOrganizationsSelected,
  isLoading,
}: UseHeaderConfigProps): UseHeaderConfigReturn => {
  const isGlobalMenuEnabled = useFeatureFlag('globalMenu.enabled') as boolean;

  const { t } = useTranslation();
  const { logError } = useErrorLogger();
  const location = useLocation();
  const isProfile = location.pathname.includes(PageRoutes.profile);

  const { searchValue, setSearchValue, onClear } = useSearchString();
  const { autocomplete } = useAutocomplete({ selectedParties: selectedParties, searchValue });

  const { accounts, accountSearch, accountGroups, onSelectAccount, currentAccount, filterAccount } = useAccounts({
    parties,
    selectedParties,
    allOrganizationsSelected,
    isLoading,
  });

  const { mobileMenu, desktopMenu } = useGlobalMenu();

  const handleUpdateLanguage = async (language: string) => {
    try {
      await updateLanguage(language);
    } catch (error) {
      logError(
        error as Error,
        {
          context: 'useHeaderConfig.handleUpdateLanguage',
          language,
        },
        'Error updating language',
      );
    } finally {
      void i18n.changeLanguage(language);
    }
  };

  const commonProps = {
    logo: {
      as: (props: MenuItemProps) => {
        // @ts-ignore
        return <Link to={createHomeLink()} {...props} />;
      },
    },
    badge: {
      label: t('word.beta'),
      color: 'person' as const,
    },
    locale: {
      title: 'Språk/language',
      options: [
        { label: t('word.locale.nb'), value: 'nb', checked: i18n.language === 'nb' },
        { label: t('word.locale.nn'), value: 'nn', checked: i18n.language === 'nn' },
        { label: t('word.locale.en'), value: 'en', checked: i18n.language === 'en' },
      ],
      onSelect: (lang: string) => handleUpdateLanguage(lang),
    },
    mobileMenu,
  };

  // New GlobalHeader props structure
  if (isGlobalMenuEnabled) {
    const accountSelector = {
      accountMenu: {
        items: accounts,
        groups: accountGroups,
        currentAccount,
        onSelectAccount: (account: string) =>
          onSelectAccount(account, isProfile ? PageRoutes.profile : PageRoutes.inbox),
        filterAccount,
        ...(accountSearch && {
          search: accountSearch,
        }),
        isVirtualized: true,
      },
      loading: isLoading,
    };

    const globalHeaderProps: GlobalHeaderProps = {
      ...commonProps,
      globalMenu: {
        menuLabel: t('word.menu'),
        menu: desktopMenu,
        backLabel: t('word.back'),
        logoutButton: {
          label: t('word.log_out'),
          onClick: () => {
            (window as Window).location = `/api/logout`;
          },
        },
      },
      globalSearch: {
        onSearch: () => console.log('Search hit'),
      },
      desktopMenu,
      accountSelector,
    };

    return {
      isGlobalMenuEnabled,
      headerProps: globalHeaderProps,
    };
  }

  // Old Header props structure
  const headerProps: HeaderProps = {
    ...commonProps,
    currentAccount,
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
    globalMenu: {
      menuLabel: t('word.menu'),
      menu: desktopMenu,
      onSelectAccount: (account: string) => onSelectAccount(account, isProfile ? PageRoutes.profile : PageRoutes.inbox),
      backLabel: t('word.back'),
      accountMenu: {
        filterAccount,
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
  };

  return {
    isGlobalMenuEnabled,
    headerProps,
  };
};
