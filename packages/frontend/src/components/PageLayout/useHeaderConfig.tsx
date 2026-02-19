import {
  type GlobalHeaderProps,
  type HeaderProps,
  type MenuItemProps,
  type ToolbarSearchProps,
  useAccountSelector,
} from '@altinn/altinn-components';
import type { ChangeEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Analytics } from '../../analytics/analytics.ts';
import { ANALYTICS_EVENTS } from '../../analytics/analyticsEvents.ts';
import { useParties } from '../../api/hooks/useParties.ts';
import { updateLanguage } from '../../api/queries.ts';
import { getFrontPageLink } from '../../auth';
import { useFeatureFlag } from '../../featureFlags';
import { useErrorLogger } from '../../hooks/useErrorLogger';
import { useProfile } from '../../pages/Profile';
import { PageRoutes } from '../../pages/routes.ts';
import { useGlobalMenu } from './GlobalMenu';
import { useSearchString } from './Search';
import { mapPartiesToAuthorizedParties } from './mapPartyToAuthorizedParty';

interface UseHeaderConfigOutput {
  headerProps: HeaderProps;
  inboxSearch: ToolbarSearchProps;
}

export const useHeaderConfig = (): UseHeaderConfigOutput => {
  const { currentEndUser, parties, selectedParties, isLoading, currentPartyUuid, setSelectedPartyIds } = useParties();
  const { t, i18n } = useTranslation();
  const { logError } = useErrorLogger();
  const location = useLocation();
  const navigate = useNavigate();
  const isProfile = location.pathname.includes(PageRoutes.profile);
  const { searchValue, setSearchValue, onSearch, onClear } = useSearchString();

  const [isTyping, setIsTyping] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  const isDeletedUnitsFilterEnabled = useFeatureFlag<boolean>('inbox.enableDeletedUnitsFilter');

  const {
    favoritesGroup,
    addFavoriteParty,
    deleteFavoriteParty,
    updateProfileLanguage,
    shouldShowDeletedEntities,
    updateShowDeletedEntities,
  } = useProfile();

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

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const handleSelectAccount = useCallback(
    (accountUuid: string) => {
      const targetRoute = isProfile ? PageRoutes.profile : PageRoutes.inbox;
      const party = parties.find((p) => p.partyUuid === accountUuid);

      if (!party) {
        console.error('Selected party not found:', accountUuid);
        return;
      }

      /* Selected party already selected */
      if (selectedParties.length === 1 && selectedParties[0].party === party.party) {
        return;
      }

      if (party.partyType === 'Person') {
        setSelectedPartyIds([party.party], false);
      } else {
        const search = new URLSearchParams(location.search);
        search.set('party', party.party);
        navigate(`${targetRoute}?${search.toString()}`, {
          replace: location.pathname === targetRoute,
        });
      }
    },
    [parties, isProfile, location.pathname, navigate],
  );

  const handleShowDeletedUnitsChange = useCallback(
    async (shouldShow: boolean) => {
      try {
        await updateShowDeletedEntities(shouldShow);
      } catch (error) {
        logError(
          error as Error,
          {
            context: 'useHeaderConfig.handleShowDeletedUnitsChange',
            shouldShow,
          },
          'Error updating show deleted units setting',
        );
      }
    },
    [updateShowDeletedEntities, logError],
  );

  const partyListDTO = mapPartiesToAuthorizedParties(parties);

  const favoriteAccountUuids = (favoritesGroup?.parties ?? []).filter(
    (uuid): uuid is string => uuid !== null && uuid !== undefined,
  );

  const selfAccountUuid = currentEndUser?.partyUuid;

  const accountSelector = useAccountSelector({
    partyListDTO,
    favoriteAccountUuids,
    currentAccountUuid: currentPartyUuid,
    selfAccountUuid,
    isLoading,
    virtualized: true,
    onSelectAccount: handleSelectAccount,
    onToggleFavorite: handleToggleFavorite,
    languageCode: i18n.language,
    ...(isDeletedUnitsFilterEnabled && {
      showDeletedUnits: shouldShowDeletedEntities ?? undefined,
      onShowDeletedUnitsChange: handleShowDeletedUnitsChange,
    }),
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
      /* Keep this optimistically to avoid refetching profile in order update state */
      updateProfileLanguage(language);
      void i18n.changeLanguage(language);
    }
  };

  const commonProps = {
    logo: {
      as: (props: MenuItemProps) => {
        // @ts-expect-error - LinkProps expects title: string, but we pass ReactNode
        return <Link to={getFrontPageLink(currentPartyUuid, i18n.language)} {...props} />;
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
    mobileMenu,
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
          Analytics.trackEvent(ANALYTICS_EVENTS.USER_LOGOUT, {
            'logout.source': 'header',
          });
          (window as Window).location = `/api/logout`;
        },
      },
    },
    globalSearch: {
      onSearch: (value: string) => {
        const encodedValue = encodeURIComponent(value);
        window.location.href = `${getFrontPageLink(currentPartyUuid)}/sok?q=${encodedValue}`;
      },
    },
    desktopMenu,
    accountSelector,
  };

  const inboxSearch: ToolbarSearchProps = {
    id: 'inbox-toolbar-search',
    collapsible: true,
    value: searchValue,
    loading: isTyping,
    onClear: () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setIsTyping(false);
      onClear();
    },
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      if (value === '') {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        setIsTyping(false);
        onClear();
        return;
      }
      setSearchValue(value);
      setIsTyping(true);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onSearch(value);
        setIsTyping(false);
      }, 500);
    },
    onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        setIsTyping(false);
        searchValue ? onSearch(searchValue) : onClear();
      }
    },
    name: t('word.search'),
    placeholder: t('inbox.search.placeholder'),
    minLength: 1,
  };

  return {
    headerProps: globalHeaderProps,
    inboxSearch,
  };
};
