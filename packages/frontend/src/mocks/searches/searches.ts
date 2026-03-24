import type { SavedSearchesFieldsFragment } from 'bff-types-generated';

export const savedSearchesMock: SavedSearchesFieldsFragment[] = [
  {
    id: 1,
    name: 'Avsluttede saker',
    createdAt: '1727346030948',
    updatedAt: '1727346030948',
    data: {
      urn: ['urn:altinn:person:identifier-no:1'],
      searchString: '',
      fromView: '/',
      filters: [{ id: 'status', value: 'COMPLETED' }],
    },
  },
  {
    id: 2,
    name: 'Under behandling',
    createdAt: '1729252080765',
    updatedAt: '1729252080765',
    data: {
      urn: ['urn:altinn:person:identifier-no:1'],
      searchString: '',
      fromView: '/',
      filters: [{ id: 'status', value: 'IN_PROGRESS' }],
    },
  },
  {
    id: 3,
    name: 'Firma-saker krever handling',
    createdAt: '1729252080765',
    updatedAt: '1730000000000',
    data: {
      urn: ['urn:altinn:organization:identifier-no:1'],
      searchString: '',
      fromView: '/',
      filters: [{ id: 'status', value: 'REQUIRES_ACTION' }],
    },
  },
];
