import { logger } from '@altinn/dialogporten-node-logger';
import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type Context, getSessionToken } from '../src/auth/oidc.js';
import { getDpServiceResources } from '../src/graphql/serviceResources/dpService.ts';

vi.mock('axios', () => ({ default: vi.fn() }));
vi.mock('@altinn/dialogporten-node-logger', () => ({ logger: { error: vi.fn() } }));
vi.mock('../src/auth/oidc.js', () => ({ getSessionToken: vi.fn() }));
vi.mock('../src/config.js', () => ({
  default: { dialogporten: { graphqlUrl: 'https://dialogporten.example/graphql' } },
}));

const context = {} as Context;

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getSessionToken).mockReturnValue({ access_token: 'synthetic-token' } as never);
});

describe('getDpServiceResources', () => {
  it('rejects a missing session token instead of returning an empty list', async () => {
    vi.mocked(getSessionToken).mockReturnValue(null);

    await expect(getDpServiceResources(['nb'], context)).rejects.toThrow('No token found in session');
    expect(axios).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith('No token found in session');
  });

  it('rejects GraphQL errors even when partial data is present', async () => {
    const errors = [{ message: 'Synthetic upstream failure' }];
    vi.mocked(axios).mockResolvedValue({ data: { errors, data: { serviceResources: { items: [] } } } });

    await expect(getDpServiceResources(['nb'], context)).rejects.toThrow(
      'Dialogporten serviceResources query returned errors',
    );
    expect(logger.error).toHaveBeenCalledWith(errors, 'Dialogporten serviceResources query returned errors');
  });

  it.each(['timeout of 30000ms exceeded', 'Request failed with status code 503'])(
    'propagates an upstream failure: %s',
    async (message) => {
      const error = new Error(message);
      vi.mocked(axios).mockRejectedValue(error);

      await expect(getDpServiceResources(['nb'], context)).rejects.toBe(error);
      expect(logger.error).toHaveBeenCalledWith(error, 'Error retrieving Dialogporten service resources:');
    },
  );

  it('returns a successful empty list when Dialogporten has no service resources', async () => {
    vi.mocked(axios).mockResolvedValue({ data: { data: { serviceResources: { items: [] } } } });

    await expect(getDpServiceResources(['nb'], context)).resolves.toEqual([]);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('still localizes and sorts service resources from a successful response', async () => {
    vi.mocked(axios).mockResolvedValue({
      data: {
        data: {
          serviceResources: {
            items: [
              {
                serviceResource: { id: 'service-b', name: [{ languageCode: 'nb', value: ' B ' }] },
                serviceOwner: { code: 'ORG' },
              },
              {
                serviceResource: { id: 'service-a', name: [{ languageCode: 'en', value: 'A' }] },
                serviceOwner: { code: 'ORG' },
              },
            ],
          },
        },
      },
    });

    await expect(getDpServiceResources(['nb', 'en'], context)).resolves.toEqual([
      { id: 'service-a', title: 'A', org: 'org' },
      { id: 'service-b', title: 'B', org: 'org' },
    ]);
    expect(axios).toHaveBeenCalledWith(
      expect.objectContaining({
        timeout: 30000,
        headers: expect.objectContaining({
          Authorization: 'Bearer synthetic-token',
          'Accept-Language': 'nb, en;q=0.9',
        }),
      }),
    );
  });
});
