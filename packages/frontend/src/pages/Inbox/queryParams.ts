export const FixedGlobalQueryParams = {
  party: 'party',
  allParties: 'allParties',
  mock: 'mock',
  playwrightId: 'playwrightId',
};

export const VariableGlobalQueryParams = {
  search: 'search',
};

export const getSearchStringFromQueryParams = (searchParams: URLSearchParams): string => {
  return searchParams.get(VariableGlobalQueryParams.search) || '';
};

export const getSelectedPartyFromQueryParams = (searchParams: URLSearchParams): string => {
  return decodeURIComponent(searchParams.get(FixedGlobalQueryParams.party) || '');
};

export const getSelectedAllPartiesFromQueryParams = (searchParams: URLSearchParams): boolean => {
  return searchParams.get(FixedGlobalQueryParams.allParties) === 'true';
};

/**
 * Extracts the global search query parameters from the given search string.
 *
 * This function takes the current location.search string and returns a new search string
 * containing only the global query parameters defined in GlobalQueryParams, if they are present
 * in the original location.search string.
 *
 * @param {string} currentSearch - The current location.search string.
 * @param appendQueryParams - An optional object containing additional query parameters to append after pruning.
 * @returns {string} - A new search string containing only the global query parameters, or an empty string if none are present.
 */
export const pruneSearchQueryParams = (
  currentSearch: string,
  appendQueryParams?: Record<string, string | undefined>,
): string => {
  const searchParams = new URLSearchParams(currentSearch);
  const newSearchParams = new URLSearchParams();

  for (const key of Object.values(FixedGlobalQueryParams)) {
    if (searchParams.has(key)) {
      newSearchParams.set(key, searchParams.get(key)!);
    }
  }

  for (const [key, value] of Object.entries(appendQueryParams || {})) {
    if (typeof value === 'string' && value.length > 0) {
      newSearchParams.set(key, value);
    }
  }

  return newSearchParams.toString() === '' ? '' : `?${newSearchParams.toString()}`;
};
