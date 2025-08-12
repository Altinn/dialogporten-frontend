import type { FilterState } from '@altinn/altinn-components';
import { type SavedSearchesFieldsFragment, SystemLabel } from 'bff-types-generated';
import { describe, expect, it } from 'vitest';
import { FilterCategory } from '../Inbox/filters';
import { PageRoutes } from '../routes';
import { buildCurrentStateURL, buildSavedSearchURL, findMatchingSavedSearch } from './bookmarkURL.ts';

describe('buildCurrentStateURL', () => {
  it('should build URL with only path when no filters or search string', () => {
    const url = buildCurrentStateURL({}, '', 'inbox');
    expect(url).toBe(`${PageRoutes.inbox}?`);
  });

  it('should include search string in URL when provided', () => {
    const url = buildCurrentStateURL({}, 'test search', 'inbox');
    expect(url).toBe(`${PageRoutes.inbox}?search=test+search`);
  });

  it('should include single filter in URL', () => {
    const filterState: FilterState = {
      sender: ['Skatteetaten'],
    };
    const url = buildCurrentStateURL(filterState, '', 'inbox');
    expect(url).toContain('sender=Skatteetaten');
  });

  it('should include multiple values for same filter', () => {
    const filterState: FilterState = {
      sender: ['Skatteetaten', 'NAV', 'Digitaliseringsdirektoratet'],
    };
    const url = buildCurrentStateURL(filterState, '', 'inbox');
    expect(url).toContain('sender=Skatteetaten');
    expect(url).toContain('sender=NAV');
    expect(url).toContain('sender=Digitaliseringsdirektoratet');
  });

  it('should include multiple different filters', () => {
    const filterState: FilterState = {
      sender: ['Skatteetaten'],
      status: ['NEW', 'IN_PROGRESS'],
    };
    const url = buildCurrentStateURL(filterState, '', 'inbox');
    expect(url).toContain('sender=Skatteetaten');
    expect(url).toContain('status=NEW');
    expect(url).toContain('status=IN_PROGRESS');
  });

  it('should include both search string and filters', () => {
    const filterState: FilterState = {
      sender: ['NAV'],
      status: ['NEW'],
    };
    const url = buildCurrentStateURL(filterState, 'important message', 'inbox');
    expect(url).toContain('search=important+message');
    expect(url).toContain('sender=NAV');
    expect(url).toContain('status=NEW');
  });

  it('should skip default status filter', () => {
    const filterState: FilterState = {
      [FilterCategory.STATUS]: [SystemLabel.Default, 'NEW'],
    };
    const url = buildCurrentStateURL(filterState, '', 'inbox');
    expect(url).not.toContain(`${SystemLabel.Default}`);
    expect(url).toContain('status=NEW');
  });

  it('should handle non-array filter values', () => {
    const filterState: FilterState = {
      customFilter: ['singleValue'],
    };
    const url = buildCurrentStateURL(filterState, '', 'inbox');
    expect(url).toContain('customFilter=singleValue');
  });

  it('should ignore null and undefined filter values', () => {
    const filterState: FilterState = {
      nullFilter: undefined,
      undefinedFilter: undefined,
      emptyArray: [],
    };
    const url = buildCurrentStateURL(filterState, '', 'inbox');
    expect(url).not.toContain('nullFilter');
    expect(url).not.toContain('undefinedFilter');
    expect(url).not.toContain('emptyArray');
  });

  it('should handle different view types', () => {
    const filterState: FilterState = {
      sender: ['NAV'],
    };

    const inboxUrl = buildCurrentStateURL(filterState, '', 'inbox');
    const draftsUrl = buildCurrentStateURL(filterState, '', 'drafts');
    const sentUrl = buildCurrentStateURL(filterState, '', 'sent');

    // All should start with inbox route but may have different aggregation
    expect(inboxUrl).toContain(PageRoutes.inbox);
    expect(draftsUrl).toContain(PageRoutes.inbox);
    expect(sentUrl).toContain(PageRoutes.inbox);
  });
});

