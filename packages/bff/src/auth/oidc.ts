import { logger } from '@digdir/dialogporten-node-logger';
import type { OAuth2Namespace } from '@fastify/oauth2';
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
import * as client from 'openid-client';
import config from '../config.js';

declare module 'fastify' {
  interface FastifyInstance {
    idporten: OAuth2Namespace;
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
    sub: string;
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
  sub: string;
  locale: string;
  jwt: string;
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
}

interface CustomOICDPluginOptions {
  oidc_url: string;
  hostname: string;
  client_id: string;
  client_secret: string;
}

const { client_id, oidc_url, hostname, client_secret } = config;
const issuerURL = new URL(`https://${oidc_url}/.well-known/openid-configuration`);
const providerConfig: client.Configuration = await client.discovery(issuerURL, client_id, client_secret);

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

    /* must match the one in the callback */
    const {
      code: authorizationCode,
      state: callbackState,
      iss,
    } = request.query as { code: string; state: string; iss: string };

    const codeVerifier = request.session.get('codeVerifier') ?? '';
    const code_challenge = request.session.get('codeChallenge') ?? '';
    const state = request.session.get('state') ?? '';

    // TODO: check code challenge with code from request

    const tokenEndpoint = `https://${oidc_url}/token`;
    const basicAuthString = `${client_id}:${client_secret}`;
    const authEncoded = `Basic ${Buffer.from(basicAuthString).toString('base64')}`;

    const { data: token } = await axios.post(
      tokenEndpoint,
      {
        grant_type: 'authorization_code',
        client_id: client_id,
        code_verifier: codeVerifier,
        code: authorizationCode,
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
    const refreshTokenExpiresAt = new Date(now.getTime() + customToken.refresh_token_expires_in * 1000).toISOString();
    const accessTokenExpiresAt = new Date(now.getTime() + customToken.expires_in * 1000).toISOString();

    const { sub, locale = 'nb' } = jwt.decode(customToken.id_token as string) as unknown as IdTokenPayload;
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
    request.session.set('sub', sub);
    request.session.set('locale', locale);

    reply.redirect('/?loggedIn=true');
  } catch (e) {
    logger.error(e.response);
    reply.status(500);
  }
};

const redirectToAuthorizationURI = async (request: FastifyRequest, reply: FastifyReply) => {
  const { hostname } = config;

  const codeVerifier: string = client.randomPKCECodeVerifier();
  const codeChallenge: string = await client.calculatePKCECodeChallenge(codeVerifier);
  const state = client.randomState();

  const parameters: Record<string, string> = {
    redirect_uri: `${hostname}/api/cb`,
    scope: 'digdir:dialogporten.noconsent openid',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  };

  request.session.set('codeVerifier', codeVerifier);
  request.session.set('codeChallenge', codeChallenge);
  request.session.set('state', state);

  const redirectTo: URL = client.buildAuthorizationUrl(providerConfig, parameters);

  reply.redirect(redirectTo.href);
};

const plugin: FastifyPluginAsync<CustomOICDPluginOptions> = async (fastify, options) => {
  fastify.get('/api/login', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await redirectToAuthorizationURI(request, reply);
    } catch (e) {
      logger.error(e);
      reply.status(500);
    }
  });

  /* Post login: retrieves token, stores values to user session and redirects to client */
  fastify.get('/api/cb', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      console.info('query', request.query);

      /* Handle the callback from the OIDC provider */
      await handleAuthRequest(request, reply, fastify);
    } catch (e) {
      logger.error(e);
      reply.status(500);
    }
  });

  fastify.get('/api/logout', { preHandler: fastify.verifyToken(false) }, handleLogout);
};
export default fp(plugin, {
  fastify: '5.x',
  name: 'fastify-oicd',
});
