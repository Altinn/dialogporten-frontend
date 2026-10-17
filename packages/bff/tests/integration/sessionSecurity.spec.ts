import { logger } from '@altinn/dialogporten-node-logger';
import cookie from '@fastify/cookie';
import session from '@fastify/session';
import { RedisContainer, type StartedRedisContainer } from '@testcontainers/redis';
import axios from 'axios';
import Fastify, { type FastifyInstance } from 'fastify';
import { Redis } from 'ioredis';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import oidc from '../../src/auth/oidc.ts';
import { RevocableRedisStore, sessionKeyPrefix } from '../../src/auth/sessionStore.ts';
import userApi from '../../src/auth/userApi.ts';
import verifyToken from '../../src/auth/verifyToken.ts';
import config from '../../src/config.ts';

vi.mock('../../src/config.ts', () => ({
  default: {
    client_id: 'test-client',
    client_secret: 'client-secret',
    oidc_url: 'idp.example',
    hostname: 'https://app.example',
    secret: 'test-secret-that-is-at-least-32-characters-long',
    enableInitSessionEndpoint: false,
    environment: 'test',
  },
}));
vi.mock('../../src/redisClient.ts', () => ({
  default: {
    eval: (...args: Parameters<Redis['eval']>) => redis.eval(...args),
    get: (...args: Parameters<Redis['get']>) => redis.get(...args),
    set: (...args: Parameters<Redis['set']>) => redis.set(...args),
    del: (...args: Parameters<Redis['del']>) => redis.del(...args),
  },
}));
vi.mock('@altinn/dialogporten-node-logger', () => ({ logger: { error: vi.fn(), warn: vi.fn() } }));
vi.mock('axios', () => ({ default: { get: vi.fn(), post: vi.fn(), isAxiosError: vi.fn(() => false) } }));

const provider = {
  issuer: 'https://idp.example',
  jwks_uri: 'https://idp.example/jwks',
  authorization_endpoint: 'https://idp.example/authorize',
  token_endpoint: 'https://idp.example/token',
  end_session_endpoint: 'https://idp.example/logout',
};
let container: StartedRedisContainer | undefined;
let redis: Redis;
let server: FastifyInstance;
const protectedHandler = vi.fn(async () => ({ privateData: true }));

const accessToken = (offset = 300_000) => ({
  access_token: 'access-token',
  access_token_expires_at: new Date(Date.now() + offset).toISOString(),
  refresh_token: 'refresh-token',
  refresh_token_expires_at: new Date(Date.now() + 3600_000).toISOString(),
  id_token: 'id-token',
  scope: 'openid',
  tokenUpdatedAt: new Date().toISOString(),
});
const cookiesFrom = (response: Awaited<ReturnType<FastifyInstance['inject']>>) => ({
  arbeidsflate: response.cookies.find((c) => c.name === 'arbeidsflate')!.value,
});
const seedSession = async (token: unknown) => {
  const response = await server.inject({ method: 'POST', url: '/seed', payload: { token } });
  return { cookies: cookiesFrom(response), sessionId: response.json<{ sessionId: string }>().sessionId };
};
beforeAll(async () => {
  let url = process.env.TEST_REDIS_URL;
  if (!url) {
    container = await new RedisContainer('redis:6.2-alpine').start();
    url = container.getConnectionUrl();
  }
  redis = new Redis(url);
  vi.mocked(axios.get).mockResolvedValue({ data: provider });
  server = Fastify();
  await server.register(cookie);
  await server.register(session, {
    secret: config.secret,
    cookieName: 'arbeidsflate',
    saveUninitialized: false,
    rolling: true,
    cookie: { secure: false, httpOnly: true, sameSite: 'lax' },
    store: new RevocableRedisStore(redis),
  });
  await server.register(verifyToken);
  await server.register(oidc);
  await server.register(userApi);
  server.post('/seed', async (request) => {
    request.session.set('pid', 'test-pid');
    const { token } = request.body as { token: never };
    if (token) request.session.set('token', token);
    return { sessionId: request.session.sessionId };
  });
  server.get('/protected', { preHandler: server.verifyToken(false) }, protectedHandler);
});

beforeEach(() => {
  vi.clearAllMocks();
});
afterAll(async () => {
  await server?.close();
  redis?.disconnect();
  await container?.stop();
});

describe('BFF session security', () => {
  it.each([-1, -60_000])('does not execute a protected handler with an expired access token (%s)', async (offset) => {
    const { cookies } = await seedSession(accessToken(offset));
    const response = await server.inject({ url: '/protected', cookies });
    expect(response.statusCode).toBe(401);
    expect(protectedHandler).not.toHaveBeenCalled();
  });

  it('rejects a malformed expiry without executing protected code', async () => {
    const { cookies } = await seedSession({ ...accessToken(), access_token_expires_at: 'invalid' });
    expect((await server.inject({ url: '/protected', cookies })).statusCode).toBe(401);
    expect(protectedHandler).not.toHaveBeenCalled();
  });

  it('accepts a valid access token', async () => {
    const { cookies } = await seedSession(accessToken());
    expect((await server.inject({ url: '/protected', cookies })).statusCode).toBe(200);
    expect(protectedHandler).toHaveBeenCalledOnce();
  });

  it('returns 401 for an anonymous API request', async () => {
    expect((await server.inject({ url: '/protected' })).statusCode).toBe(401);
    expect(protectedHandler).not.toHaveBeenCalled();
  });

  it.each([
    ['valid', 300_000],
    ['expired', -60_000],
  ] as const)('destroys the session and redirects on logout when the access token is %s', async (_, offset) => {
    const { cookies, sessionId } = await seedSession(accessToken(offset));
    expect(await redis.exists(sessionKeyPrefix + sessionId)).toBe(1);

    const response = await server.inject({ url: '/api/logout', cookies });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe(`${provider.end_session_endpoint}?id_token_hint=id-token`);
    expect(await redis.exists(sessionKeyPrefix + sessionId)).toBe(0);
    expect(axios.post).not.toHaveBeenCalled();
    expect((await server.inject({ url: '/protected', cookies })).statusCode).toBe(401);
    expect(protectedHandler).not.toHaveBeenCalled();
  });

  it('lets the authentication endpoint refresh an expired access token', async () => {
    const { cookies } = await seedSession(accessToken(-1));
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 300,
        refresh_token_expires_in: 3600,
      },
    });
    const response = await server.inject({ url: '/api/isAuthenticated', cookies });
    expect(response.statusCode).toBe(200);
    expect((await server.inject({ url: '/protected', cookies })).statusCode).toBe(200);
  });

  it('revokes the session on refresh failure without logging credentials', async () => {
    const { cookies, sessionId } = await seedSession(accessToken(-1));
    vi.mocked(axios.post).mockRejectedValueOnce({
      config: {
        headers: { Authorization: 'Basic secret' },
        data: 'refresh_token=secret',
      },
    });
    expect((await server.inject({ url: '/api/isAuthenticated', cookies })).statusCode).toBe(401);
    expect(await redis.exists(sessionKeyPrefix + sessionId)).toBe(0);
    expect(JSON.stringify(vi.mocked(logger.error).mock.calls)).not.toContain('secret');
  });
});
