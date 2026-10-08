import { createPublicKey, type JsonWebKey } from 'node:crypto';
import axios from 'axios';
import type { ProviderConfig } from 'fastify';
import jwt from 'jsonwebtoken';

type SigningKey = JsonWebKey & { kid?: string; use?: string; alg?: string };
const cacheLifetimeMs = 5 * 60 * 1000;
const minimumRefreshIntervalMs = 30 * 1000;

export const createAccessTokenVerifier = (provider: ProviderConfig) => {
  let keys: SigningKey[] = [];
  let fetchedAt = 0;
  let lastAttemptAt = 0;
  let pending: Promise<void> | undefined;

  const refreshKeys = () => {
    if (pending) return pending;
    if (Date.now() - lastAttemptAt < minimumRefreshIntervalMs) return Promise.resolve();
    lastAttemptAt = Date.now();
    pending = axios
      .get<{ keys: SigningKey[] }>(provider.jwks_uri, { timeout: 30_000, maxRedirects: 0 })
      .then(({ data }) => {
        if (!Array.isArray(data.keys)) throw new Error('Invalid signing key response');
        keys = data.keys;
        fetchedAt = Date.now();
      })
      .finally(() => {
        pending = undefined;
      });
    return pending;
  };

  return async (token: string) => {
    const decoded = jwt.decode(token, { complete: true });
    if (decoded?.header.alg !== 'RS256' || !decoded.header.kid) {
      throw new Error('Invalid access token');
    }
    const matches = (key: SigningKey) =>
      key.kid === decoded.header.kid &&
      key.kty === 'RSA' &&
      (!key.use || key.use === 'sig') &&
      (!key.alg || key.alg === 'RS256');
    if (Date.now() - fetchedAt >= cacheLifetimeMs || !keys.some(matches)) await refreshKeys();
    const key = keys.find(matches);
    if (!key || Date.now() - fetchedAt >= cacheLifetimeMs) throw new Error('No trusted signing key');
    const claims = jwt.verify(token, createPublicKey({ key, format: 'jwk' }), {
      algorithms: ['RS256'],
      issuer: provider.issuer,
    });
    if (
      typeof claims === 'string' ||
      typeof claims.exp !== 'number' ||
      !Number.isFinite(claims.exp) ||
      typeof claims.pid !== 'string' ||
      !/^\d{11}$/.test(claims.pid) ||
      typeof claims.scope !== 'string' ||
      !claims.scope.split(' ').includes('digdir:dialogporten.noconsent')
    ) {
      throw new Error('Invalid access token claims');
    }
    return claims;
  };
};
