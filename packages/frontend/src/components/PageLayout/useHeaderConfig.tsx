import { type GlobalHeaderProps, useAccountSelector } from '@altinn/altinn-components';
import type { PartyFieldsFragment } from 'bff-types-generated';
import { useCallback, useDeferredValue, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, type LinkProps, useLocation, useNavigate } from 'react-router';
import { Analytics } from '../../analytics/analytics.ts';
import { ANALYTICS_EVENTS } from '../../analytics/analyticsEvents.ts';
import { EMPTY_PARTIES, useParties } from '../../api/hooks/useParties.ts';
import { updateLanguage } from '../../api/queries.ts';
import { getFrontPageLink } from '../../auth/url.ts';
import { useErrorLogger } from '../../hooks/useErrorLogger';
import { FixedGlobalQueryParams } from '../../pages/Inbox/queryParams.ts';
import { useProfile } from '../../pages/Profile/useProfile.tsx';
import { PageRoutes } from '../../pages/routes.ts';
import type { PartyGraph } from '../../utils/partyGraph.ts';
import { useGlobalMenu } from './GlobalMenu/useGlobalMenu.ts';
import { mapPartiesToAuthorizedParties } from './mapPartyToAuthorizedParty';

interface UseHeaderConfigOutput {
  headerProps: GlobalHeaderProps;
}

const getCurrentAccountParties = (partyGraph: PartyGraph, currentPartyUuid?: string): PartyFieldsFragment[] => {
  const currentParty = currentPartyUuid ? partyGraph.partyByUuid.get(currentPartyUuid) : undefined;
  const parentParty = currentParty ? partyGraph.parentByChildUrn.get(currentParty.party) : undefined;
  return [...new Set([partyGraph.currentEndUser, parentParty, currentParty])].filter(
    (party): party is PartyFieldsFragment => party !== undefined,
  );
};

export const useHeaderConfig = (): UseHeaderConfigOutput => {
  const { currentEndUser, parties, selectedParties, isLoading, currentPartyUuid, setSelectedPartyIds, partyGraph } =
    useParties();
  const { t, i18n } = useTranslation();
  const { logError } = useErrorLogger();
  const location = useLocation();
  const navigate = useNavigate();
  const isProfile = location.pathname.includes(PageRoutes.profile);

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
      const party = partyGraph.partyByUuid.get(accountUuid);

      if (!party) {
        console.error('Selected party not found:', accountUuid);
        return;
      }

      /* Selected party already selected */
      if (selectedParties.length === 1 && selectedParties[0].party === party.party) {
        return;
      }

      if (party.partyType === 'Person') {
        setSelectedPartyIds([party.party], null);
        if (location.pathname.startsWith('/inbox/')) {
          navigate(PageRoutes.inbox);
        }
      } else {
        const search = new URLSearchParams(location.search);
        search.set('party', party.party);
        search.delete('allParties');
        search.delete(FixedGlobalQueryParams.group);
        search.delete(FixedGlobalQueryParams.subAccounts);
        navigate(`${targetRoute}?${search.toString()}`, {
          replace: location.pathname === targetRoute,
        });
      }
    },
    [isProfile, partyGraph, selectedParties, setSelectedPartyIds, location.pathname, location.search, navigate],
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

  const deferredParties = useDeferredValue(parties, EMPTY_PARTIES);
  const accountListParties = useMemo(
    () => (deferredParties === parties ? parties : getCurrentAccountParties(partyGraph, currentPartyUuid)),
    [deferredParties, parties, partyGraph, currentPartyUuid],
  );

  const partyListDTO = useMemo(() => mapPartiesToAuthorizedParties(accountListParties), [accountListParties]);

  /* Must be referentially stable: useAccountSelector's full-list materialization memo depends on this
   * array, so a fresh array per render re-runs that O(n) rebuild on every header render. */
  const favoriteAccountUuids = useMemo(
    () => (favoritesGroup?.parties ?? []).filter((uuid): uuid is string => uuid !== null && uuid !== undefined),
    [favoritesGroup?.parties],
  );

  const selfAccountUuid = currentEndUser?.partyUuid;

  const accountSelector = useAccountSelector({
    partyListDTO,
    favoriteAccountUuids,
    currentAccountUuid: currentPartyUuid,
    selfAccountUuid,
    isLoading,
    virtualized: partyListDTO.length > 20,
    onSelectAccount: handleSelectAccount,
    onToggleFavorite: handleToggleFavorite,
    languageCode: i18n.language,
    showDeletedUnits: shouldShowDeletedEntities ?? undefined,
    onShowDeletedUnitsChange: handleShowDeletedUnitsChange,
  });

  const { mobileMenu, desktopMenu } = useGlobalMenu();

  const handleUpdateLanguage = async (language: string) => {
    if (language === i18n.language) return;
    /* Update locally first so duplicate onSelect calls from the library
       (desktop + mobile LocaleSwitchers) short-circuit on the guard above. */
    updateProfileLanguage(language);
    void i18n.changeLanguage(language);
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
    }
  };

  const commonProps = {
    logo: {
      as: (props: LinkProps) => {
        return <Link {...props} to={getFrontPageLink(i18n.language)} />;
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
    desktopMenu,
    accountSelector,
  };

  return {
    headerProps: globalHeaderProps,
  };
};
