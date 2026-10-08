import crypto from 'node:crypto';
import { logger } from '@altinn/dialogporten-node-logger';
import axios from 'axios';
import type {
  FastifyPluginAsync,
  FastifyReply,
  FastifyRequest,
  HookHandlerDoneFunction,
  ProviderConfig,
} from 'fastify';
import fp from 'fastify-plugin';
import jwt from 'jsonwebtoken';
import config from '../config.js';
import redisClient from '../redisClient.js';
import { createAccessTokenVerifier } from './accessTokenVerifier.ts';
import { destroyIdpSessions } from './sessionStore.ts';

declare module 'fastify' {
  interface FastifyInstance {
    verifyToken: (
      shouldRefresh: boolean,
    ) => (request: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction) => void;
  }

  interface FastifyRequest {
    tokenIsValid: boolean;
  }

  export type ProviderConfig = {
    issuer: string;
    jwks_uri: string;
    authorization_endpoint: string;
    token_endpoint: string;
    end_session_endpoint: string;
    response_types_supported: string[];
    subject_types_supported: string[];
    id_token_signing_alg_values_supported: string[];
  };

  interface IdPortenUpdatedToken {
    access_token: string;
    refresh_token_expires_in: number;
    refresh_token: string;
    scope: string;
    token_type: string;
    expires_in: number;
    id_token?: string;
    token_updated_at: string;
  }

  interface Session {
    token: SessionStorageToken;
    codeVerifier: string;
    codeChallenge: string;
    pid: string;
    locale: string;
    state?: string;
    verifier?: string;
    nonce?: string;
    idpSid?: string;
  }
}

export interface Context {
  session: {
    get: (key: string) => SessionStorageToken | string | undefined;
  };
  request: {
    raw: {
      cookies?: {
        altinnPersistentContext?: string;
      };
    };
  };
}

interface IdportenToken {
  access_token: string;
  refresh_token: string;
  id_token: string;
  scope: string;
  token_type: string;
  expires_in: number;
  expires_at: string;
  refresh_token_expires_in: number;
}

export interface IdTokenPayload {
  pid: string;
  locale: string;
  jwt: string;
  nonce: string;
  sid: string;
  sub: string;
}

/* interface is common denominator of /login and /token DTO */
export interface SessionStorageToken {
  id_token: string;
  access_token: string;
  refresh_token: string;
  refresh_token_expires_at: string;
  access_token_expires_at: string;
  scope: string;
  tokenUpdatedAt: string;
  nonce?: string;
}

export const getSessionToken = (context: Context): SessionStorageToken | null => {
  const token = context.session.get('token');
  return typeof token === 'object' ? token : null;
};

export const generateSessionId = () => {
  return crypto
    .randomBytes(24)
    .toString('base64') // standard base64
    .replace(/\+/g, '-') // base64url
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

export const fetchOpenIDConfig = async (issuerURL: string): Promise<ProviderConfig> => {
  const response = await axios.get(issuerURL, {
    timeout: 30000,
  });
  return response.data;
};

const generateCodeVerifier = () => {
  return crypto.randomBytes(32).toString('hex');
};

const generateCodeChallenge = async (codeVerifier: string) => {
  const hash = crypto.createHash('sha256').update(codeVerifier).digest();
  return Buffer.from(hash).toString('base64url');
};

interface OpenIDConfig {
  authorization_endpoint: string;
}

const buildAuthorizationUrl = (config: OpenIDConfig, params: Record<string, string>) => {
  const url = new URL(config.authorization_endpoint);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.append(key, value);
  }
  return url.toString();
};

export const handleLogout = async (request: FastifyRequest, reply: FastifyReply, providerConfig: ProviderConfig) => {
  const token = request.session.get('token') as SessionStorageToken | undefined;
  await request.session.destroy();
  reply.clearCookie('arbeidsflate', { path: '/' });
  const logoutUrl = token?.id_token
    ? `${providerConfig.end_session_endpoint}?${new URLSearchParams({ id_token_hint: token.id_token })}`
    : '/';
  return reply.redirect(logoutUrl);
};

