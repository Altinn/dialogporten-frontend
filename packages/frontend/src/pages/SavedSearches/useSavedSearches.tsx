import {
  type BookmarkSettingsItemProps,
  type BookmarkSettingsListProps,
  type FilterState,
  type QueryItemType,
  useSnackbar,
} from '@altinn/altinn-components';
import type { QueryItemProps } from '@altinn/altinn-components';
import { MagnifyingGlassIcon, PencilIcon, TrashIcon } from '@navikt/aksel-icons';
import { useQueryClient } from '@tanstack/react-query';
import {
  DialogStatus,
  type SavedSearchData,
  type SavedSearchesFieldsFragment,
  type SavedSearchesQuery,
  type SearchDataValueFilter,
  SystemLabel,
} from 'bff-types-generated';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, type LinkProps, useNavigate } from 'react-router-dom';
import { Analytics } from '../../analytics/analytics.ts';
import { ANALYTICS_EVENTS } from '../../analytics/analyticsEvents.ts';
import type { InboxViewType } from '../../api/hooks/useDialogs.tsx';
import { useServiceResource } from '../../api/hooks/useServiceResource.ts';
import { createSavedSearch, deleteSavedSearch, fetchSavedSearches, updateSavedSearch } from '../../api/queries.ts';
import { getOrganization } from '../../api/utils/organizations.ts';
import { useAuthenticatedQuery } from '../../auth/useAuthenticatedQuery.tsx';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { useErrorLogger } from '../../hooks/useErrorLogger';
import { useDateFnsLocale, useFormatDistance } from '../../i18n/useDateFnsLocale.tsx';
import { DateFilterOption, formatSingleDate } from '../Inbox/filters';
import { decodeSubAccountIds } from '../Inbox/queryParams.ts';
import { useOrganizations } from '../Inbox/useOrganizations.ts';
import { PageRoutes } from '../routes.ts';
import { buildCurrentStateURL, buildSavedSearchURL } from './bookmarkURL.ts';
import { autoFormatRelativeTime, getMostRecentSearchDate } from './searchUtils.ts';

interface UseSavedSearchesOutput {
  savedSearches: SavedSearchesFieldsFragment[];
  isSuccess: boolean;
  isCTALoading: boolean;
  isLoading: boolean;
  currentPartySavedSearches: SavedSearchesFieldsFragment[] | undefined;
  saveSearch: (props: HandleSaveSearchProps) => Promise<void>;
  onDeleteSavedSearch: (id: string) => Promise<void>;
  title: string;
  items: BookmarkSettingsListProps['items'];
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
}

const randomString = () => {
  return Math.random()
    .toString(36)
    .slice(2, 2 + Math.floor(Math.random() * 11));
};

const isPlaceholderValue = (value: string | undefined | null) => {
  if (value) {
    const values = [
      ...Object.values(DateFilterOption),
      ...Object.values(DialogStatus),
      ...Object.values(SystemLabel),
    ] as string[];
    return value.toUpperCase() === value && values.includes(value);
  }
  return false;
};

