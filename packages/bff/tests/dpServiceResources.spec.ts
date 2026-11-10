import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type Context, getSessionToken, type SessionStorageToken } from '../src/auth/oidc.ts';
import { getDpServiceResources } from '../src/graphql/serviceResources/dpService.ts';

vi.mock('axios', () => ({ default: vi.fn() }));
vi.mock('../src/auth/oidc.ts', () => ({ getSessionToken: vi.fn() }));
vi.mock('../src/config.ts', () => ({ default: { dialogporten: { graphqlUrl: 'https://dialogporten.test/graphql' } } }));
vi.mock('@altinn/dialogporten-node-logger', () => ({ logger: { error: vi.fn() } }));

const mockedAxios = vi.mocked(axios as unknown as (config: unknown) => Promise<{ data: unknown }>);
const mockedGetSessionToken = vi.mocked(getSessionToken);
const context = {} as Context;

describe('getDpServiceResources', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetSessionToken.mockReturnValue({ access_token: 'token' } as SessionStorageToken);
  });

  it('returns the mapped resources', async () => {
    mockedAxios.mockResolvedValue({
      data: {
        data: {
          serviceResources: {
            items: [
              {
                serviceResource: { id: 'res-b', name: [{ languageCode: 'nb', value: 'Bravo' }] },
                serviceOwner: { code: 'SKD' },
              },
              {
                serviceResource: { id: 'res-a', name: [{ languageCode: 'nb', value: 'Alfa' }] },
                serviceOwner: { code: 'NAV' },
              },
            ],
          },
        },
      },
    });

    await expect(getDpServiceResources(['nb'], context)).resolves.toEqual([
      { id: 'res-a', title: 'Alfa', org: 'nav' },
      { id: 'res-b', title: 'Bravo', org: 'skd' },
    ]);
  });

  it('returns an empty list when Dialogporten has no service resources', async () => {
    mockedAxios.mockResolvedValue({ data: { data: { serviceResources: { items: [] } } } });

    await expect(getDpServiceResources(['nb'], context)).resolves.toEqual([]);
  });

  it('throws when the request fails or times out', async () => {
    mockedAxios.mockRejectedValue(new Error('timeout of 30000ms exceeded'));

    await expect(getDpServiceResources(['nb'], context)).rejects.toThrow(
      'Failed to retrieve service resources from Dialogporten',
    );
  });

  it('throws when the response contains errors', async () => {
    mockedAxios.mockResolvedValue({ data: { errors: [{ message: 'Something went wrong' }] } });

    await expect(getDpServiceResources(['nb'], context)).rejects.toThrow(
      'Failed to retrieve service resources from Dialogporten',
    );
  });

  it('throws when there is no session token', async () => {
    mockedGetSessionToken.mockReturnValue(null);

    await expect(getDpServiceResources(['nb'], context)).rejects.toThrow(
      'Failed to retrieve service resources from Dialogporten',
    );
    expect(mockedAxios).not.toHaveBeenCalled();
  });
});
