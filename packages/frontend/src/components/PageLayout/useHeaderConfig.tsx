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
import { Analytics } from '../../analytics.ts';
import { ANALYTICS_EVENTS } from '../../analyticsEvents.ts';
import { useParties } from '../../api/hooks/useParties.ts';
import { updateLanguage } from '../../api/queries.ts';
import { getFrontPageLink } from '../../auth';
import { useFeatureFlag } from '../../featureFlags';
import { useErrorLogger } from '../../hooks/useErrorLogger';
import { useProfile } from '../../pages/Profile';
import { PageRoutes } from '../../pages/routes.ts';
import { useGlobalMenu } from './GlobalMenu';
import { useAutocomplete, useSearchString } from './Search';
import { mapPartiesToAuthorizedParties } from './mapPartyToAuthorizedParty';

interface UseHeaderConfigReturn {
  headerProps: HeaderProps;
}

export const useHeaderConfig = (): UseHeaderConfigReturn => {
  const { currentEndUser, parties, selectedParties, isLoading, currentPartyUuid } = useParties();
  const { t, i18n } = useTranslation();
  const { logError } = useErrorLogger();
  const location = useLocation();
  const navigate = useNavigate();
  const isProfile = location.pathname.includes(PageRoutes.profile);

  const { searchValue, setSearchValue, onClear } = useSearchString();
  const { autocomplete } = useAutocomplete({ selectedParties, searchValue });

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

  const accountSelectorData = useAccountSelector({
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
    search: isProfile
      ? undefined
      : {
          expanded: false,
          name: t('word.search'),
          placeholder: t('inbox.search.placeholder'),
          value: searchValue,
          onClear,
          onChange: (event: ChangeEvent<HTMLInputElement>) => setSearchValue(event.target.value),
          autocomplete: {
            ...autocomplete,
            items: autocomplete.items,
          },
        },
    mobileMenu,
  };

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

  return {
    headerProps: globalHeaderProps,
  };
};
