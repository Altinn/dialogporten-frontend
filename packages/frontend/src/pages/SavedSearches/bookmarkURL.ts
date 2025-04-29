import type { SavedSearchesFieldsFragment } from 'bff-types-generated';
import { aggregateFilterState } from '../Inbox/filters.ts';
import { PageRoutes } from '../routes.ts';
import { convertFiltersToFilterState, fromPathToViewType } from './useSavedSearches.tsx';

export const buildBookmarkURL = (savedSearch: SavedSearchesFieldsFragment) => {
  const { searchString, filters } = savedSearch.data;
  const urlParams = new URLSearchParams(window.location.search);
  const allPartiesInURL = urlParams.get('allParties');

  const queryParams = new URLSearchParams(
    Object.entries({
      search: searchString,
      party: allPartiesInURL ? null : urlParams.get('party'),
      allParties: allPartiesInURL,
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
        queryParams.append(key, String(val));
      }
    } else if (values != null) {
      queryParams.append(key, String(values));
    }
  }

  return `${PageRoutes.inbox}?${queryParams.toString()}`;
};
