import { inputObjectType, list, objectType } from 'nexus';

export const Response = objectType({
  name: 'Response',
  definition(t) {
    t.nonNull.boolean('success');
    t.string('message');
    t.nullable.int('retryAfter');
  },
});

export const SavedSearchInput = inputObjectType({
  name: 'SavedSearchInput',
  definition(t) {
    t.string('searchString');
    t.string('fromView');
    t.list.string('urn');
    t.list.field('filters', { type: 'SearchDataValueFilterInput' });
  },
});

export const SearchDataValueFilterInput = inputObjectType({
  name: 'SearchDataValueFilterInput',
  definition(t) {
    t.string('id');
    t.string('value');
  },
});

export const SavedSearches = objectType({
  name: 'SavedSearches',
  nonNullDefaults: {
    input: true,
    output: true,
  },
  definition(t) {
    t.int('id', {
      description: 'id of savedSearch',
    });
    t.string('name', {
      description: 'Name of saved search',
    });
    t.field('data', {
      type: 'SavedSearchData',
      description: 'Data of saved search, contains searchString and filters',
    });
    t.string('createdAt', {
      description: 'createdAt',
    });
    t.string('updatedAt', {
      description: 'updatedAt',
    });
  },
});

export const SavedSearchData = objectType({
  name: 'SavedSearchData',
  definition(t) {
    t.string('searchString', {
      description: 'searchString of savedSearch',
    });
    t.string('fromView', {
      description: 'fromView of savedSearch',
    });
    t.list.string('urn', {
      description: 'urns of savedSearch',
    });
    t.field('filters', {
      type: list('SearchDataValueFilter'),
      description: 'filters for SearchDataFilter',
    });
  },
});

export const SearchDataValueFilter = objectType({
  name: 'SearchDataValueFilter',
  definition(t) {
    t.string('id', {
      description: 'id',
    });
    t.string('value', {
      description: 'value',
    });
  },
});