const plugin: FastifyPluginAsync = async (fastify) => {
  const { client_id, oidc_url, hostname, client_secret } = config;
  const issuerURL = `https://${oidc_url}/.well-known/openid-configuration`;
  const providerConfig = await fetchOpenIDConfig(issuerURL);
  const verifyAccessToken = createAccessTokenVerifier(providerConfig);

  const handleFrontChannelLogout = async (request: FastifyRequest, reply: FastifyReply) => {
    const { iss, sid } = request.query as { iss?: string; sid?: string };

    if (iss !== providerConfig.issuer) {
      return reply.status(400).send({ error: 'Invalid issuer' });
    }

    if (typeof sid !== 'string' || !sid) {
      return reply.status(400).send({ error: 'Missing sid' });
    }

    try {
      await destroyIdpSessions(redisClient, sid);
      return reply.status(200).type('text/html').send('<!DOCTYPE html><html><body>Logged out</body></html>');
    } catch (err) {
      request.log.error({ err }, 'Failed to destroy session via idp sid');
      return reply.status(500).send({ error: 'Failed to destroy session' });
    }
  };

  const handleInitSession = async (request: FastifyRequest, reply: FastifyReply) => {
    const { token } = (request.body ?? {}) as { token?: unknown };
    if (typeof token !== 'string' || !token) {
      return reply.status(400).send({ error: 'Token is required' });
    }

    let claims: Awaited<ReturnType<typeof verifyAccessToken>>;
    try {
      claims = await verifyAccessToken(token);
    } catch {
      return reply.status(401).send({ error: 'Invalid token' });
    }

    const expiresIn = new Date(claims.exp! * 1000).toISOString();
    const previousSession = request.session;
    await previousSession.destroy();
    await previousSession.regenerate();
    request.session.set('token', {
      access_token: token,
      access_token_expires_at: expiresIn,
      tokenUpdatedAt: new Date().toISOString(),
    } as SessionStorageToken);
    request.session.set('pid', claims.pid);
    request.session.set('locale', 'en');
    await request.session.save();
    return reply.status(200).send({ cookie: `arbeidsflate=${request.session.encryptedSessionId}`, expires: expiresIn });
  };

  const handleAuthRequest = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const now = new Date();

      const { code: authorizationCode } = request.query as { code: string; state: string; iss: string };

      const codeVerifier = request.session.get('codeVerifier') ?? '';
      const storedNonceTruth = request.session.get('nonce') ?? '';
      const tokenEndpoint = providerConfig.token_endpoint;
      const basicAuthString = `${client_id}:${client_secret}`;
      const authEncoded = `Basic ${Buffer.from(basicAuthString).toString('base64')}`;

      const body = new URLSearchParams();
      body.append('grant_type', 'authorization_code');
      body.append('client_id', client_id);
      body.append('code_verifier', codeVerifier);
      body.append('code', authorizationCode);
      body.append('redirect_uri', `${hostname}/api/cb`);

      const { data: token } = await axios.post(tokenEndpoint, body, {
        timeout: 30000,
        maxRedirects: 0,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: authEncoded,
        },
      });

      const customToken: IdportenToken = token as unknown as IdportenToken;

      const decodedIDToken = jwt.decode(customToken.id_token) as (IdTokenPayload & jwt.JwtPayload) | null;
      const audiences = typeof decodedIDToken?.aud === 'string' ? [decodedIDToken.aud] : decodedIDToken?.aud;
      // The ID token comes directly from the configured token endpoint over TLS (OIDC Core 3.1.3.7).
      if (
        !decodedIDToken ||
        decodedIDToken.iss !== providerConfig.issuer ||
        !Array.isArray(audiences) ||
        !audiences.includes(client_id) ||
        ((audiences.length > 1 || decodedIDToken.azp !== undefined) && decodedIDToken.azp !== client_id) ||
        typeof decodedIDToken.exp !== 'number' ||
        !Number.isFinite(decodedIDToken.exp) ||
        decodedIDToken.exp * 1000 <= Date.now() ||
        typeof decodedIDToken.iat !== 'number' ||
        !Number.isFinite(decodedIDToken.iat) ||
        (decodedIDToken.pid !== undefined && typeof decodedIDToken.pid !== 'string') ||
        (decodedIDToken.sid !== undefined && typeof decodedIDToken.sid !== 'string') ||
        typeof decodedIDToken.sub !== 'string' ||
        !decodedIDToken.sub ||
        typeof decodedIDToken.nonce !== 'string'
      ) {
        return reply.status(401).send('Invalid ID token');
      }
      const { locale = 'nb', nonce: receivedNonce, sid: idpSid } = decodedIDToken;
      // use sub as fallback for self-identified users
      const pid = decodedIDToken.pid || decodedIDToken.sub;

      const nonceIsAMatch = storedNonceTruth === receivedNonce && storedNonceTruth !== '';
      const refreshTokenExpiresAt = new Date(now.getTime() + customToken.refresh_token_expires_in * 1000).toISOString();
      const accessTokenExpiresAt = new Date(now.getTime() + customToken.expires_in * 1000).toISOString();

      if (!nonceIsAMatch) {
        return reply.status(401).send('Nonce mismatch');
      }

      const sessionStorageToken: SessionStorageToken = {
        access_token: customToken.access_token,
        access_token_expires_at: accessTokenExpiresAt,
        id_token: customToken.id_token,
        refresh_token: customToken.refresh_token,
        refresh_token_expires_at: refreshTokenExpiresAt,
        scope: customToken.scope,
        tokenUpdatedAt: new Date().toISOString(),
      };

      // Fastify's regenerate creates a new session but does not delete the old one.
      const previousSession = request.session;
      await previousSession.destroy();
      await previousSession.regenerate();
      request.session.set('token', sessionStorageToken);
      request.session.set('pid', pid);
      request.session.set('locale', locale);

      if (idpSid) {
        request.session.set('idpSid', idpSid);
      }

      return reply.code(302).redirect('/');
    } catch (e: unknown) {
      if (axios.isAxiosError(e)) {
        logger.error({ status: e.response?.status }, 'Token exchange failed');
      } else {
        logger.error(e, 'handleAuthRequest error');
      }
      if (!reply.sent) {
        return reply.code(500).send('Authentication error');
      }
      return;
    }
  };

  const redirectToAuthorizationURI = async (request: FastifyRequest, reply: FastifyReply) => {
    const { hostname } = config;
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = crypto.randomBytes(16).toString('hex');
    const nonce = crypto.randomBytes(16).toString('hex');
    const queryParameters = request.query as {
      idporten_loa_high?: boolean;
    };

    request.session.set('codeVerifier', codeVerifier);
    request.session.set('codeChallenge', codeChallenge);
    request.session.set('state', state);
    request.session.set('nonce', nonce);

    const parameters: Record<string, string> = {
      redirect_uri: `${hostname}/api/cb`,
      scope: 'digdir:dialogporten.noconsent openid altinn:portal/enduser',
      acr_values: queryParameters?.idporten_loa_high ? 'idporten-loa-high' : 'idporten-loa-substantial',
      state,
      client_id,
      response_type: 'code',
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    };

    const authUrl = buildAuthorizationUrl(providerConfig, parameters);

    const redirectTo: URL = new URL(authUrl);
    return reply.redirect(redirectTo.href);
  };

  fastify.get('/api/login', async (request: FastifyRequest, reply: FastifyReply) => {
    return redirectToAuthorizationURI(request, reply);
  });

  /* Post login: retrieves token, stores values to user session and redirects to client */
  fastify.get('/api/cb', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const storedStateTruth = request.session.get('state') || '';
      const receivedState = (request.query as { state: string }).state || '';
      const stateIsAMatch = storedStateTruth === receivedState && storedStateTruth !== '';

      if (!stateIsAMatch) {
        if (!reply.sent) {
          return reply.redirect('/api/login');
        }
        return;
      }

      /* Handle the callback from the OIDC provider */
      return await handleAuthRequest(request, reply);
    } catch (error) {
      logger.error(error, 'Error in /api/cb callback handler');
      if (!reply.sent) {
        return reply.code(500).send('Authentication callback error');
      }
    }
  });

  fastify.get('/api/logout', async (request, reply) => handleLogout(request, reply, providerConfig));
  fastify.get('/api/frontchannel-logout', handleFrontChannelLogout);

  if (config.enableInitSessionEndpoint && config.environment !== 'prod') {
    fastify.post('/api/init-session', handleInitSession);
  }
};

export default fp(plugin, {
  fastify: '5.x',
  name: 'fastify-oicd',
});
