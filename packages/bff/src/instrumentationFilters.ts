import { scrubString } from '@altinn/dialogporten-node-logger';
import type { Attributes } from '@opentelemetry/api';
import { ATTR_URL_QUERY } from '@opentelemetry/semantic-conventions';

const appConfigurationHostIdentifier = 'appconfiguration.azconfig.io';
const graphqlSpansExcludedFromExport = new Set([
  'graphql.parse',
  'graphql.validate',
  'graphql.parseSchema',
  'graphql.validateSchema',
]);

// EVAL arguments contain the serialized session, including bearer and refresh tokens.
export const serializeRedisCommand = (command: string, _args: unknown[]): string => command;

export const redactedQueryParams = [
  'sig',
  'Signature',
  'AWSAccessKeyId',
  'X-Goog-Signature',
  'code',
  'state',
  'session_state',
  'access_token',
  'refresh_token',
  'id_token',
  'id_token_hint',
  'client_secret',
  'client_assertion',
  'assertion',
  'password',
];

export const redactIncomingQuery = (requestUrl: string | undefined): Attributes => {
  if (!requestUrl?.includes('?')) {
    return {};
  }
  try {
    const { search } = new URL(requestUrl, 'http://localhost');
    return search ? { [ATTR_URL_QUERY]: scrubString(search).slice(1) } : {};
  } catch {
    return {};
  }
};

export const filterGraphQLSpans = (spanName: string): boolean => {
  return graphqlSpansExcludedFromExport.has(spanName);
};

export const filterAppConfigSpans = (attributes: Record<string, unknown>): boolean => {
  const httpHost = attributes['http.host'];
  if (typeof httpHost !== 'string') {
    return false;
  }

  return httpHost.toLowerCase().includes(appConfigurationHostIdentifier);
};
