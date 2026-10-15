import Fastify, { type FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it, vi } from 'vitest';
import featureApi from '../src/features/featureApi.ts';

const { definitions, azureFlags, azureValues, loadMock, isEnabledMock } = vi.hoisted(() => ({
  definitions: [
    { key: 'test.enabledInAzure', type: 'boolean', default: false },
    { key: 'test.disabledInAzure', type: 'boolean', default: true },
    { key: 'test.missingInAzure', type: 'boolean', default: true },
    { key: 'test.list', type: 'string-array', default: [] },
    { key: 'test.emptyList', type: 'string-array', default: ['fallback'] },
    { key: 'test.text', type: 'string', default: 'fallback' },
    { key: 'test.missingNumber', type: 'number', default: 7 },
  ],
  azureFlags: { 'test.enabledInAzure': true, 'test.disabledInAzure': false } as Record<string, boolean>,
  azureValues: { 'test.list': '["digdir","skd"]', 'test.emptyList': '', 'test.text': 'dark' } as Record<string, string>,
  loadMock: vi.fn(),
  isEnabledMock: vi.fn(),
}));

vi.mock('../src/features/featureFlagDefinitions.ts', () => ({ featureFlagDefinitions: definitions }));

vi.mock('node:timers', () => ({ setInterval: vi.fn() }));

vi.mock('@azure/app-configuration-provider', () => ({ load: loadMock }));

vi.mock('@microsoft/feature-management', () => ({
  ConfigurationMapFeatureFlagProvider: vi.fn(function ConfigurationMapFeatureFlagProvider() {
    return {
      getFeatureFlag: async (key: string) => (key in azureFlags ? { id: key, enabled: azureFlags[key] } : undefined),
    };
  }),
  FeatureManager: vi.fn(function FeatureManager() {
    return { isEnabled: isEnabledMock };
  }),
}));

describe('/api/features', () => {
  let server: FastifyInstance;

  const start = async (appConfigConnectionString: string) => {
    server = Fastify();
    await server.register(featureApi, { appConfigConnectionString });
    const response = await server.inject({ method: 'GET', url: '/api/features' });
    expect(response.statusCode).toBe(200);
    return response.json();
  };

  afterEach(async () => {
    await server.close();
    vi.clearAllMocks();
  });

  it('returns the default of every definition when App Configuration is not configured', async () => {
    const body = await start('');

    expect(body).toEqual(Object.fromEntries(definitions.map((def) => [def.key, def.default])));
    expect(loadMock).not.toHaveBeenCalled();
  });

  it('loads boolean definitions as feature flags and the rest as key-values', async () => {
    loadMock.mockResolvedValue({ get: (key: string) => azureValues[key], refresh: vi.fn() });
    isEnabledMock.mockImplementation(async (key: string) => azureFlags[key] ?? false);

    await start('Endpoint=https://example.azconfig.io');

    const options = loadMock.mock.calls[0][1];
    expect(options.featureFlagOptions.selectors).toEqual([
      { keyFilter: 'test.enabledInAzure' },
      { keyFilter: 'test.disabledInAzure' },
      { keyFilter: 'test.missingInAzure' },
    ]);
    const appConfigKeys = ['test.list', 'test.emptyList', 'test.text', 'test.missingNumber'];
    expect(options.selectors).toEqual(appConfigKeys.map((key) => ({ keyFilter: key })));
    expect(options.refreshOptions.watchedSettings).toEqual(appConfigKeys.map((key) => ({ key })));
  });

  it('uses Azure values when set and falls back to the default when missing or empty', async () => {
    loadMock.mockResolvedValue({ get: (key: string) => azureValues[key], refresh: vi.fn() });
    isEnabledMock.mockImplementation(async (key: string) => azureFlags[key] ?? false);

    const body = await start('Endpoint=https://example.azconfig.io');

    expect(body).toEqual({
      'test.enabledInAzure': true,
      'test.disabledInAzure': false,
      'test.missingInAzure': true,
      'test.list': ['digdir', 'skd'],
      'test.emptyList': ['fallback'],
      'test.text': 'dark',
      'test.missingNumber': 7,
    });
    expect(isEnabledMock.mock.calls.map(([key]) => key)).toEqual(['test.enabledInAzure', 'test.disabledInAzure']);
  });
});
