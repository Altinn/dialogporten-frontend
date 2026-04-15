import { logger } from '@altinn/dialogporten-node-logger';
import axios from 'axios';
import type { FastifyPluginAsync, FastifyReply, FastifyRequest, IdPortenUpdatedToken, ProviderConfig } from 'fastify';
import fp from 'fastify-plugin';
import config from '../config.ts';
import { type SessionStorageToken, fetchOpenIDConfig } from './oidc.ts';

export const refreshToken = async (request: FastifyRequest, providerconfig: ProviderConfig) => {
  const token: SessionStorageToken | undefined = request.session.get('token');
  const { client_id, client_secret } = config;

  if (!token) {
    return;
  }

  const tokenEndpoint = providerconfig.token_endpoint;
  const basicAuthString = `${client_id}:${client_secret}`;
  const authEncoded = `Basic ${Buffer.from(basicAuthString).toString('base64')}`;

  const body = new URLSearchParams();
  body.append('grant_type', 'refresh_token');
  body.append('refresh_token', token.refresh_token);

  const refreshResponse = await axios.post(tokenEndpoint, body, {
    timeout: 30000,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: authEncoded,
    },
  });

  const updatedToken: IdPortenUpdatedToken = refreshResponse?.data;

  if (updatedToken) {
    const refreshTokenExpiresAt = new Date(Date.now() + updatedToken.refresh_token_expires_in * 1000).toISOString();
    const accessTokenExpiresAt = new Date(Date.now() + updatedToken.expires_in * 1000).toISOString();

    const updatedSessionStorageToken: SessionStorageToken = {
      id_token: token.id_token, // id_token is not returned in the refresh response
      scope: token.scope, // scope will not change
      access_token: updatedToken.access_token,
      refresh_token: updatedToken.refresh_token,
      refresh_token_expires_at: refreshTokenExpiresAt,
      access_token_expires_at: accessTokenExpiresAt,
      tokenUpdatedAt: new Date().toISOString(),
    };

    request.session.set('token', updatedSessionStorageToken);
  }
};

type ValidationStatus = 'missing_token' | 'access_token_valid' | 'access_token_invalid';

/**
 * Checks the validity of the session token in the request and optionally refreshes the token if necessary.
 * If the access token is about to expire and refresh is allowed, a refresh is attempted as a side effect.
 * The final validity is always determined by re-reading the (potentially refreshed) token from the session.
 */
const getIsTokenValid = async (
  request: FastifyRequest,
  allowTokenRefresh: boolean,
  providerConfig: ProviderConfig,
): Promise<ValidationStatus> => {
  const token: SessionStorageToken | undefined = request.session.get('token');

  if (!token) {
    return 'missing_token';
  }

  const now = new Date();
  const accessTokenExpiresAt = new Date(token.access_token_expires_at);
  const isRefreshTokenValid = new Date(token.refresh_token_expires_at) > now;
  const accessTokenExpiresSoon = accessTokenExpiresAt.getTime() - now.getTime() < 60 * 1000;

  if (accessTokenExpiresSoon && allowTokenRefresh && isRefreshTokenValid) {
    try {
      await refreshToken(request, providerConfig);
    } catch (error) {
      logger.error(error, 'Unable to refresh token');
    }
  }

  // Always check the (potentially refreshed) token
  const currentToken: SessionStorageToken | undefined = request.session.get('token');
  if (!currentToken) {
    return 'missing_token';
  }

  const currentExpiry = new Date(currentToken.access_token_expires_at);
  return currentExpiry > now ? 'access_token_valid' : 'access_token_invalid';
};

const plugin: FastifyPluginAsync = async (fastify, _) => {
  const { oidc_url } = config;
  const issuerURL = `https://${oidc_url}/.well-known/openid-configuration`;
  const providerConfig = await fetchOpenIDConfig(issuerURL);

  fastify.decorate('verifyToken', (allowTokenRefresh: boolean) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validationStatus: ValidationStatus = await getIsTokenValid(request, allowTokenRefresh, providerConfig);
        request.tokenIsValid = validationStatus === 'access_token_valid';
      } catch (e) {
        logger.error(e, 'Unable to verify token');
        request.tokenIsValid = false;
      }
    };
  });
};

export default fp(plugin, {
  fastify: '5.x',
  name: 'fastify-verify-token',
});
