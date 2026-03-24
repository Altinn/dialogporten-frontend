import {
  type FilterState,
  type GlobalHeaderProps,
  type HeaderProps,
  QueryLabel,
  type ToolbarSearchProps,
  useAccountSelector,
} from '@altinn/altinn-components';
import type { ChangeEvent } from 'react';
import { useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, type LinkProps, useLocation, useNavigate } from 'react-router-dom';
import { Analytics } from '../../analytics/analytics.ts';
import { ANALYTICS_EVENTS } from '../../analytics/analyticsEvents.ts';
import {
  useCurrentEndUser,
  useCurrentPartyUuid,
  usePartiesLoading,
  usePartyGraph,
  useSelectedParties,
  useSetSelectedPartyIds,
} from '../../api/hooks/usePartiesSelectors.ts';
import { updateLanguage } from '../../api/queries.ts';
import { createFiltersURLQuery, getFrontPageLink } from '../../auth';
import { useFeatureFlag } from '../../featureFlags';
import { useErrorLogger } from '../../hooks/useErrorLogger';
import { FilterCategory } from '../../pages/Inbox/filters.tsx';
import { FixedGlobalQueryParams, pruneSearchQueryParams } from '../../pages/Inbox/queryParams.ts';
import { useProfile } from '../../pages/Profile';
import { PageRoutes } from '../../pages/routes.ts';
import { useGlobalMenu } from './GlobalMenu';
import { useSearchString } from './Search';
import { mapPartiesToAuthorizedParties } from './mapPartyToAuthorizedParty';

interface UseHeaderConfigOutput {
  headerProps: HeaderProps;
  inboxSearch: ToolbarSearchProps;
}

