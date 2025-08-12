/**
 * This module provides functions to fetch tokens from the Altinn Test Tools Token Generator API.
 * It supports both enterprise and personal tokens, caching them to avoid unnecessary requests.
 */
import encoding from 'k6/encoding';
import http from 'k6/http';
import { URL } from 'https://jslib.k6.io/url/1.0.0/index.js';

const tokenUsername = __ENV.TOKEN_GENERATOR_USERNAME;
const tokenPassword = __ENV.TOKEN_GENERATOR_PASSWORD;

const tokenTtl = Number.parseInt(__ENV.TTL) || 3600;
const tokenMargin = 10;

const credentials = `${tokenUsername}:${tokenPassword}`;
const encodedCredentials = encoding.b64encode(credentials);
const tokenRequestOptions = {
  headers: {
    Authorization: `Basic ${encodedCredentials}`,
  },
  tags: { name: 'Token generator' },
};

const cachedTokens = {};
const cachedTokensIssuedAt = {};

/**
 * Function to generate a cache key based on the token type and options.
 * @param {*} tokenType
 * @param {*} tokenOptions
 * @returns cacheKey
 */
function getCacheKey(tokenType, tokenOptions) {
  let cacheKey = `${tokenType}`;
  for (const key in tokenOptions) {
    if (tokenOptions.hasOwn(key)) {
      cacheKey += `|${tokenOptions[key]}`;
    }
  }
  return cacheKey;
}

/**
 * Fetches a token from the token generator API, caching it to avoid unnecessary requests.
 * @param {string} url - The URL of the token generator API.
 * @param {Object} tokenOptions - The options for the token, including user and app details.
 * Example:
 * {
 *   scope: 'altinn:serviceowner altinn:enduser',
 *   env: 'yt01',
 *   pid: '12345678901',
 *   ssn: '12345678901',
 * }
 * @param {string} type - The type of token being fetched (e.g., 'enterprise', 'personal').
 * @returns {string} - The fetched token.
 **/
function fetchToken(url, tokenOptions, type) {
  const currentTime = Math.floor(Date.now() / 1000);
  const cacheKey = getCacheKey(type, tokenOptions);

  if (!cachedTokens[cacheKey] || currentTime - cachedTokensIssuedAt[cacheKey] >= tokenTtl - tokenMargin) {
    // if (__VU == 0) {
    //   console.info(`Fetching ${type} token from token generator during setup stage`);
    // }
    // else {
    //   console.info(`Fetching ${type} token from token generator during VU stage for VU #${__VU}`);
    // }

    const response = http.get(url, tokenRequestOptions);

    if (response.status !== 200) {
      throw new Error(`Failed getting ${type} token: ${response.status_text}`);
    }
    cachedTokens[cacheKey] = response.body;
    cachedTokensIssuedAt[cacheKey] = currentTime;
  }

  return cachedTokens[cacheKey];
}

/**
 * Adds environment and TTL to the token options if they are not already present.
 * @param {Object} tokenOptions - The options for the token.
 * @param {string} env - The environment for which the token is being generated.
 * @returns {Object} - The updated token options with environment and TTL.
 **/
function addEnvAndTtlToTokenOptions(tokenOptions, env) {
  const options = { ...tokenOptions };
  if (!('env' in options)) {
    options.env = env;
  }
  if (!('ttl' in options)) {
    options.ttl = tokenTtl;
  }
  return options;
}

/**
 * Fetches an enterprise token from the token generator API.
 *
 * @param {Object} tokenOptions - The options for the token, including user and app details.
 * Example:
 * {
 *    scope: 'altinn:serviceowner altinn:enduser','
 *    env: 'yt01',
 *    pid: '12345678901',
 *    ssn: '12345678901',
 *    appOwner: '12345678901'
 * }
 * @param {string} [env='yt01'] - The environment for which the token is being generated.
 * @returns {Promise} - A promise that resolves to the fetched token.
 */
export function getEnterpriseToken(tokenOptions, env = 'yt01') {
  const url = new URL(`https://altinn-testtools-token-generator.azurewebsites.net/api/GetEnterpriseToken`);
  const extendedOptions = addEnvAndTtlToTokenOptions(tokenOptions, env);
  for (const key in extendedOptions) {
    if (extendedOptions.hasOwn(key)) {
      url.searchParams.append(key, extendedOptions[key]);
    }
  }
  return fetchToken(url.toString(), extendedOptions, `enterprise`);
}

/**
 * Fetches a personal token from the token generator API.
 *
 * @param {Object} tokenOptions - The options for the token, including user and app details.
 * Example:
 * {
 *    scopes: 'altinn:portal/enduser',
 *    env: 'yt01',
 *    pid: '12345678901',
 *    userid: '12345678901',
 *    partyid: '12345678901',
 * }
 * @param {string} [env='yt01'] - The environment for which the token is being generated.
 * @return {Promise} - A promise that resolves to the fetched token.
 */
export function getPersonalToken(tokenOptions, env = 'yt01') {
  const url = new URL(`https://altinn-testtools-token-generator.azurewebsites.net/api/GetPersonalToken`);
  const extendedOptions = addEnvAndTtlToTokenOptions(tokenOptions, env);
  for (const key in extendedOptions) {
    if (extendedOptions.hasOwn(key)) {
      url.searchParams.append(key, extendedOptions[key]);
    }
  }
  return fetchToken(url.toString(), extendedOptions, 'personal');
}