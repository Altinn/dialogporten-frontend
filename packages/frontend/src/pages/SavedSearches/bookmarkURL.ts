import type { SavedSearchesFieldsFragment } from 'bff-types-generated';

export const buildBookmarkURL = (savedSearch: SavedSearchesFieldsFragment) => {
  const { searchString, filters, fromView } = savedSearch.data;
  const urlParams = new URLSearchParams(window.location.search);
  const allPartiesInURL = urlParams.get('allParties');
  const queryParams = new URLSearchParams(
    Object.entries({
      search: searchString,
      party: allPartiesInURL ? null : urlParams.get('party'), // Exclude 'party' if 'allParties' exists
      allParties: allPartiesInURL,
    }).reduce(
      (acc, [key, value]) => {
        if (value) {
          acc[key] = value;
        }
        return acc;
      },
      {} as Record<string, string>,
    ),
  );

  if (filters) {
    for (const filter of filters) {
      if (filter?.id) {
        queryParams.append(filter.id, String(filter.value));
      }
    }
  }
  return `${fromView}?${queryParams.toString()}`;
};
