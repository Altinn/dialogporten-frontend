import {
  type BookmarkSettingsGroupProps,
  type BookmarkSettingsItemProps,
  type BookmarkSettingsListProps,
  type FilterState,
  useSnackbar,
} from '@altinn/altinn-components';
import { MagnifyingGlassIcon, PencilIcon, TrashIcon } from '@navikt/aksel-icons';
import { useQueryClient } from '@tanstack/react-query';
import type {
  SavedSearchData,
  SavedSearchesFieldsFragment,
  SavedSearchesQuery,
  SearchDataValueFilter,
} from 'bff-types-generated';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, type LinkProps, useNavigate } from 'react-router-dom';
import { Analytics } from '../../analytics/analytics.ts';
import { ANALYTICS_EVENTS } from '../../analytics/analyticsEvents.ts';
import type { InboxViewType } from '../../api/hooks/useDialogs.tsx';
import { useParties } from '../../api/hooks/useParties.ts';
import { useFilterServiceResources } from '../../api/hooks/useServiceResource.ts';
import { createSavedSearch, deleteSavedSearch, fetchSavedSearches, updateSavedSearch } from '../../api/queries.ts';
import { useAuthenticatedQuery } from '../../auth/useAuthenticatedQuery.tsx';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { useErrorLogger } from '../../hooks/useErrorLogger';
import { useDateFnsLocale } from '../../i18n/useDateFnsLocale.tsx';
import { buildOrganizationMap } from '../../utils/organizations.ts';
import { useOrganizations } from '../Inbox/useOrganizations.ts';
import { PageRoutes } from '../routes.ts';
import { buildCurrentStateURL, buildSavedSearchURL } from './bookmarkURL.ts';
import { buildFilterParams, fromPathToViewType } from './searchUtils.ts';

interface UseSavedSearchesOutput {
  savedSearches: SavedSearchesFieldsFragment[];
  isSuccess: boolean;
  isCTALoading: boolean;
  isLoading: boolean;
  currentPartySavedSearches: SavedSearchesFieldsFragment[] | undefined;
  saveSearch: (props: HandleSaveSearchProps) => Promise<string | undefined>;
  onDeleteSavedSearch: (id: string) => Promise<void>;
  items: BookmarkSettingsListProps['items'];
  groups: BookmarkSettingsListProps['groups'];
  description?: string;
  openedSavedSearch?: string | null;
  onCloseSavedSearch: () => void;
  onSaveSearch?: (id: string, title: string) => void;
}

interface HandleSaveSearchProps {
  filters: FilterState;
  selectedParties: string[];
  enteredSearchValue: string;
  viewType: InboxViewType;
  name?: string;
}

const randomString = () => {
  return Math.random()
    .toString(36)
    .slice(2, 2 + Math.floor(Math.random() * 11));
};

export const convertFilterStateToFilters = (filters: FilterState): SearchDataValueFilter[] => {
  return Object.entries(filters).flatMap(([key, values]) => {
    if (Array.isArray(values)) {
      return values.map((value) => ({ id: key, value: String(value) }));
    }
    return [];
  });
};

export const convertFiltersToFilterState = (
  filters?:
    | Array<{
        __typename?: 'SearchDataValueFilter';
        id?: string | null;
        value?: string | null;
      } | null>
    | null
    | undefined,
): FilterState => {
  const result: FilterState = {};
  if (!filters) return result;

  for (const filter of filters) {
    if (!filter?.id || !filter.value) continue;

    if (filter?.id && typeof filter.value !== 'undefined') {
      if (!result[filter.id]) {
        result[filter.id] = [];
      }
      result[filter.id]!.push(filter.value);
    }
  }

  return result;
};

export const filterSavedSearches = (
  savedSearches: SavedSearchesFieldsFragment[],
  selectedPartyIds: string[],
): SavedSearchesFieldsFragment[] => {
  return (savedSearches ?? []).filter((savedSearch) => {
    if (!savedSearch?.data.urn?.length) {
      return true;
    }

    if (savedSearch?.data?.urn?.length > 0) {
      return selectedPartyIds.includes(savedSearch?.data.urn[0]!);
    }

    if (selectedPartyIds?.length !== savedSearch?.data?.urn?.length) {
      return false;
    }

    return selectedPartyIds?.every((party) => savedSearch?.data?.urn?.includes(party));
  });
};

