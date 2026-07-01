import crypto from 'node:crypto';
import { logger } from '@altinn/dialogporten-node-logger';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import config from '../config.js';
import redisClient from '../redisClient.js';

interface MaskinportenTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

const TOKEN_TTL_MARGIN_SECONDS = 30;
const ASSERTION_LIFETIME_SECONDS = 100;

const cacheKey = (scope: string) => `maskinporten:token:${scope}`;
const ALTINN_TOKEN_CACHE_KEY = 'maskinporten:altinn-token';
const platformExchangeTokenEndpointURL = `${config.platformBaseURL}/authentication/api/v1/exchange/maskinporten`;

const buildClientAssertion = (): string => {
  const { clientId, jwk, issuer, scope } = config.maskinporten;

  if (!clientId || !jwk) {
    throw new Error('Maskinporten is not configured (missing MASKINPORTEN_CLIENT_ID or MASKINPORTEN_JWK)');
  }

  const parsedJwk = JSON.parse(Buffer.from(jwk, 'base64').toString('utf8')) as crypto.JsonWebKey & { kid?: string };
  if (!parsedJwk.kid) {
    throw new Error("Maskinporten JWK is missing 'kid' (required in the client_assertion header)");
  }
  const privateKey = crypto.createPrivateKey({ key: parsedJwk, format: 'jwk' });

  const now = Math.floor(Date.now() / 1000);

  return jwt.sign(
    {
      iss: clientId,
      aud: issuer,
      scope,
      iat: now,
      exp: now + ASSERTION_LIFETIME_SECONDS,
      jti: crypto.randomUUID(),
    },
    privateKey,
    {
      algorithm: 'RS256',
      header: { alg: 'RS256', kid: parsedJwk.kid },
    },
  );
};

export const getMaskinportenToken = async (): Promise<string> => {
  const { issuer, scope } = config.maskinporten;

  const cached = await redisClient.get(cacheKey(scope));
  if (cached) {
    return cached;
  }

  const assertion = buildClientAssertion();

  const body = new URLSearchParams();
  body.append('grant_type', 'urn:ietf:params:oauth:grant-type:jwt-bearer');
  body.append('assertion', assertion);

  try {
    const { data } = await axios.post<MaskinportenTokenResponse>(`${issuer}token`, body, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const ttl = Math.max(data.expires_in - TOKEN_TTL_MARGIN_SECONDS, 0);
    if (ttl > 0) {
      await redisClient.set(cacheKey(scope), data.access_token, 'EX', ttl);
    }
    return data.access_token;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      logger.error(
        { status: error.response?.status, data: error.response?.data },
        'Failed to fetch Maskinporten token',
      );
    } else {
      logger.error(error, 'Failed to fetch Maskinporten token');
    }
    throw new Error('Failed to fetch Maskinporten token');
  }
};

const exchangeToken = async (maskinportenToken: string): Promise<string> => {
  const { data } = await axios.get(platformExchangeTokenEndpointURL, {
    timeout: 30000,
    headers: {
      Authorization: `Bearer ${maskinportenToken}`,
      Accept: 'application/json',
    },
  });
  return typeof data === 'string' ? data : '';
};

/**
 * Altinn platform APIs require an Altinn-issued token, so the Maskinporten token
 * must be exchanged first. The exchanged token is cached separately, keyed off its
 * own (shorter) JWT expiry.
 */
export const getAltinnToken = async (): Promise<string> => {
  const cached = await redisClient.get(ALTINN_TOKEN_CACHE_KEY);
  if (cached) {
    return cached;
  }

  const maskinportenToken = await getMaskinportenToken();

  try {
    const altinnToken = await exchangeToken(maskinportenToken);
    if (!altinnToken) {
      throw new Error('Empty Altinn token from exchange');
    }

    const decoded = jwt.decode(altinnToken);
    const exp = typeof decoded === 'object' && decoded && typeof decoded.exp === 'number' ? decoded.exp : null;
    const ttl = exp ? exp - Math.floor(Date.now() / 1000) - TOKEN_TTL_MARGIN_SECONDS : 0;
    if (ttl > 0) {
      await redisClient.set(ALTINN_TOKEN_CACHE_KEY, altinnToken, 'EX', ttl);
    }
    return altinnToken;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      logger.error(
        { status: error.response?.status, data: error.response?.data },
        'Failed to exchange Maskinporten token for Altinn token',
      );
    } else {
      logger.error(error, 'Failed to exchange Maskinporten token for Altinn token');
    }
    throw new Error('Failed to exchange Maskinporten token for Altinn token');
  }
};