export const fromPathToViewType = (path: string | null | undefined): InboxViewType | undefined => {
  if (!path) {
    return undefined;
  }

  const entry = Object.entries(PageRoutes).find(([, route]) => route === path);
  return entry ? (entry[0] as InboxViewType) : 'inbox';
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
  const { serviceResources } = useServiceResource();
  const { locale } = useDateFnsLocale();
  const navigate = useNavigate();

  const formatDistance = useFormatDistance();
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
  const lastUpdated = getMostRecentSearchDate(endUsersSavedSearches);
  const currentPartySavedSearches = filterSavedSearches(endUsersSavedSearches, selectedPartyIds || []);

  const saveSearch = async ({
    filters,
    selectedParties,
    enteredSearchValue,
    viewType,
  }: HandleSaveSearchProps): Promise<void> => {
    try {
      setIsCTALoading(true);
      const data: SavedSearchData = {
        filters: convertFilterStateToFilters(filters),
        urn: selectedParties,
        searchString: enteredSearchValue,
        fromView: PageRoutes[viewType],
      };
      await createSavedSearch('', data);

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

  if (isLoading) {
    const items = Array.from({ length: 3 }, (_, i) => ({
      id: 'loading-' + i.toString(),
      title: t('savedSearches.loading_saved_searches') + randomString(),
    }));
    return {
      title: t('savedSearches.loading_saved_searches'),
      items,
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

  if (isSuccess && !currentPartySavedSearches?.length) {
    return {
      isLoading: false,
      title: t('savedSearches.no_saved_searches'),
      description: t('savedSearches.noSearchesFound'),
      items: [],
      savedSearches: endUsersSavedSearches,
      isSuccess,
      currentPartySavedSearches,
      isCTALoading,
      saveSearch,
      onDeleteSavedSearch,
      onCloseSavedSearch: () => setOpenedSavedSearch(null),
    };
  }

  const items: BookmarkSettingsItemProps[] = currentPartySavedSearches.map((savedSearch) => {
    const bookmarkLink = buildSavedSearchURL(savedSearch);
    const searchId = savedSearch.id.toString();
    const hiddenFilters = ['fromAndToDate'];

    const params: QueryItemProps[] = (savedSearch.data?.filters ?? [])
      .filter((filter) => filter?.value && !hiddenFilters.includes(filter.value))
      .map((filter) => {
        if (filter?.id === 'subAccounts') {
          const subAccountIds = decodeSubAccountIds(filter?.value);
          if (subAccountIds)
            return {
              id: 'subAccounts',
              type: 'filter' as QueryItemType,
              label: t('parties.labels.units_count', { count: subAccountIds.length }),
            };
        }

        if (filter?.id === 'org') {
          const org = getOrganization(organizations, filter.value ?? '')?.name || filter.value;
          return {
            id: org,
            type: 'filter' as QueryItemType,
            label: org ?? '',
          };
        }

        if (filter?.id === 'service') {
          const service = serviceResources.find((sr) => sr.id === filter.value);
          return {
            id: 'serivce' + service?.id,
            type: 'filter' as QueryItemType,
            label: service?.title ?? '',
          };
        }

        if (filter?.id === 'fromDate' && filter?.value) {
          return {
            id: 'filter-from',
            type: 'filter' as QueryItemType,
            label: t('filter.query.fromDate', { date: formatSingleDate(filter.value, locale) }),
          };
        }

        if (filter?.id === 'toDate' && filter?.value) {
          return {
            id: 'filter-to',
            type: 'filter' as QueryItemType,
            label: t('filter.query.toDate', { date: formatSingleDate(filter.value, locale) }),
          };
        }

        return {
          id: 'filter-' + filter?.value,
          type: 'filter' as QueryItemType,
          label: isPlaceholderValue(filter?.value)
            ? t(`filter.query.${(filter?.value ?? '').toLowerCase()}`)
            : (filter?.value ?? ''),
        };
      });

    if (savedSearch.data?.fromView) {
      const viewType = fromPathToViewType(savedSearch.data.fromView);
      if (viewType !== 'inbox') {
        params.push({ type: 'filter', label: t(`filter.query.${(viewType as string).toLowerCase()}`) });
      }
    }

    if (savedSearch.data?.searchString) {
      params.push({ type: 'search', label: savedSearch.data.searchString });
    }

    return {
      id: searchId,
      title: savedSearch.name || '',
      'aria-label': !savedSearch.name && t('filter_bar.saved_search'),
      as: (props: LinkProps) => <Link {...props} to={bookmarkLink} />,
      contextMenu: {
        id: `menu-saved-search-${savedSearch.id}`,
        items: [
          {
            id: `menu-saved-search-${savedSearch.id}-link`,
            groupId: '1',
            title: t('inbox.search.placeholder'),
            icon: MagnifyingGlassIcon,
            onClick: () => {
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
    title: t('savedSearches.title', { count: currentPartySavedSearches?.length }),
    description: lastUpdated
      ? `${t('savedSearches.lastUpdated')}${autoFormatRelativeTime(lastUpdated, formatDistance)}`
      : '',
    savedSearches: endUsersSavedSearches,
    isLoading,
    isSuccess,
    currentPartySavedSearches,
    isCTALoading,
    saveSearch,
    onDeleteSavedSearch: onDeleteSavedSearch,
    items,
    onCloseSavedSearch: () => setOpenedSavedSearch(null),
    openedSavedSearch,
    onSaveSearch: handleSaveTitle,
  };
};
