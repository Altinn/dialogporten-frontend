import { generateKeyPairSync } from 'node:crypto';
import axios from 'axios';
import type { ProviderConfig } from 'fastify';
import jwt from 'jsonwebtoken';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAccessTokenVerifier } from '../src/auth/accessTokenVerifier.ts';

vi.mock('axios', () => ({ default: { get: vi.fn() } }));
const signingKeys = generateKeyPairSync('rsa', { modulusLength: 2048 });
const attackerKeys = generateKeyPairSync('rsa', { modulusLength: 2048 });
const provider = { issuer: 'https://issuer.example', jwks_uri: 'https://issuer.example/jwks' } as ProviderConfig;
const jwk = { ...signingKeys.publicKey.export({ format: 'jwk' }), kid: 'trusted-key' };
const token = (kid = 'trusted-key', key = signingKeys.privateKey) =>
  jwt.sign(
    {
      iss: provider.issuer,
      pid: '12345678901',
      scope: 'digdir:dialogporten.noconsent',
      exp: Math.floor(Date.now() / 1000) + 3600,
    },
    key,
    { algorithm: 'RS256', keyid: kid, header: { alg: 'RS256', jku: 'https://attacker.example/keys' } },
  );

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-08T12:00:00Z'));
  vi.mocked(axios.get)
    .mockReset()
    .mockResolvedValue({ data: { keys: [jwk] } });
});
afterEach(() => vi.useRealTimers());

describe('access-token signature verification', () => {
  it('uses only configured signing keys and caches them across requests', async () => {
    const verify = createAccessTokenVerifier(provider);
    await expect(verify(token())).resolves.toMatchObject({ pid: '12345678901' });
    await verify(token());
    expect(axios.get).toHaveBeenCalledOnce();
    expect(axios.get).toHaveBeenCalledWith(provider.jwks_uri, { timeout: 30_000, maxRedirects: 0 });
  });

  it('rejects a forged RSA signature even when the key ID matches', async () => {
    await expect(createAccessTokenVerifier(provider)(token('trusted-key', attackerKeys.privateKey))).rejects.toThrow();
  });

  it('does not fetch a signing key for every unknown kid', async () => {
    const verify = createAccessTokenVerifier(provider);
    await verify(token());
    for (const kid of ['unknown-1', 'unknown-2', 'unknown-3']) await expect(verify(token(kid))).rejects.toThrow();
    expect(axios.get).toHaveBeenCalledOnce();
  });

  it('refreshes keys for a rotated signing key after the cooldown', async () => {
    const verify = createAccessTokenVerifier(provider);
    await verify(token());
    vi.advanceTimersByTime(30_000);
    vi.mocked(axios.get).mockResolvedValue({ data: { keys: [{ ...jwk, kid: 'rotated-key' }] } });
    await expect(verify(token('rotated-key'))).resolves.toMatchObject({ pid: '12345678901' });
    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  it('fails closed when the key cache expires and JWKS is unavailable', async () => {
    const verify = createAccessTokenVerifier(provider);
    await verify(token());
    vi.advanceTimersByTime(300_000);
    vi.mocked(axios.get).mockRejectedValue(new Error('Unavailable'));
    await expect(verify(token())).rejects.toThrow();
    await expect(verify(token())).rejects.toThrow();
    expect(axios.get).toHaveBeenCalledTimes(2);
  });
});
