import type { FilterState } from '@altinn/altinn-components';
import { type SavedSearchesFieldsFragment, SystemLabel } from 'bff-types-generated';
import type { InboxViewType } from '../../api/hooks/useDialogs.tsx';
import { aggregateFilterState, FilterCategory } from '../Inbox/filters';
import { FixedGlobalQueryParams, getSelectedGroupFromQueryParams, PartyGroups } from '../Inbox/queryParams.ts';
import { PageRoutes } from '../routes.ts';
import { fromPathToViewType } from './searchUtils.ts';
import { convertFiltersToFilterState } from './useSavedSearches.tsx';

const routeForViewType = (viewType: InboxViewType | undefined): PageRoutes => {
  switch (viewType) {
    case 'drafts':
      return PageRoutes.drafts;
    case 'sent':
      return PageRoutes.sent;
    case 'archive':
      return PageRoutes.archive;
    case 'bin':
      return PageRoutes.bin;
    default:
      return PageRoutes.inbox;
  }
};

/**
 * Builds a URL from the current search state
 */
export const buildCurrentStateURL = (
  filterState: FilterState,
  searchString: string,
  viewType: InboxViewType,
): string => {
  const urlParams = new URLSearchParams(window.location.search);
  const groupInURL = getSelectedGroupFromQueryParams(urlParams);

  const queryParams = new URLSearchParams(
    Object.entries({
      search: searchString || undefined,
      party: groupInURL ? null : urlParams.get(FixedGlobalQueryParams.party),
      [FixedGlobalQueryParams.group]: groupInURL,
    }).reduce(
      (acc, [key, value]) => {
        if (value) acc[key] = value;
        return acc;
      },
      {} as Record<string, string>,
    ),
  );

  const aggregated = viewType !== 'inbox' ? aggregateFilterState(filterState, viewType) : filterState;

  for (const [key, values] of Object.entries(aggregated)) {
    if (Array.isArray(values)) {
      for (const val of values) {
        if (key === FilterCategory.STATUS && val === SystemLabel.Default) {
          continue;
        }
        queryParams.append(key, String(val));
      }
    } else if (values != null) {
      queryParams.append(key, String(values));
    }
  }

  return `${routeForViewType(viewType)}?${queryParams.toString()}`;
};

/**
 * Builds a URL from a saved search
 */
export const buildSavedSearchURL = (savedSearch: SavedSearchesFieldsFragment) => {
  const { searchString, filters } = savedSearch.data;
  const urn = savedSearch.data.urn;

  let partyParam: string | null = null;
  let groupParam: string | null = null;

  if (urn && urn.length > 1) {
    // A multi-party saved search is a group. Persons and companies never mix in one group.
    const allPersons = urn.every((u) => u?.includes('person'));
    groupParam = allPersons ? PartyGroups.ALL_PERSONS : PartyGroups.ALL_COMPANIES;
  } else if (urn?.length === 1 && !urn[0]?.includes('person')) {
    partyParam = urn[0] ?? null;
  }

  const queryParams = new URLSearchParams(
    Object.entries({
      search: searchString,
      party: groupParam ? null : partyParam,
      [FixedGlobalQueryParams.group]: groupParam,
    }).reduce(
      (acc, [key, value]) => {
        if (value) acc[key] = value;
        return acc;
      },
      {} as Record<string, string>,
    ),
  );

  const viewType = fromPathToViewType(savedSearch.data.fromView);
  const filterState = convertFiltersToFilterState(filters);
  const aggregated = viewType !== 'inbox' && viewType ? aggregateFilterState(filterState, viewType) : filterState;

  for (const [key, values] of Object.entries(aggregated)) {
    if (Array.isArray(values)) {
      for (const val of values) {
        if (key === FilterCategory.STATUS && val === SystemLabel.Default) {
          continue;
        }
        queryParams.append(key, String(val));
      }
    } else if (values != null) {
      queryParams.append(key, String(values));
    }
  }

  return `${routeForViewType(viewType)}?${queryParams.toString()}`;
};

/**
 * Normalizes a URL for comparison by sorting query parameters
 */
const normalizeURL = (url: string): string => {
  const [path, queryString] = url.split('?');
  if (!queryString) return path;

  const params = new URLSearchParams(queryString);
  const sortedParams = new URLSearchParams();

  // Sort parameters alphabetically
  const entries = Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b));

  for (const [key, value] of entries) {
    sortedParams.append(key, value);
  }

  return `${path}?${sortedParams.toString()}`;
};

/**
 * Finds a saved search that matches the current state by comparing URLs
 */
export const findMatchingSavedSearch = (
  currentStateURL: string,
  savedSearches: SavedSearchesFieldsFragment[] | undefined,
): SavedSearchesFieldsFragment | undefined => {
  if (!savedSearches) return undefined;

  const normalizedCurrentURL = normalizeURL(currentStateURL);

  return savedSearches.find((savedSearch) => {
    const savedSearchURL = buildSavedSearchURL(savedSearch);
    const normalizedSavedURL = normalizeURL(savedSearchURL);
    return normalizedCurrentURL === normalizedSavedURL;
  });
};
