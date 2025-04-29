import {
  type BookmarksSectionProps,
  type FilterState,
  type QueryItemType,
  useSnackbar,
} from '@altinn/altinn-components';
import type { EditableBookmarkProps } from '@altinn/altinn-components/dist/types/lib/components';
import type { QueryItemProps } from '@altinn/altinn-components/dist/types/lib/components/Search/QueryLabel';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DialogStatus,
  type SavedSearchData,
  type SavedSearchesFieldsFragment,
  type SavedSearchesQuery,
  type SearchDataValueFilter,
  SystemLabel,
} from 'bff-types-generated';
import { type ChangeEvent, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, type LinkProps } from 'react-router-dom';
import type { InboxViewType } from '../../api/hooks/useDialogs.tsx';
import { createSavedSearch, deleteSavedSearch, fetchSavedSearches, updateSavedSearch } from '../../api/queries.ts';
import { getOrganization } from '../../api/utils/organizations.ts';
import { QUERY_KEYS } from '../../constants/queryKeys.ts';
import { useFormatDistance } from '../../i18n/useDateFnsLocale.tsx';
import { DateFilterOption } from '../Inbox/filters.ts';
import { useOrganizations } from '../Inbox/useOrganizations.ts';
import { PageRoutes } from '../routes.ts';
import { buildBookmarkURL } from './bookmarkURL.ts';
import { autoFormatRelativeTime, getMostRecentSearchDate } from './searchUtils.ts';

interface UseSavedSearchesOutput {
  savedSearches: SavedSearchesFieldsFragment[];
  isSuccess: boolean;
  isCTALoading: boolean;
  isLoading: boolean;
  currentPartySavedSearches: SavedSearchesFieldsFragment[] | undefined;
  saveSearch: (props: HandleSaveSearchProps) => Promise<void>;
  deleteSearch: (savedSearchId: number) => Promise<void>;
  bookmarkSectionProps: BookmarksSectionProps | undefined;
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
  const [savedSearchInputValue, setSavedSearchInputValue] = useState<string>('');
  const { organizations } = useOrganizations();

  const [expandedId, setExpandedId] = useState<string>('');
  const formatDistance = useFormatDistance();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { openSnackbar } = useSnackbar();

  const { data, isLoading, isSuccess } = useQuery<SavedSearchesQuery>({
    queryKey: [QUERY_KEYS.SAVED_SEARCHES, selectedPartyIds],
    queryFn: fetchSavedSearches,
    retry: 3,
    staleTime: 1000 * 60 * 20,
  });

  const endUsersSavedSearches = (data?.savedSearches ?? []) as SavedSearchesFieldsFragment[];
  const lastUpdated = getMostRecentSearchDate(endUsersSavedSearches);
  const currentPartySavedSearches = filterSavedSearches(endUsersSavedSearches, selectedPartyIds || []);

  const handleOnToggle = (itemId: string) => {
    const nextExpandedId = itemId === expandedId ? '' : itemId;
    if (nextExpandedId && endUsersSavedSearches.length) {
      setSavedSearchInputValue(endUsersSavedSearches.find((item) => item.id.toString() === nextExpandedId)?.name ?? '');
    }
    setExpandedId(nextExpandedId);
  };

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
      openSnackbar({
        message: t('savedSearches.saved_success'),
        color: 'success',
      });
    } catch (error) {
      openSnackbar({
        message: t('savedSearches.saved_error'),
        color: 'alert',
      });
      console.error('Error creating saved search: ', error);
    } finally {
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SAVED_SEARCHES] });
      setIsCTALoading(false);
    }
  };

  const deleteSearch = async (savedSearchId: number) => {
    setIsCTALoading(true);
    try {
      await deleteSavedSearch(savedSearchId);
      openSnackbar({
        message: t('savedSearches.deleted_success'),
        color: 'success',
      });
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SAVED_SEARCHES] });
    } catch (error) {
      console.error('Failed to delete saved search:', error);
      openSnackbar({
        message: t('savedSearches.delete_failed'),
        color: 'alert',
      });
    } finally {
      setIsCTALoading(false);
    }
  };

  const handleSaveTitle = async (id: number) => {
    try {
      await updateSavedSearch(id, savedSearchInputValue ?? '');
      openSnackbar({
        message: t('savedSearches.update_success'),
        color: 'success',
      });
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SAVED_SEARCHES] });
      setExpandedId('');
    } catch {
      openSnackbar({
        message: t('savedSearches.update_failed'),
        color: 'alert',
      });
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const bookmarkSectionProps = useMemo(() => {
    if (isLoading) {
      return {
        title: t('savedSearches.loading_saved_searches'),
        items: Array.from({ length: 3 }, (_, i) => ({
          id: i.toString(),
          title: t('savedSearches.loading_saved_searches') + randomString(),
          expandIconAltText: t('savedSearches.expand_icon_alt_text'),
        })),
        loading: true,
      };
    }

    if (isSuccess && !currentPartySavedSearches?.length) {
      return {
        title: t('savedSearches.no_saved_searches'),
        items: [],
        description: t('savedSearches.noSearchesFound'),
      };
    }

    const items: EditableBookmarkProps[] = currentPartySavedSearches.map((savedSearch) => {
      const bookmarkLink = buildBookmarkURL(savedSearch);
      const params: QueryItemProps[] = (savedSearch.data?.filters ?? []).map((filter) => {
        if (filter?.id === 'org') {
          const org = getOrganization(organizations, filter.value ?? '', 'nb')?.name || filter.value;
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
        id: savedSearch.id.toString(),
        expandIconAltText: t('savedSearches.expand_icon_alt_text'),
        title: savedSearch.name ?? '',
        as: (props: LinkProps) => <Link {...props} to={bookmarkLink} />,
        onChange: (e: ChangeEvent<HTMLInputElement>) => {
          setSavedSearchInputValue(e.target.value);
        },
        inputValue: savedSearchInputValue,
        saveButton: {
          label: t('savedSearches.save_search'),
          onClick: () => {
            void handleSaveTitle(savedSearch.id);
          },
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

    return {
      title: t('savedSearches.title', { count: currentPartySavedSearches?.length }),
      items,
      description: lastUpdated
        ? `${t('savedSearches.lastUpdated')}${autoFormatRelativeTime(lastUpdated, formatDistance)}`
        : '',
      expandedId,
      onToggle: handleOnToggle,
      titleField: {
        label: t('savedSearches.bookmark.item_input_label'),
        placeholder: t('savedSearches.bookmark.item_input_placeholder'),
        helperText: t('savedSearches.bookmark.item_input_helper'),
      },
      untitled: t('savedSearches.bookmark.untitled'),
    };
  }, [isLoading, isSuccess, currentPartySavedSearches, expandedId]);

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