describe('buildSavedSearchURL', () => {
  const createSavedSearch = (
    searchString?: string,
    filters?: Array<{ id?: string; value?: string } | null>,
    fromView?: string,
  ): SavedSearchesFieldsFragment => ({
    __typename: 'SavedSearches',
    id: 1,
    name: 'Test Search',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    data: {
      __typename: 'SavedSearchData',
      searchString,
      filters,
      fromView: fromView || PageRoutes.inbox,
      urn: null,
    },
  });

  it('should build URL from saved search with no filters', () => {
    const savedSearch = createSavedSearch('test query');
    const url = buildSavedSearchURL(savedSearch);
    expect(url).toBe(`${PageRoutes.inbox}?search=test+query`);
  });

  it('should build URL from saved search with filters', () => {
    const savedSearch = createSavedSearch('', [
      { id: 'sender', value: 'NAV' },
      { id: 'status', value: 'NEW' },
    ]);
    const url = buildSavedSearchURL(savedSearch);
    expect(url).toContain('sender=NAV');
    expect(url).toContain('status=NEW');
  });

  it('should handle multiple values for same filter', () => {
    const savedSearch = createSavedSearch('', [
      { id: 'sender', value: 'NAV' },
      { id: 'sender', value: 'Skatteetaten' },
      { id: 'status', value: 'NEW' },
    ]);
    const url = buildSavedSearchURL(savedSearch);
    expect(url).toContain('sender=NAV');
    expect(url).toContain('sender=Skatteetaten');
    expect(url).toContain('status=NEW');
  });

  it('should handle saved search with both search string and filters', () => {
    const savedSearch = createSavedSearch('important', [
      { id: 'sender', value: 'NAV' },
      { id: 'status', value: 'NEW' },
    ]);
    const url = buildSavedSearchURL(savedSearch);
    expect(url).toContain('search=important');
    expect(url).toContain('sender=NAV');
    expect(url).toContain('status=NEW');
  });

  it('should skip default status in saved search', () => {
    const savedSearch = createSavedSearch('', [
      { id: FilterCategory.STATUS, value: SystemLabel.Default },
      { id: FilterCategory.STATUS, value: 'NEW' },
    ]);
    const url = buildSavedSearchURL(savedSearch);
    expect(url).not.toContain(SystemLabel.Default);
    expect(url).toContain('status=NEW');
  });
});

describe('findMatchingSavedSearch', () => {
  const createSavedSearch = (
    id: number,
    searchString?: string,
    filters?: Array<{ id?: string; value?: string } | null>,
    fromView?: string,
  ): SavedSearchesFieldsFragment => ({
    __typename: 'SavedSearches',
    id,
    name: `Search ${id}`,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    data: {
      __typename: 'SavedSearchData',
      searchString,
      filters,
      fromView: fromView || PageRoutes.inbox,
      urn: null,
    },
  });

  it('should return undefined when savedSearches is undefined', () => {
    const currentURL = buildCurrentStateURL({}, 'test', 'inbox');
    const result = findMatchingSavedSearch(currentURL, undefined);
    expect(result).toBeUndefined();
  });

  it('should return undefined when savedSearches is empty', () => {
    const currentURL = buildCurrentStateURL({}, 'test', 'inbox');
    const result = findMatchingSavedSearch(currentURL, []);
    expect(result).toBeUndefined();
  });

  it('should find matching saved search with identical search string', () => {
    const savedSearches = [createSavedSearch(1, 'test query'), createSavedSearch(2, 'other query')];
    const currentURL = buildCurrentStateURL({}, 'test query', 'inbox');
    const result = findMatchingSavedSearch(currentURL, savedSearches);
    expect(result?.id).toBe(1);
  });

  it('should find matching saved search with identical filters', () => {
    const savedSearches = [
      createSavedSearch(1, '', [
        { id: 'sender', value: 'NAV' },
        { id: 'status', value: 'NEW' },
      ]),
      createSavedSearch(2, '', [{ id: 'sender', value: 'Skatteetaten' }]),
    ];
    const currentURL = buildCurrentStateURL({ sender: ['NAV'], status: ['NEW'] }, '', 'inbox');
    const result = findMatchingSavedSearch(currentURL, savedSearches);
    expect(result?.id).toBe(1);
  });

  it('should find match regardless of filter order', () => {
    const savedSearches = [
      createSavedSearch(1, '', [
        { id: 'status', value: 'NEW' },
        { id: 'sender', value: 'NAV' },
      ]),
    ];
    const currentURL = buildCurrentStateURL({ sender: ['NAV'], status: ['NEW'] }, '', 'inbox');
    const result = findMatchingSavedSearch(currentURL, savedSearches);
    expect(result?.id).toBe(1);
  });

  it('should not find match when filters differ', () => {
    const savedSearches = [createSavedSearch(1, '', [{ id: 'sender', value: 'NAV' }])];
    const currentURL = buildCurrentStateURL({ sender: ['Skatteetaten'] }, '', 'inbox');
    const result = findMatchingSavedSearch(currentURL, savedSearches);
    expect(result).toBeUndefined();
  });

  it('should not find match when search strings differ', () => {
    const savedSearches = [createSavedSearch(1, 'test query')];
    const currentURL = buildCurrentStateURL({}, 'different query', 'inbox');
    const result = findMatchingSavedSearch(currentURL, savedSearches);
    expect(result).toBeUndefined();
  });

  it('should correctly handle empty search state matching', () => {
    const savedSearches = [createSavedSearch(1, '', []), createSavedSearch(2, 'test', [])];
    const currentURL = buildCurrentStateURL({}, '', 'inbox');
    const result = findMatchingSavedSearch(currentURL, savedSearches);
    expect(result?.id).toBe(1);
  });

  it('should handle special characters in search strings', () => {
    const savedSearches = [createSavedSearch(1, 'test & special chars @#$')];
    const currentURL = buildCurrentStateURL({}, 'test & special chars @#$', 'inbox');
    const result = findMatchingSavedSearch(currentURL, savedSearches);
    expect(result?.id).toBe(1);
  });
});
