import { logger } from '@digdir/dialogporten-node-logger';
import type { OAuth2Namespace } from '@fastify/oauth2';
import axios from 'axios';
import type {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyReply,
  FastifyRequest,
  HookHandlerDoneFunction,
  IdportenToken,
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
    console.info('handleAuthRequest');

    /* must match the one in the callback */
    const {
      code: authorizationCode,
      state: callbackState,
      iss,
    } = request.query as { code: string; state: string; iss: string };

    const codeVerifier = request.session.get('codeVerifier') ?? '';
    const code_challenge = request.session.get('codeChallenge') ?? '';
    const state = request.session.get('state') ?? '';
    const currentURL = new URL(`${hostname}${request.originalUrl}`);
    console.info('codeVerifier', codeVerifier);
    console.info('code_challenge', code_challenge);
    console.info('state', state);

    const token: client.TokenEndpointResponse = await client.authorizationCodeGrant(providerConfig, currentURL, {
      pkceCodeVerifier: codeVerifier,
      expectedState: callbackState,
    });

    /*const tokenEndpoint = `https://${oidc_url}/token`;
    const basicAuthString = `${client_id}:${client_secret}`;
    const authEncoded = `Basic ${Buffer.from(basicAuthString).toString('base64')}`;

    const body = new URLSearchParams();
    body.append('grant_type', 'authorization_code');
    body.append('client_id', config.client_id);
    body.append('code_verifier', codeVerifier);
    body.append('redirect_uri', `${hostname}/?loggedIn=true`);
    body.append('code', authorizationCode);

    const refreshResponse = await axios.post(tokenEndpoint, body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: authEncoded,
      },
    });
    /
    console.info('token', JSON.stringify(refreshResponse, null, 3));

     */

    const customToken: IdportenToken = token as unknown as IdportenToken;
    const refreshTokenExpiresAt = new Date(now.getTime() + customToken.refresh_token_expires_in * 1000).toISOString();
    const { sub, locale = 'nb' } = jwt.decode(token.id_token as string) as unknown as IdTokenPayload;
    const sessionStorageToken: SessionStorageToken = {
      access_token: customToken.access_token,
      access_token_expires_at: customToken.expires_at,
      id_token: customToken.id_token,
      refresh_token: customToken.refresh_token,
      refresh_token_expires_at: refreshTokenExpiresAt,
      scope: customToken.scope,
      tokenUpdatedAt: new Date().toISOString(),
    };

    request.session.set('token', sessionStorageToken);
    request.session.set('sub', sub);
    request.session.set('locale', locale);
  } catch (e) {
    console.info('handleAuthRequest error', {
      message: e.message,
      response: e.response
        ? {
            status: e.response.status,
            headers: e.response.headers,
            data: e.response.data,
          }
        : null,
    });
    logger.error(e);
    reply.status(500);
  }
};

const redirectToAuthorizationURI = async (request: FastifyRequest, reply: FastifyReply) => {
  const { hostname } = config;

  const codeVerifier: string = client.randomPKCECodeVerifier();
  const codeChallenge: string = await client.calculatePKCECodeChallenge(codeVerifier);
  const state = client.randomState();

  console.info('codeVerifier', codeVerifier);
  console.info('codeChallenge', codeChallenge);

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

  // Something missing here since 400 server_error is returned, but close ...
  console.info('redirectToAuthorizationURI', redirectTo.href);
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
      /* Handle the callback from the OIDC provider */
      // TODO: Check if state and nonce in session matches the one in the callback
      await handleAuthRequest(request, reply, fastify);
      // https://docs.digdir.no/docs/idporten/oidc/oidc_protocol_authorize.html
      reply.redirect('/?loggedIn=true');
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
