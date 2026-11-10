import Fastify from 'fastify';
import { afterEach, describe, expect, it, vi } from 'vitest';
import healthChecks from '../src/azure/HealthChecks.ts';

vi.mock('../src/db.ts', () => ({
  dataSource: { isInitialized: true, query: vi.fn().mockResolvedValue([]) },
}));

vi.mock('../src/redisClient.ts', () => ({
  default: { ping: vi.fn().mockResolvedValue('PONG') },
}));

vi.mock('axios', () => ({
  default: { get: vi.fn().mockResolvedValue({ status: 200 }) },
}));

describe('/api/health', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('includes the BFF version in the response', async () => {
    const server = Fastify();
    await server.register(healthChecks, { version: '1.186.0-abc1234' });

    const response = await server.inject({ method: 'GET', url: '/api/health' });
    await server.close();

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: 'ok', version: '1.186.0-abc1234' });
  });

  it('reads the version from BUILD_VERSION', async () => {
    vi.stubEnv('BUILD_VERSION', '1.186.0-abc1234');
    const { default: config } = await import('../src/config.ts');

    expect(config.version).toBe('1.186.0-abc1234');
  });

  it('falls back to dev when BUILD_VERSION is empty, as in images built without the build argument', async () => {
    vi.stubEnv('BUILD_VERSION', '');
    const { default: config } = await import('../src/config.ts');

    expect(config.version).toBe('dev');
  });
});
