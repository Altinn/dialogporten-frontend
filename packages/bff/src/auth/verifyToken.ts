import { logger } from '@digdir/dialogporten-node-logger';
import axios from 'axios';
import type { FastifyPluginAsync, FastifyReply, FastifyRequest, IdPortenUpdatedToken, ProviderConfig } from 'fastify';
import fp from 'fastify-plugin';
import config from '../config.ts';
import { type SessionStorageToken, fetchOpenIDConfig, handleLogout } from './oidc.ts';

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

type ValidationStatus =
  | 'refresh_token_expired'
  | 'refreshed'
  | 'missing_token'
  | 'access_token_valid'
  | 'access_token_invalid';

/**
 * Checks the validity of the session token in the request and optionally refreshes the token if necessary.
 *
 * @param {FastifyRequest} request - The Fastify request object containing the session token.
 * @param {boolean} allowTokenRefresh - Flag indicating whether the function should attempt to refresh tokens if the access token has expired.
 * @param providerConfig
 * @returns {Promise<boolean>} - Returns `true` if the access token is still valid or if it has been successfully refreshed.
 *                               Returns `false` if the token is invalid or cannot be refreshed.
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
  // Check if the access token expires in less than 60 seconds for now
  const accessTokenExpiresSoon = accessTokenExpiresAt.getTime() - now.getTime() < 60 * 1000;
  const isAccessTokenValid = accessTokenExpiresAt > now;

  if (accessTokenExpiresSoon && allowTokenRefresh && isRefreshTokenValid) {
    try {
      await refreshToken(request, providerConfig);
      // Ensure that the token has been updated and valid after the refresh
      const updatedToken: SessionStorageToken | undefined = request.session.get('token');
      const updatedAccessTokenExpiresAt = new Date(updatedToken?.access_token_expires_at || '');
      if (updatedAccessTokenExpiresAt > now) {
        return 'refreshed';
      }
      return 'refresh_token_expired';
    } catch (error) {
      logger.error(error, 'Unable to refresh token');
      return 'refresh_token_expired';
    }
  }
  return isAccessTokenValid ? 'access_token_valid' : 'access_token_invalid';
};

const plugin: FastifyPluginAsync = async (fastify, _) => {
  const { oidc_url } = config;
  const issuerURL = `https://${oidc_url}/.well-known/openid-configuration`;
  const providerConfig = await fetchOpenIDConfig(issuerURL);

  fastify.decorate('verifyToken', (allowTokenRefresh: boolean) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const validationStatus: ValidationStatus = await getIsTokenValid(request, allowTokenRefresh, providerConfig);
        if (validationStatus === 'refresh_token_expired' || validationStatus === 'missing_token') {
          // Redirect to force a new login if the refresh token has expired or if the token is missing
          return handleLogout(request, reply, providerConfig);
        }
        request.tokenIsValid = validationStatus === 'access_token_valid' || validationStatus === 'refreshed';
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
