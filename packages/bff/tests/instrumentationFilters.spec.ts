import { describe, expect, it } from 'vitest';
import {
  filterAppConfigSpans,
  filterGraphQLSpans,
  redactedQueryParams,
  redactIncomingQuery,
  serializeRedisCommand,
} from '../src/instrumentationFilters.ts';

describe('filterGraphQLSpans', () => {
  it('returns true for internal GraphQL parse and validation spans', () => {
    expect(filterGraphQLSpans('graphql.parse')).toBe(true);
    expect(filterGraphQLSpans('graphql.validate')).toBe(true);
    expect(filterGraphQLSpans('graphql.parseSchema')).toBe(true);
    expect(filterGraphQLSpans('graphql.validateSchema')).toBe(true);
  });

  it('returns false for other span names', () => {
    expect(filterGraphQLSpans('http GET')).toBe(false);
  });
});

describe('filterAppConfigSpans', () => {
  it('returns true for spans with app configuration host attributes', () => {
    expect(
      filterAppConfigSpans({
        'http.host': 'dp-fe-staging-appconfiguration.azconfig.io:443',
      }),
    ).toBe(true);
  });

  it('returns false when http.host is missing', () => {
    expect(
      filterAppConfigSpans({
        'http.url': 'https://dp-fe-staging-appconfiguration.azconfig.io/kv?api-version=2023-11-01',
      }),
    ).toBe(false);
  });

  it('returns false for spans without app configuration host attributes', () => {
    expect(
      filterAppConfigSpans({
        'http.host': 'example.com',
      }),
    ).toBe(false);
  });
});

describe('Redis telemetry', () => {
  it.each(['eval', 'evalsha', 'get', 'set', 'multi', 'del'])(
    'excludes session IDs and credentials from %s spans',
    (command) => {
      const statement = serializeRedisCommand(command, [
        'session-script',
        2,
        'sess:private-session-id',
        JSON.stringify({
          pid: 'private-pid',
          token: { access_token: 'private-access-token', refresh_token: 'private-refresh-token' },
        }),
      ]);
      expect(statement).toBe(command);
      expect(statement).not.toContain('private-');
    },
  );
});

describe('redactIncomingQuery', () => {
  it('returns no attributes when the url has no query', () => {
    expect(redactIncomingQuery('/api/graphql')).toEqual({});
    expect(redactIncomingQuery('/api/graphql?')).toEqual({});
    expect(redactIncomingQuery(undefined)).toEqual({});
  });

  it('redacts the OIDC callback parameters', () => {
    expect(redactIncomingQuery('/api/cb?code=abc123&state=xyz&session_state=s1')).toEqual({
      'url.query': 'code=[REDACTED]&state=[REDACTED]&session_state=[REDACTED]',
    });
  });

  it('redacts tokens and person identifiers in any parameter', () => {
    expect(
      redactIncomingQuery('/api/x?access_token=opaque&foo=eyJhbGciOiJub25lIn0.eyJzdWIiOiJ4In0.sig&pid=12345678901'),
    ).toEqual({ 'url.query': 'access_token=[REDACTED]&foo=[REDACTED]&pid=[REDACTED]' });
  });

  it('keeps harmless parameters unchanged', () => {
    expect(redactIncomingQuery('/api/graphql?operation=getDialogs&page=2')).toEqual({
      'url.query': 'operation=getDialogs&page=2',
    });
  });
});

describe('redactedQueryParams', () => {
  it('keeps the OpenTelemetry defaults and adds OIDC parameters', () => {
    expect(redactedQueryParams).toEqual(
      expect.arrayContaining(['sig', 'Signature', 'AWSAccessKeyId', 'X-Goog-Signature', 'code', 'state']),
    );
  });
});
