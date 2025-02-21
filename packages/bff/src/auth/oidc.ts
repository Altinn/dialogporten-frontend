import crypto from 'node:crypto';
import { logger } from '@digdir/dialogporten-node-logger';
import axios from 'axios';
import type {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyReply,
  FastifyRequest,
  HookHandlerDoneFunction,
} from 'fastify';
import fp from 'fastify-plugin';
import jwt from 'jsonwebtoken';
import config from '../config.js';

declare module 'fastify' {
  interface FastifyInstance {
    verifyToken: (
      shouldRefresh: boolean,
    ) => (request: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction) => void;
  }

  interface FastifyRequest {
    tokenIsValid: boolean;
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
  }
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

interface CustomOICDPluginOptions {
  oidc_url: string;
  hostname: string;
  client_id: string;
  client_secret: string;
}

const fetchOpenIDConfig = async (issuerURL: string) => {
  const response = await axios.get(issuerURL);
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

const { client_id, oidc_url, hostname, client_secret } = config;
const issuerURL = `https://${oidc_url}/.well-known/openid-configuration`;
const providerConfig = await fetchOpenIDConfig(issuerURL);

export const handleLogout = async (request: FastifyRequest, reply: FastifyReply) => {
  const { oidc_url, hostname } = config;
  const token: SessionStorageToken | undefined = request.session.get('token');
  const postLogoutRedirectUri = `${hostname}/loggedout`;

  if (token?.id_token) {
    const logoutRedirectUrl = `https://login.${oidc_url}/logout?post_logout_redirect_uri=${postLogoutRedirectUri}&id_token_hint=${token.id_token}`;
    await request.session.destroy();
    reply.redirect(logoutRedirectUrl);
  } else {
    reply.code(401);
  }
};

export const handleAuthRequest = async (request: FastifyRequest, reply: FastifyReply, fastify: FastifyInstance) => {
  try {
    const now = new Date();

    const { code: authorizationCode } = request.query as { code: string; state: string; iss: string };

    const codeVerifier = request.session.get('codeVerifier') ?? '';
    const storedNonceTruth = request.session.get('nonce') ?? '';
    const tokenEndpoint = providerConfig.token_endpoint;
    const basicAuthString = `${client_id}:${client_secret}`;
    const authEncoded = `Basic ${Buffer.from(basicAuthString).toString('base64')}`;

    // Send authorization request
    const { data: token } = await axios.post(
      tokenEndpoint,
      {
        grant_type: 'authorization_code',
        client_id: client_id,
        code_verifier: codeVerifier,
        code: authorizationCode,
        storedNonceTruth,
        redirect_uri: `${hostname}/api/cb`,
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: authEncoded,
        },
      },
    );

    const customToken: IdportenToken = token as unknown as IdportenToken;
    const decodedIDToken = jwt.decode(customToken.id_token) as IdTokenPayload;
    const { pid, locale = 'nb', nonce: receivedNonce } = decodedIDToken;

    const nonceIsAMatch = storedNonceTruth === receivedNonce && storedNonceTruth !== '';
    const refreshTokenExpiresAt = new Date(now.getTime() + customToken.refresh_token_expires_in * 1000).toISOString();
    const accessTokenExpiresAt = new Date(now.getTime() + customToken.expires_in * 1000).toISOString();

    if (!nonceIsAMatch) {
      reply.status(401).send('Nonce mismatch');
      return;
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

    request.session.set('token', sessionStorageToken);
    request.session.set('pid', pid);
    request.session.set('locale', locale);

    reply.redirect('/?loggedIn=true');
  } catch (e: unknown) {
    if (axios.isAxiosError(e)) {
      console.error('handleAuthRequest error e.data', e.response?.data);
    } else {
      console.error('handleAuthRequest error', e);
    }
    reply.status(500);
  }
};

const redirectToAuthorizationURI = async (request: FastifyRequest, reply: FastifyReply) => {
  const { hostname } = config;

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = crypto.randomBytes(16).toString('hex');
  const nonce = crypto.randomBytes(16).toString('hex');

  request.session.set('codeVerifier', codeVerifier);
  request.session.set('codeChallenge', codeChallenge);
  request.session.set('state', state);
  request.session.set('nonce', nonce);

  const parameters: Record<string, string> = {
    redirect_uri: `${hostname}/api/cb`,
    scope: 'digdir:dialogporten.noconsent openid',
    state,
    client_id,
    response_type: 'code',
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  };

  const authUrl = buildAuthorizationUrl(providerConfig, parameters);

  const redirectTo: URL = new URL(authUrl);
  reply.redirect(redirectTo.href);
};

const plugin: FastifyPluginAsync<CustomOICDPluginOptions> = async (fastify, options) => {
  fastify.get('/api/login', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await redirectToAuthorizationURI(request, reply);
    } catch (e) {
      logger.error('login error', e);
      reply.status(500);
    }
  });

  /* Post login: retrieves token, stores values to user session and redirects to client */
  fastify.get('/api/cb', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const storedStateTruth = request.session.get('state') || '';
      const receivedState = (request.query as { state: string }).state || '';
      const stateIsAMatch = storedStateTruth === receivedState && storedStateTruth !== '';

      if (!stateIsAMatch) {
        reply.status(401).send('State mismatch');
        return;
      }

      /* Handle the callback from the OIDC provider */
      await handleAuthRequest(request, reply, fastify);
    } catch (e) {
      logger.error('callback error', e);
      reply.status(500);
    }
  });

  fastify.get('/api/logout', { preHandler: fastify.verifyToken(false) }, handleLogout);
};

export default fp(plugin, {
  fastify: '5.x',
  name: 'fastify-oicd',
});
