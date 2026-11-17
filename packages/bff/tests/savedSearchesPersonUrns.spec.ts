import { graphql } from 'graphql/index.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SavedSearchData } from '../src/entities.ts';
import { bffSchema } from '../src/graphql/schema.ts';
import { decryptPersonUrn, encryptPersonUrn } from '../src/party/personUrnCipher.ts';

const { createSavedSearchMock, listSavedSearchesMock } = vi.hoisted(() => ({
  createSavedSearchMock: vi.fn(),
  listSavedSearchesMock: vi.fn(),
}));

vi.mock('../src/redisClient.ts', () => ({ default: {} }));

vi.mock('../src/graphql/savedSearches/service.ts', () => ({
  createSavedSearch: createSavedSearchMock,
  listSavedSearches: listSavedSearchesMock,
  deleteSavedSearch: vi.fn(),
  updateSavedSearch: vi.fn(),
}));

vi.mock('../src/graphql/profile/service.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/graphql/profile/service.ts')>()),
  ensureProfile: vi.fn(async () => 'pid-1'),
}));

const PERSON_URN = 'urn:altinn:person:identifier-no:20815497741';
const ORG_URN = 'urn:altinn:organization:identifier-no:312159600';
const ENCRYPTED_PERSON_URN = /^urn:altinn:person:identifier-no:enc:/;

const contextValue = { session: { get: (key: string) => (key === 'pid' ? 'pid-1' : undefined) } };

const createMutation = `
  mutation CreateSavedSearch($name: String, $data: SavedSearchInput) {
    createSavedSearch(name: $name, data: $data) {
      id
      name
      data { urn searchString }
    }
  }
`;

const savedSearchesQuery = `
  query SavedSearches {
    savedSearches {
      id
      data { urn }
    }
  }
`;

describe('saved search person URNs in GraphQL responses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('stores the plain person URN but returns it encrypted from createSavedSearch', async () => {
    let stored: { name: string; data: SavedSearchData } | undefined;
    createSavedSearchMock.mockImplementation(async (input: { name: string; data: SavedSearchData }) => {
      stored = input;
      return { id: 7, name: input.name, data: input.data };
    });

    const result = await graphql({
      schema: bffSchema,
      source: createMutation,
      contextValue,
      variableValues: {
        name: 'Mine krav',
        data: { searchString: 'skatt', urn: [encryptPersonUrn(PERSON_URN), ORG_URN] },
      },
    });

    expect(result.errors).toBeUndefined();
    expect(stored?.data.urn).toEqual([PERSON_URN, ORG_URN]);

    const created = (result.data as { createSavedSearch: { id: number; data: { urn: string[] } } }).createSavedSearch;
    expect(created.id).toBe(7);
    expect(created.data.urn[0]).toMatch(ENCRYPTED_PERSON_URN);
    expect(decryptPersonUrn(created.data.urn[0])).toBe(PERSON_URN);
    expect(created.data.urn[1]).toBe(ORG_URN);
  });

  it('returns stored person URNs encrypted from savedSearches', async () => {
    listSavedSearchesMock.mockResolvedValue([
      { id: 1, data: { urn: [PERSON_URN, ORG_URN] } },
      { id: 2, data: { searchString: 'uten urn' } },
    ]);

    const result = await graphql({ schema: bffSchema, source: savedSearchesQuery, contextValue });

    expect(result.errors).toBeUndefined();
    const searches = (result.data as { savedSearches: { id: number; data: { urn: string[] | null } }[] }).savedSearches;
    expect(searches[0].data.urn?.[0]).toMatch(ENCRYPTED_PERSON_URN);
    expect(searches[0].data.urn?.[1]).toBe(ORG_URN);
    expect(searches[1].data.urn).toBeNull();
  });
});
