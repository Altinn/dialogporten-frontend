import type { SavedSearchesFieldsFragment, ServiceResource } from 'bff-types-generated';
import type { Locale } from 'date-fns';
import type { TFunction } from 'i18next';
import { describe, expect, it } from 'vitest';
import type { OrganizationLookup } from '../../utils/organizations.ts';
import { buildFilterParams } from './searchUtils.ts';

const makeSavedSearch = (data: Partial<SavedSearchesFieldsFragment['data']>): SavedSearchesFieldsFragment => ({
  id: 1,
  name: 'My search',
  createdAt: '1700000000000',
  updatedAt: '1700000000000',
  data: {
    urn: [],
    filters: [],
    searchString: '',
    fromView: '/',
    ...data,
  },
});

const deps = {
  organizations: { byId: new Map(), byName: new Map() } as unknown as OrganizationLookup,
  serviceResourceById: new Map<string, ServiceResource>(),
  locale: {} as Locale,
  t: ((key: string) => key) as TFunction,
};

describe('buildFilterParams', () => {
  it('strips the quotes from a quoted search string and keeps it as one param', () => {
    const params = buildFilterParams(makeSavedSearch({ searchString: '"skattemeldingen"' }), deps);
    expect(params).toEqual([{ type: 'search', value: '"skattemeldingen"', label: 'skattemeldingen' }]);
  });

  it('splits an unquoted multi-word search string into one param per word', () => {
    const params = buildFilterParams(makeSavedSearch({ searchString: 'dialogen er' }), deps);
    expect(params).toEqual([
      { type: 'search', value: 'dialogen', label: 'dialogen' },
      { type: 'search', value: 'er', label: 'er' },
    ]);
  });

  it('returns no search param when the search string is empty', () => {
    const params = buildFilterParams(makeSavedSearch({ searchString: '' }), deps);
    expect(params).toEqual([]);
  });
});
