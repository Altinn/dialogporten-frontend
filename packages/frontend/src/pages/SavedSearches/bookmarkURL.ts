import { type SavedSearchesFieldsFragment, SystemLabel } from 'bff-types-generated';
import { FilterCategory, aggregateFilterState } from '../Inbox/filters.ts';
import { PageRoutes } from '../routes.ts';
import { convertFiltersToFilterState, fromPathToViewType } from './useSavedSearches.tsx';
import type { InboxViewType } from '../../api/hooks/useDialogs.tsx';

export const buildBookmarkURL = (searchString: string, filters: any, fromView: InboxViewType) => {
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

  const viewType = fromPathToViewType(fromView);
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

  return `${PageRoutes.inbox}?${queryParams.toString()}`;
};
