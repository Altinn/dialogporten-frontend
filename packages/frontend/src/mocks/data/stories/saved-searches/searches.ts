import type { SavedSearchesFieldsFragment } from 'bff-types-generated';

// Preview at: ?mock=true&playwrightId=saved-searches
export const searches: SavedSearchesFieldsFragment[] = [
  {
    id: 1,
    name: 'Avsluttede saker',
    createdAt: '1727346030948',
    updatedAt: '1730000000003',
    data: {
      urn: ['urn:altinn:person:identifier-no:1'],
      searchString: '',
      fromView: '/',
      filters: [{ id: 'status', value: 'COMPLETED' }],
    },
  },
  {
    id: 2,
    name: 'Krever handling',
    createdAt: '1729252080765',
    updatedAt: '1730000000002',
    data: {
      urn: ['urn:altinn:person:identifier-no:1'],
      searchString: 'skatten',
      fromView: '/',
      filters: [{ id: 'status', value: 'REQUIRES_ACTION' }],
    },
  },
  {
    id: 3,
    name: 'Firma-saker under behandling',
    createdAt: '1729252080765',
    updatedAt: '1730000000001',
    data: {
      urn: ['urn:altinn:organization:identifier-no:1'],
      searchString: '',
      fromView: '/',
      filters: [{ id: 'status', value: 'IN_PROGRESS' }],
    },
  },
  {
    id: 4,
    name: 'Alle virksomheter – avsluttet',
    createdAt: '1729252080765',
    updatedAt: '1730000000000',
    data: {
      urn: ['urn:altinn:person:identifier-no:1', 'urn:altinn:organization:identifier-no:1'],
      searchString: '',
      fromView: '/',
      filters: [{ id: 'status', value: 'COMPLETED' }],
    },
  },
];
