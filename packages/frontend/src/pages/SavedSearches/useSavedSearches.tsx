import {
  type BookmarksSettingsItemProps,
  type BookmarksSettingsListProps,
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
import { type ChangeEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, type LinkProps, useNavigate } from 'react-router-dom';
import { Analytics } from '../../analytics';
import { ANALYTICS_EVENTS } from '../../analyticsEvents';
import type { InboxViewType } from '../../api/hooks/useDialogs.tsx';
import { createSavedSearch, deleteSavedSearch, fetchSavedSearches, updateSavedSearch } from '../../api/queries.ts';
import { getOrganization } from '../../api/utils/organizations.ts';
import { useAuthenticatedQuery } from '../../auth/useAuthenticatedQuery.tsx';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { useErrorLogger } from '../../hooks/useErrorLogger';
import { useFormatDistance } from '../../i18n/useDateFnsLocale.tsx';
import { DateFilterOption } from '../Inbox/filters.ts';
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
  deleteSearch: (savedSearchId: number) => Promise<void>;
  bookmarkSectionProps: BookmarksSettingsListProps | undefined;
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
  const [showModalItemId, setShowModalItemId] = useState<string | null>(null);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const { organizations } = useOrganizations();
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
        color: 'accent',
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

  const deleteSearch = async (savedSearchId: number) => {
    setIsCTALoading(true);
    try {
      await deleteSavedSearch(savedSearchId);

      Analytics.trackEvent(ANALYTICS_EVENTS.SAVED_SEARCH_DELETE_SUCCESS, {
        'search.id': savedSearchId,
      });

      openSnackbar({
        message: t('savedSearches.deleted_success'),
        color: 'accent',
      });
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SAVED_SEARCHES] });
    } catch (error) {
      logError(
        error as Error,
        {
          context: 'useSavedSearches.deleteSearch',
          savedSearchId,
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

  const handleSaveTitle = async (id: number, name: string) => {
    try {
      await updateSavedSearch(id, name ?? '');

      if (name) {
        Analytics.trackEvent(ANALYTICS_EVENTS.SAVED_SEARCH_TITLE_UPDATE_SUCCESS, {
          'search.id': id,
          'search.newTitleLength': name?.length || 0,
        });
      }

      openSnackbar({
        message: t('savedSearches.update_success'),
        color: 'accent',
      });
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SAVED_SEARCHES] });
    } catch {
      openSnackbar({
        message: t('savedSearches.update_failed'),
        color: 'danger',
      });
    }
  };

  let bookmarkSectionProps: BookmarksSettingsListProps | undefined;

  if (isLoading) {
    bookmarkSectionProps = {
      title: t('savedSearches.loading_saved_searches'),
      items: Array.from({ length: 3 }, (_, i) => ({
        id: i.toString(),
        title: t('savedSearches.loading_saved_searches') + randomString(),
        expandIconAltText: t('savedSearches.expand_icon_alt_text'),
        onClose: () => setShowModalItemId(null),
      })),
      loading: true,
    };
  } else if (isSuccess && !currentPartySavedSearches?.length) {
    bookmarkSectionProps = {
      title: t('savedSearches.no_saved_searches'),
      items: [],
      description: t('savedSearches.noSearchesFound'),
    };
  } else {
    const items: BookmarksSettingsItemProps[] = currentPartySavedSearches.map((savedSearch) => {
      const bookmarkLink = buildSavedSearchURL(savedSearch);
      const searchId = savedSearch.id.toString();
      const currentInputValue = inputValues[searchId] ?? savedSearch.name ?? '';

      const params: QueryItemProps[] = (savedSearch.data?.filters ?? []).map((filter) => {
        if (filter?.id === 'org') {
          const org = getOrganization(organizations, filter.value ?? '')?.name || filter.value;
          return {
            type: 'filter' as QueryItemType,
            label: org ?? '',
          };
        }
        return {
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
        title: savedSearch.name || t('filter_bar.saved_search'),
        as: (props: LinkProps) => <Link {...props} to={bookmarkLink} />,
        onChange: (e: ChangeEvent<HTMLInputElement>) => {
          setInputValues((prev) => ({ ...prev, [searchId]: e.target.value }));
        },
        inputValue: currentInputValue,
        titleField: {
          label: t('savedSearches.bookmark.item_input_label'),
          placeholder: t('savedSearches.bookmark.item_input_placeholder'),
          helperText: t('savedSearches.bookmark.item_input_helper'),
        },
        saveButton: {
          label: t('savedSearches.save_search'),
          disabled: currentInputValue === savedSearch.name,
          onClick: () => {
            void handleSaveTitle(savedSearch.id, currentInputValue);
          },
        },
        onClose: () => setShowModalItemId(null),
        open: showModalItemId === savedSearch.id.toString(),
        contextMenu: {
          id: `menu-saved-search-${savedSearch.id}`,
          items: [
            {
              id: 'search-inbox',
              title: t('inbox.search.placeholder'),
              icon: MagnifyingGlassIcon,
              onClick: () => {
                navigate(
                  `${PageRoutes.inbox}?${buildCurrentStateURL(convertFiltersToFilterState(savedSearch.data?.filters ?? []), savedSearch.data?.searchString ?? '', fromPathToViewType(savedSearch.data?.fromView ?? '') ?? 'inbox')}`,
                );
              },
            },
            {
              id: 'edit-saved-search',
              title: t('savedSearches.edit_title'),
              icon: PencilIcon,
              onClick: () => {
                setShowModalItemId(savedSearch.id.toString());
              },
            },
            {
              id: 'delete-saved-search',
              title: t('savedSearches.delete_search_menu'),
              icon: TrashIcon,
              onClick: () => {
                void deleteSearch(savedSearch.id);
              },
            },
          ],
          onClose: () => console.info('close'),
        },

        removeButton: {
          label: t('savedSearches.delete_search'),
          onClick: () => {
            void deleteSearch(savedSearch.id);
          },
        },
        params,
      };
    });

    bookmarkSectionProps = {
      title: t('savedSearches.title', { count: currentPartySavedSearches?.length }),
      items,
      description: lastUpdated
        ? `${t('savedSearches.lastUpdated')}${autoFormatRelativeTime(lastUpdated, formatDistance)}`
        : '',
      untitled: t('savedSearches.bookmark.untitled'),
    };
  }

  return {
    savedSearches: endUsersSavedSearches,
    isLoading,
    isSuccess,
    currentPartySavedSearches,
    isCTALoading,
    saveSearch,
    deleteSearch,
    bookmarkSectionProps,
  };
};
