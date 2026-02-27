import { describe, expect, it } from 'vitest';
import { filterAppConfigSpans, filterGraphQLSpans } from '../src/instrumentationFilters.ts';

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
