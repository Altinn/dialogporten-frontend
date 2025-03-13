import type { SavedSearchData, SavedSearchesFieldsFragment } from 'bff-types-generated';
import { describe, expect, it } from 'vitest';
import { getAlreadySavedSearch } from './alreadySaved';

const mockedSavedSearches: SavedSearchesFieldsFragment[] = [
  {
    id: 1,
    name: '',
    createdAt: '1734948711786',
    updatedAt: '1734948711786',
    data: {
      urn: ['urn:altinn:organization:identifier-no:1', 'urn:altinn:organization:identifier-no:2'],
      searchString: '',
      fromView: '/',
      filters: [
        {
          id: 'sender',
          value: 'Skatteetaten',
        },
        {
          id: 'sender',
          value: 'Digitaliseringsdirektoratet',
        },
      ],
    },
  },
  {
    id: 2,
    name: '',
    createdAt: '1734949347292',
    updatedAt: '1734949347292',
    data: {
      urn: ['urn:altinn:person:identifier-no:2'],
      searchString: '',
      fromView: '/',
      filters: [
        {
          id: 'sender',
          value: 'digitaliseringsdirektoratet',
        },
        {
          id: 'sender',
          value: 'Skatteetaten',
        },
      ],
    },
  },
];

describe('getAlreadySavedSearch', () => {
  it('should return undefined when savedSearches is undefined', () => {
    const searchDataToCheck: SavedSearchData = {};
    const result = getAlreadySavedSearch(searchDataToCheck, undefined, 'inbox');
    expect(result).toBeUndefined();
  });

  it('should return the matching saved search', () => {
    const searchDataToCheck: SavedSearchData = mockedSavedSearches[1].data;
    const result = getAlreadySavedSearch(searchDataToCheck, mockedSavedSearches, 'inbox');
    expect(result?.id).toEqual(2);
  });

  it('should return the matching saved search disregarding order of keys and values', () => {
    const mockedSearchDataToCheck: SavedSearchData = {
      urn: ['urn:altinn:organization:identifier-no:2', 'urn:altinn:organization:identifier-no:1'],
      searchString: '',
      fromView: '/',
      filters: [
        {
          id: 'sender',
          value: 'Digitaliseringsdirektoratet',
        },
        {
          id: 'sender',
          value: 'Skatteetaten',
        },
      ],
    };
    const result = getAlreadySavedSearch(mockedSearchDataToCheck, mockedSavedSearches, 'inbox');
    expect(result?.id).toEqual(1);
  });

  it('should return undefined when fromView in search data is different than saved searches matched by filters', () => {
    const searchDataToCheck: SavedSearchData = {
      urn: ['urn:altinn:organization:identifier-no:1', 'urn:altinn:organization:identifier-no:2'],
      searchString: '',
      fromView: '/drafts',
      filters: [
        {
          id: 'sender',
          value: 'Skatteetaten',
        },
        {
          id: 'sender',
          value: 'Digitaliseringsdirektoratet',
        },
      ],
    };
    const result = getAlreadySavedSearch(searchDataToCheck, mockedSavedSearches, 'inbox');
    expect(result).toBeUndefined();
  });
});