export const useSavedSearches = (selectedPartyIds?: string[]): UseSavedSearchesOutput => {
  const [isCTALoading, setIsCTALoading] = useState<boolean>(false);
  const [openedSavedSearch, setOpenedSavedSearch] = useState<string | null>(null);
  const { organizations } = useOrganizations();
  const orgMap = useMemo(() => buildOrganizationMap(organizations), [organizations]);
  const { serviceResourceById } = useFilterServiceResources();
  const { currentEndUser, setSelectedPartyIds, setSelectedParties, partyGraph } = useParties();
  const { locale } = useDateFnsLocale();
  const navigate = useNavigate();

  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { openSnackbar } = useSnackbar();
  const { logError } = useErrorLogger();

  const { data, isLoading, isSuccess } = useAuthenticatedQuery<SavedSearchesQuery>({
    queryKey: [QUERY_KEYS.SAVED_SEARCHES, selectedPartyIds],
    queryFn: fetchSavedSearches,
    retry: 3,
    staleTime: 1000 * 60 * 20,
    enabled: !!selectedPartyIds && selectedPartyIds?.length > 0,
  });

  const endUsersSavedSearches = (data?.savedSearches ?? []) as SavedSearchesFieldsFragment[];
  const currentPartySavedSearches = filterSavedSearches(endUsersSavedSearches, selectedPartyIds || []);

  const saveSearch = async ({
    filters,
    selectedParties,
    enteredSearchValue,
    viewType,
    name,
  }: HandleSaveSearchProps): Promise<string | undefined> => {
    try {
      setIsCTALoading(true);
      const data: SavedSearchData = {
        filters: convertFilterStateToFilters(filters),
        urn: selectedParties,
        searchString: enteredSearchValue,
        fromView: PageRoutes[viewType],
      };
      const result = await createSavedSearch(name ?? '', data);

      Analytics.trackEvent(ANALYTICS_EVENTS.SAVED_SEARCH_CREATE_SUCCESS, {
        'search.viewType': viewType,
        'search.hasSearchString': !!enteredSearchValue,
        'search.searchStringLength': enteredSearchValue?.length || 0,
        'search.partyCount': selectedParties?.length || 0,
        'search.filterCount': Object.keys(filters).length,
      });

      openSnackbar({
        message: t('savedSearches.saved_success'),
        color: 'company',
      });
      return result.createSavedSearch?.id.toString();
    } catch (error) {
      openSnackbar({
        message: t('savedSearches.saved_error'),
        color: 'danger',
      });
      logError(
        error as Error,
        {
          context: 'useSavedSearches.saveSearch',
          data,
        },
        'Failed to create saved search',
      );
    } finally {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SAVED_SEARCHES] });
      setIsCTALoading(false);
    }
  };

  const onDeleteSavedSearch = async (id: string) => {
    setIsCTALoading(true);
    try {
      const savedSearchId = Number.parseInt(id);
      await deleteSavedSearch(savedSearchId);

      Analytics.trackEvent(ANALYTICS_EVENTS.SAVED_SEARCH_DELETE_SUCCESS, {
        'search.id': savedSearchId,
      });

      openSnackbar({
        message: t('savedSearches.deleted_success'),
        color: 'company',
      });
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SAVED_SEARCHES] });
    } catch (error) {
      logError(
        error as Error,
        {
          context: 'useSavedSearches.deleteSavedSearch',
          savedSearchId: id,
        },
        'Failed to delete saved search',
      );
      openSnackbar({
        message: t('savedSearches.delete_failed'),
        color: 'danger',
      });
    } finally {
      setIsCTALoading(false);
    }
  };

  const handleSaveTitle = async (id: string, name: string) => {
    try {
      const savedSearchId = Number.parseInt(id);
      await updateSavedSearch(savedSearchId, name ?? '');

      if (name) {
        Analytics.trackEvent(ANALYTICS_EVENTS.SAVED_SEARCH_TITLE_UPDATE_SUCCESS, {
          'search.id': id,
          'search.newTitleLength': name?.length || 0,
        });
      }

      openSnackbar({
        message: t('savedSearches.update_success'),
        color: 'company',
      });
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SAVED_SEARCHES] });
    } catch {
      openSnackbar({
        message: t('savedSearches.update_failed'),
        color: 'danger',
      });
    }
  };

  const getSavedSearchGroupId = useCallback(
    (savedSearch: SavedSearchesFieldsFragment): string => {
      const urn = savedSearch.data?.urn;
      if (!urn?.length) return 'personal';
      if (urn.length === 1 && urn[0] === currentEndUser?.party) return 'personal';
      if (urn.length === 1) return urn[0]!;
      return 'all-organizations';
    },
    [currentEndUser?.party],
  );

  const groups: Record<string, BookmarkSettingsGroupProps> = useMemo(() => {
    const result: Record<string, BookmarkSettingsGroupProps> = {
      personal: { title: t('savedSearches.groups.personal') },
      'all-organizations': { title: t('savedSearches.groups.all_organizations') },
    };

    for (const savedSearch of endUsersSavedSearches) {
      const groupId = getSavedSearchGroupId(savedSearch);
      if (groupId !== 'personal' && groupId !== 'all-organizations' && !result[groupId]) {
        result[groupId] = { title: partyGraph.partyByUrn.get(groupId)?.name ?? groupId };
      }
    }
    return result;
  }, [endUsersSavedSearches, getSavedSearchGroupId, partyGraph, t]);

  if (isLoading) {
    const items = Array.from({ length: 3 }, (_, i) => ({
      id: 'loading-' + i.toString(),
      title: t('savedSearches.loading_saved_searches') + randomString(),
    }));
    return {
      items,
      groups,
      isLoading: true,
      savedSearches: endUsersSavedSearches,
      isSuccess,
      currentPartySavedSearches,
      isCTALoading,
      saveSearch,
      onDeleteSavedSearch,
      onCloseSavedSearch: () => setOpenedSavedSearch(null),
    };
  }

  if (isSuccess && !endUsersSavedSearches?.length) {
    return {
      isLoading: false,
      description: t('savedSearches.noSearchesFound'),
      items: [],
      groups,
      savedSearches: endUsersSavedSearches,
      isSuccess,
      currentPartySavedSearches,
      isCTALoading,
      saveSearch,
      onDeleteSavedSearch,
      onCloseSavedSearch: () => setOpenedSavedSearch(null),
    };
  }

  const items: BookmarkSettingsItemProps[] = endUsersSavedSearches.map((savedSearch) => {
    const bookmarkLink = buildSavedSearchURL(savedSearch);
    const searchId = savedSearch.id.toString();
    const groupId = getSavedSearchGroupId(savedSearch);
    const params = buildFilterParams(savedSearch, { organizations: orgMap, serviceResourceById, locale, t });
    /* PartyId for person users cannot be exposed in url because in risk of leaking sensitive info */
    const isPersonBookmark =
      savedSearch?.data?.urn?.length === 1 && savedSearch.data?.urn[0]?.includes('urn:altinn:person:identifier-no:');
    return {
      id: searchId,
      groupId,
      title: savedSearch.name || '',
      'aria-label': !savedSearch.name && t('filter_bar.saved_search'),
      onClick: () => {
        if (isPersonBookmark && savedSearch?.data?.urn?.[0]) {
          setSelectedPartyIds([savedSearch?.data?.urn?.[0]], null);
        } else if (!isPersonBookmark && savedSearch?.data?.urn?.length === 1 && savedSearch?.data?.urn?.[0]) {
          const party = partyGraph.partyByUrn.get(savedSearch.data.urn[0]);
          if (party) {
            setSelectedParties([party]);
          }
        }
      },
      as: (props: LinkProps) => <Link {...props} to={bookmarkLink} />,
      contextMenu: {
        id: `menu-saved-search-${savedSearch.id}`,
        items: [
          {
            id: `menu-saved-search-${savedSearch.id}-link`,
            groupId: '1',
            title: t('savedSearches.use_search'),
            icon: MagnifyingGlassIcon,
            onClick: () => {
              if (isPersonBookmark && savedSearch?.data?.urn?.[0]) {
                setSelectedPartyIds([savedSearch?.data?.urn?.[0]], null);
              }
              navigate(
                `${buildCurrentStateURL(convertFiltersToFilterState(savedSearch.data?.filters ?? []), savedSearch.data?.searchString ?? '', fromPathToViewType(savedSearch.data?.fromView ?? '') ?? 'inbox')}`,
              );
            },
          },
          {
            id: `menu-saved-search-${savedSearch.id}-edit`,
            groupId: '2',
            title: t('savedSearches.edit_title'),
            icon: PencilIcon,
            onClick: () => {
              setOpenedSavedSearch(savedSearch.id.toString());
            },
          },
          {
            id: `menu-saved-search-${savedSearch.id}-delete`,
            groupId: '2',
            title: t('savedSearches.delete_search_menu'),
            icon: TrashIcon,
            onClick: () => {
              void onDeleteSavedSearch(savedSearch.id.toString());
            },
          },
        ],
      },
      removeButton: {
        children: t('savedSearches.delete_search'),
        onClick: () => {
          void onDeleteSavedSearch(savedSearch.id.toString());
        },
      },
      params,
    };
  });

  return {
    savedSearches: endUsersSavedSearches,
    isLoading,
    isSuccess,
    currentPartySavedSearches,
    isCTALoading,
    saveSearch,
    onDeleteSavedSearch: onDeleteSavedSearch,
    items,
    groups,
    onCloseSavedSearch: () => setOpenedSavedSearch(null),
    openedSavedSearch,
    onSaveSearch: handleSaveTitle,
  };
};
