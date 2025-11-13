import {
  type GlobalHeaderProps,
  type HeaderProps,
  type MenuItemProps,
  useAccountSelector,
} from '@altinn/altinn-components';
import type { ChangeEvent } from 'react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useParties } from '../../api/hooks/useParties.ts';
import { updateLanguage } from '../../api/queries.ts';
import { createHomeLink } from '../../auth';
import { useFeatureFlag } from '../../featureFlags';
import { useErrorLogger } from '../../hooks/useErrorLogger';
import { i18n } from '../../i18n/config.ts';
import { useProfile } from '../../pages/Profile';
import { PageRoutes } from '../../pages/routes.ts';
import { useAccounts } from './Accounts/useAccounts.tsx';
import { useGlobalMenu } from './GlobalMenu';
import { useAutocomplete, useSearchString } from './Search';
import { mapPartiesToAuthorizedParties } from './mapPartyToAuthorizedParty';

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
  const navigate = useNavigate();
  const isProfile = location.pathname.includes(PageRoutes.profile);

  const { searchValue, setSearchValue, onClear } = useSearchString();
  const { autocomplete } = useAutocomplete({ selectedParties: selectedParties, searchValue });

  const { favoritesGroup, addFavoriteParty, deleteFavoriteParty } = useProfile();

  const { currentEndUser } = useParties();

  const handleToggleFavorite = useCallback(
    async (accountUuid: string) => {
      const isFavorite = favoritesGroup?.parties?.includes(accountUuid);
      try {
        if (isFavorite) {
          await deleteFavoriteParty(accountUuid);
        } else {
          await addFavoriteParty(accountUuid);
        }
      } catch (error) {
        logError(
          error as Error,
          {
            context: 'useHeaderConfig.handleToggleFavorite',
            accountUuid,
            action: isFavorite ? 'remove' : 'add',
          },
          'Error toggling favorite party',
        );
      }
    },
    [favoritesGroup?.parties, addFavoriteParty, deleteFavoriteParty, logError],
  );

  const handleSelectAccount = useCallback(
    (accountUuid: string) => {
      const targetRoute = isProfile ? PageRoutes.profile : PageRoutes.inbox;
      const party = parties.find((p) => p.partyUuid === accountUuid);

      if (!party) {
        console.error('Selected party not found:', accountUuid);
        return;
      }

      const search = new URLSearchParams();
      search.append('party', encodeURIComponent(party.party));
      navigate(`${targetRoute}?${search.toString()}`, {
        replace: location.pathname === targetRoute,
      });
    },
    [parties, isProfile, location.pathname, navigate],
  );

  const partyListDTO = mapPartiesToAuthorizedParties(parties);

  const favoriteAccountUuids = (favoritesGroup?.parties ?? []).filter(
    (uuid): uuid is string => uuid !== null && uuid !== undefined,
  );

  // Get A2 selected account from the cookie - across A3 projects
  const getCookie = (name: string): string | undefined => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const cookieValue = parts.pop()?.split(';').shift();
      return cookieValue && cookieValue.trim() !== '' ? cookieValue : undefined;
    }
    return undefined;
  };

  const currentAccountUuid = getCookie('AltinnPartyUuid') ?? currentEndUser?.partyUuid;
  const selfAccountUuid = currentEndUser?.partyUuid;

  const accountSelectorData = useAccountSelector({
    partyListDTO,
    favoriteAccountUuids,
    currentAccountUuid,
    selfAccountUuid,
    isLoading,
    onSelectAccount: handleSelectAccount,
    onToggleFavorite: handleToggleFavorite,
    languageCode: i18n.language,
  });

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

    locale: {
      title: 'Språk/language',
      options: [
        { label: t('word.locale.nb'), value: 'nb', checked: i18n.language === 'nb' },
        { label: t('word.locale.nn'), value: 'nn', checked: i18n.language === 'nn' },
        { label: t('word.locale.en'), value: 'en', checked: i18n.language === 'en' },
      ],
      onSelect: (lang: string) => handleUpdateLanguage(lang),
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
  };

  // New GlobalHeader props structure
  if (isGlobalMenuEnabled) {
    const accountSelector = accountSelectorData;

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
        onSearch: (value: string) => {
          const encodedValue = encodeURIComponent(value);

          window.location.href = `${createHomeLink()}/sok?q=${encodedValue}`;
        },
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
    badge: {
      label: t('word.beta'),
      color: 'person' as const,
    },
    currentAccount,
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