export const useHeaderConfig = (filterState?: FilterState): UseHeaderConfigOutput => {
  const currentEndUser = useCurrentEndUser();
  const partyGraph = usePartyGraph();
  const selectedParties = useSelectedParties();
  const isLoading = usePartiesLoading();
  const currentPartyUuid = useCurrentPartyUuid();
  const setSelectedPartyIds = useSetSelectedPartyIds();
  const { t, i18n } = useTranslation();
  const { logError } = useErrorLogger();
  const location = useLocation();
  const navigate = useNavigate();
  const { searchValue, setSearchValue, onClear } = useSearchString();

  const isDeletedUnitsFilterEnabled = useFeatureFlag<boolean>('inbox.enableDeletedUnitsFilter');

  const {
    favoritesGroup,
    addFavoriteParty,
    deleteFavoriteParty,
    updateProfileLanguage,
    shouldShowDeletedEntities,
    updateShowDeletedEntities,
  } = useProfile();

  // Use refs so handleToggleFavorite has a stable identity and doesn't
  // invalidate useAccountSelector's useMemo (which reprocesses 12k parties).
  const favoritesRef = useRef(favoritesGroup?.parties);
  favoritesRef.current = favoritesGroup?.parties;
  const addFavoriteRef = useRef(addFavoriteParty);
  addFavoriteRef.current = addFavoriteParty;
  const deleteFavoriteRef = useRef(deleteFavoriteParty);
  deleteFavoriteRef.current = deleteFavoriteParty;
  const logErrorRef = useRef(logError);
  logErrorRef.current = logError;

  const handleToggleFavorite = useCallback(async (accountUuid: string) => {
    const isFavorite = favoritesRef.current?.includes(accountUuid);
    try {
      if (isFavorite) {
        await deleteFavoriteRef.current(accountUuid);
      } else {
        await addFavoriteRef.current(accountUuid);
      }
    } catch (error) {
      logErrorRef.current(
        error as Error,
        {
          context: 'useHeaderConfig.handleToggleFavorite',
          accountUuid,
          action: isFavorite ? 'remove' : 'add',
        },
        'Error toggling favorite party',
      );
    }
  }, []);

  // Stable ref for handleSelectAccount to avoid invalidating useAccountSelector's memo
  const partyGraphRef = useRef(partyGraph);
  partyGraphRef.current = partyGraph;
  const selectedPartiesRef = useRef(selectedParties);
  selectedPartiesRef.current = selectedParties;
  const setSelectedPartyIdsRef = useRef(setSelectedPartyIds);
  setSelectedPartyIdsRef.current = setSelectedPartyIds;
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  const handleSelectAccount = useCallback((accountUuid: string) => {
    const loc = window.location;
    const currentIsProfile = loc.pathname.includes(PageRoutes.profile);
    const targetRoute = currentIsProfile ? PageRoutes.profile : PageRoutes.inbox;
    const party = partyGraphRef.current.partyByUuid.get(accountUuid);

    if (!party) {
      console.error('Selected party not found:', accountUuid);
      return;
    }

    /* Selected party already selected */
    const sp = selectedPartiesRef.current;
    if (sp.length === 1 && sp[0].party === party.party) {
      return;
    }

    if (party.partyType === 'Person') {
      setSelectedPartyIdsRef.current([party.party], false);
    } else {
      const search = new URLSearchParams(loc.search);
      search.set('party', party.party);
      search.delete('allParties');
      search.delete(FixedGlobalQueryParams.subAccounts);
      navigateRef.current(`${targetRoute}?${search.toString()}`, {
        replace: loc.pathname === targetRoute,
      });
    }
  }, []);

  const updateShowDeletedEntitiesRef = useRef(updateShowDeletedEntities);
  updateShowDeletedEntitiesRef.current = updateShowDeletedEntities;

  const handleShowDeletedUnitsChange = useCallback(async (shouldShow: boolean) => {
    try {
      await updateShowDeletedEntitiesRef.current(shouldShow);
    } catch (error) {
      logErrorRef.current(
        error as Error,
        {
          context: 'useHeaderConfig.handleShowDeletedUnitsChange',
          shouldShow,
        },
        'Error updating show deleted units setting',
      );
    }
  }, []);

  const partyListDTO = useMemo(() => mapPartiesToAuthorizedParties(partyGraph.parties, partyGraph), [partyGraph]);

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
      as: (props: LinkProps) => {
        return <Link {...props} to={getFrontPageLink(currentPartyUuid, i18n.language)} />;
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
    accountSelector: {
      ...accountSelector,
    },
  };

  const ignoreCountFor = ['fromDate', 'toDate', 'search'];
  const activeFilters = Object.keys(filterState ?? {})
    .filter((key) => !ignoreCountFor.includes(key))
    .filter((key) => (filterState?.[key]?.length ?? 0) > 0);

  const inboxSearch: ToolbarSearchProps = {
    id: 'inbox-toolbar-search',
    collapsible: true,
    value: searchValue,
    onClear,
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      if (value === '') {
        onClear();
      } else {
        setSearchValue(value);
      }
    },
    name: t('word.search'),
    placeholder: t('inbox.search.placeholder'),
    minLength: 3,
    menu: {
      groups: {
        suggestions: {
          title: '',
        },
      },
      items: [
        {
          groupId: 'suggestions',
          title: searchValue,
          label: <QueryLabel params={[{ type: 'search', value: searchValue, label: searchValue }]} />,
          'aria-label': t('search.autocomplete.searchInInbox', { query: searchValue }),
          onClick: () => {
            navigate(`${location.pathname}${pruneSearchQueryParams(location.search, { search: searchValue })}`);
          },
          as: 'button',
          linkIcon: true,
        },
        {
          groupId: 'suggestions',
          title: searchValue,
          'aria-label': t('search.autocomplete.searchInInbox_with_filters', {
            query: searchValue,
            count: activeFilters.length,
          }),
          hidden: activeFilters.length === 0,
          label: (
            <QueryLabel
              params={[
                { type: 'search', value: searchValue, label: searchValue },
                {
                  type: 'filter',
                  value: 'filters',
                  label: t('search.autoComplete.activeFilters', { count: activeFilters.length }),
                },
              ]}
            />
          ),
          onClick: () => {
            const currentURL = new URL(window.location.href);
            const allowedFilters = Object.values(FilterCategory);
            const updatedURL = createFiltersURLQuery(filterState ?? {}, allowedFilters, currentURL.toString());
            const searchParams = new URLSearchParams(updatedURL.searchParams);
            searchParams.set('search', searchValue);
            navigate(`${location.pathname}?${searchParams.toString()}`);
          },
          as: 'button',
          linkIcon: true,
        },
      ],
      onClose: () => {},
    },
  };

  return {
    headerProps: globalHeaderProps,
    inboxSearch,
  };
};
