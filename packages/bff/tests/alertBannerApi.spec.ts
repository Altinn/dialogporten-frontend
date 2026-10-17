import Fastify, { type FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import alertBannerApi from '../src/features/alertBannerApi.ts';

const { load } = vi.hoisted(() => ({ load: vi.fn() }));

vi.mock('@azure/app-configuration-provider', () => ({ load }));

vi.mock('@altinn/dialogporten-node-logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn() },
}));

const connectionString = 'Endpoint=https://example.azconfig.io;Id=test;Secret=test';

const nbContent = { title: 'Driftsmelding', description: 'Vi har problemer med innboksen' };
const nnContent = {
  title: 'Driftsmelding',
  description: 'Vi har problem med innboksen',
  link: { url: 'https://status.altinn.no', text: 'Les meir' },
};

function mockAppConfig(initialValues: Record<string, unknown>) {
  let values = initialValues;
  const listeners: Array<() => void> = [];
  const appConfig = {
    get: vi.fn((key: string) => values[key]),
    refresh: vi.fn().mockResolvedValue(undefined),
    onRefresh: vi.fn((listener: () => void) => {
      listeners.push(listener);
      return { dispose: vi.fn() };
    }),
  };
  load.mockResolvedValue(appConfig);
  return {
    appConfig,
    simulateRefresh: (nextValues: Record<string, unknown>) => {
      values = nextValues;
      for (const listener of listeners) {
        listener();
      }
    },
  };
}

describe('GET /api/alert-banner', () => {
  let server: FastifyInstance | undefined;

  const startServer = async (appConfigConnectionString = connectionString) => {
    const instance = Fastify();
    server = instance;
    await instance.register(alertBannerApi, { appConfigConnectionString });
    await instance.ready();
    return instance;
  };

  const getAlertBanner = async (instance: FastifyInstance) => {
    const response = await instance.inject({ method: 'GET', url: '/api/alert-banner' });
    expect(response.statusCode).toBe(200);
    return response.json();
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await server?.close();
    server = undefined;
  });

  it('loads the alert banner keys once with refresh enabled and serves them from memory', async () => {
    const { appConfig } = mockAppConfig({
      'alertBanner.content.nb': JSON.stringify(nbContent),
      'alertBanner.content.nn': nnContent,
    });
    const instance = await startServer();

    expect(await getAlertBanner(instance)).toEqual({ nb: nbContent, nn: nnContent });
    expect(await getAlertBanner(instance)).toEqual({ nb: nbContent, nn: nnContent });

    expect(load).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenCalledWith(connectionString, {
      selectors: [{ keyFilter: 'alertBanner.content.*' }],
      refreshOptions: { enabled: true, refreshIntervalInMs: 10_000 },
    });
    expect(appConfig.get).toHaveBeenCalledTimes(3);
    expect(appConfig.refresh).not.toHaveBeenCalled();
  });

  it('serves the new content after App Configuration refreshes', async () => {
    const { simulateRefresh } = mockAppConfig({ 'alertBanner.content.nb': JSON.stringify(nbContent) });
    const instance = await startServer();

    expect(await getAlertBanner(instance)).toEqual({ nb: nbContent });

    simulateRefresh({ 'alertBanner.content.nn': nnContent });

    expect(await getAlertBanner(instance)).toEqual({ nn: nnContent });
  });

  it('leaves out content that fails validation', async () => {
    mockAppConfig({
      'alertBanner.content.nb': JSON.stringify({ title: 'Missing description' }),
      'alertBanner.content.nn': 'not json',
      'alertBanner.content.en': { title: 'Title', description: 'Description', link: { url: 42, text: 'Link' } },
    });
    const instance = await startServer();

    expect(await getAlertBanner(instance)).toEqual({});
  });

  it('returns an empty result without a connection string', async () => {
    const instance = await startServer('');

    expect(await getAlertBanner(instance)).toEqual({});
    expect(load).not.toHaveBeenCalled();
  });

  it('returns an empty result when App Configuration cannot be loaded', async () => {
    load.mockRejectedValue(new Error('unreachable'));
    const instance = await startServer();

    expect(await getAlertBanner(instance)).toEqual({});
  });
});
