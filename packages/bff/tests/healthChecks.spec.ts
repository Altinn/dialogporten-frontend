import cookie, { sign } from '@fastify/cookie';
import session from '@fastify/session';
import Fastify from 'fastify';
import type { Redis } from 'ioredis';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RevocableRedisStore } from '../src/auth/sessionStore.ts';
import healthChecks from '../src/azure/HealthChecks.ts';
import healthProbes from '../src/azure/HealthProbes.ts';

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

describe('health routes called with a signed-in session cookie', () => {
  const secret = 'test-secret-that-is-at-least-32-characters-long';
  const sessionId = 'signed-in-session';

  const createServer = async () => {
    const redis = {
      get: vi.fn().mockResolvedValue(JSON.stringify({ cookie: { path: '/', httpOnly: true, secure: true } })),
      eval: vi.fn(() => new Promise((resolve) => setImmediate(() => resolve('OK')))),
    };
    const server = Fastify({ trustProxy: true });
    await server.register(cookie);
    await server.register(session, {
      secret,
      rolling: true,
      cookieName: 'arbeidsflate',
      saveUninitialized: false,
      cookie: { secure: true, httpOnly: true },
      store: new RevocableRedisStore(redis as unknown as Redis),
    });
    await server.register(healthProbes, { version: 'test' });
    await server.register(healthChecks, { version: 'test' });
    return { server, redis };
  };

  it.each(['/api/health', '/api/readiness', '/api/liveness'])(
    '%s sends the reply once, so the session is saved once',
    async (url) => {
      const { server, redis } = await createServer();

      const response = await server.inject({
        method: 'GET',
        url,
        headers: { 'x-forwarded-proto': 'https' },
        cookies: { arbeidsflate: sign(sessionId, secret) },
      });
      await new Promise((resolve) => setImmediate(resolve));
      await server.close();

      expect(response.statusCode).toBe(200);
      expect(redis.get).toHaveBeenCalledWith(`sess:${sessionId}`);
      expect(redis.eval).toHaveBeenCalledTimes(1);
    },
  );
});
