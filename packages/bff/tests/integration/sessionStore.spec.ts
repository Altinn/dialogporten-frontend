import cookie from '@fastify/cookie';
import session from '@fastify/session';
import { RedisContainer, type StartedRedisContainer } from '@testcontainers/redis';
import Fastify, { type FastifyInstance } from 'fastify';
import { Redis } from 'ioredis';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  RevocableRedisStore,
  revokedSessionKeyPrefix,
  revokedSessionTtlSeconds,
  sessionKeyPrefix,
} from '../../src/auth/sessionStore.ts';

let container: StartedRedisContainer | undefined;
let redis: Redis;
let store: RevocableRedisStore;
let server: FastifyInstance;
let slowRequest: { started: PromiseWithResolvers<void>; release: PromiseWithResolvers<void> };

beforeAll(async () => {
  let url = process.env.TEST_REDIS_URL;
  if (!url) {
    container = await new RedisContainer('redis:6.2-alpine').start();
    url = container.getConnectionUrl();
  }
  redis = new Redis(url);
  store = new RevocableRedisStore(redis);

  server = Fastify();
  await server.register(cookie);
  await server.register(session, {
    secret: 'test-secret-that-is-at-least-32-characters-long',
    rolling: true,
    cookieName: 'arbeidsflate',
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true },
    store,
  });

  server.post('/login', async (request) => {
    request.session.set('pid', 'test-pid');
    return { sessionId: request.session.sessionId };
  });
  server.get('/slow', async () => {
    slowRequest.started.resolve();
    await slowRequest.release.promise;
    return { ok: true };
  });
  server.get('/logout', async (request) => {
    await request.session.destroy();
    return { ok: true };
  });
  server.get('/whoami', async (request) => ({ pid: request.session.get('pid') ?? null }));
});

afterAll(async () => {
  await server?.close();
  redis?.disconnect();
  await container?.stop();
});

beforeEach(() => {
  slowRequest = { started: Promise.withResolvers(), release: Promise.withResolvers() };
});

const login = async () => {
  const response = await server.inject({ method: 'POST', url: '/login' });
  const sessionCookie = response.cookies.find((c) => c.name === 'arbeidsflate')!;
  return {
    sessionId: response.json<{ sessionId: string }>().sessionId,
    cookies: { arbeidsflate: sessionCookie.value },
  };
};

const startSlowRequest = async (cookies: Record<string, string>) => {
  const response = server.inject().get('/slow').cookies(cookies).end();
  await slowRequest.started.promise;
  return async () => {
    slowRequest.release.resolve();
    expect((await response).statusCode).toBe(200);
  };
};

describe('session store against a real Redis', () => {
  it('keeps a session across requests', async () => {
    const { sessionId, cookies } = await login();

    const response = await server.inject({ method: 'GET', url: '/whoami', cookies });

    expect(response.json()).toEqual({ pid: 'test-pid' });
    expect(await redis.ttl(`${sessionKeyPrefix}${sessionId}`)).toBeGreaterThan(0);
  });

  it('does not let a request that was in flight during logout bring the session back', async () => {
    const { sessionId, cookies } = await login();
    const finishSlowRequest = await startSlowRequest(cookies);

    await server.inject({ method: 'GET', url: '/logout', cookies });
    await finishSlowRequest();

    const response = await server.inject({ method: 'GET', url: '/whoami', cookies });
    expect(response.json()).toEqual({ pid: null });
    expect(await redis.exists(`${sessionKeyPrefix}${sessionId}`)).toBe(0);
  });

  it('does not let a request that was in flight during front-channel logout bring the session back', async () => {
    const { sessionId, cookies } = await login();
    const finishSlowRequest = await startSlowRequest(cookies);

    await new Promise<void>((resolve, reject) => store.destroy(sessionId, (err) => (err ? reject(err) : resolve())));
    await finishSlowRequest();

    const response = await server.inject({ method: 'GET', url: '/whoami', cookies });
    expect(response.json()).toEqual({ pid: null });
    expect(await redis.exists(`${sessionKeyPrefix}${sessionId}`)).toBe(0);
  });

  it('expires the revocation marker after a short while', async () => {
    const { sessionId, cookies } = await login();

    await server.inject({ method: 'GET', url: '/logout', cookies });

    const ttl = await redis.ttl(`${revokedSessionKeyPrefix}${sessionId}`);
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(revokedSessionTtlSeconds);
  });
});
