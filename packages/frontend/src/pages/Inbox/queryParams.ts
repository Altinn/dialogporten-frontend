import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

/**
 * A party group is a virtual selection that resolves to a dynamic set of parties (capped at
 * MAX_DIALOG_PARTY_SIZE). `ALL_COMPANIES` is the successor of the legacy `allParties=true` flag.
 * The concept is intentionally open-ended so future groups (e.g. favorites) can reuse it.
 */
export type PartyGroup = 'ALL_COMPANIES' | 'ALL_PERSONS';

export const PartyGroups: Record<PartyGroup, PartyGroup> = {
  ALL_COMPANIES: 'ALL_COMPANIES',
  ALL_PERSONS: 'ALL_PERSONS',
};

export const isPartyGroup = (value: string | null | undefined): value is PartyGroup =>
  value === PartyGroups.ALL_COMPANIES || value === PartyGroups.ALL_PERSONS;

export const FixedGlobalQueryParams = {
  party: 'party',
  allParties: 'allParties',
  group: 'group',
  subAccounts: 'subAccounts',
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
 * Resolves the selected party group from the URL.
 * Reads the new `group` param, and maps the legacy `allParties=true` flag to `ALL_COMPANIES`.
 */
export const getSelectedGroupFromQueryParams = (searchParams: URLSearchParams): PartyGroup | null => {
  const group = searchParams.get(FixedGlobalQueryParams.group);
  if (isPartyGroup(group)) {
    return group;
  }
  if (getSelectedAllPartiesFromQueryParams(searchParams)) {
    return PartyGroups.ALL_COMPANIES;
  }
  return null;
};

export const getSelectedSubAccountsFromQueryParams = (searchParams: URLSearchParams): string[] => {
  return decodeSubAccountIds(searchParams.get(FixedGlobalQueryParams.subAccounts));
};

export const encodeSubAccountIds = (ids: string[]): string | undefined => {
  if (!ids.length) return undefined;
  const compressed = compressToEncodedURIComponent(JSON.stringify(ids));
  return compressed || undefined;
};

export const decodeSubAccountIds = (value?: string | null): string[] => {
  if (!value) return [];
  const decompressed = decompressFromEncodedURIComponent(value);
  if (!decompressed) return [];
  try {
    const parsed = JSON.parse(decompressed);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === 'string' && id.length > 0);
  } catch {
    return [];
  }
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
