import { describe, expect, test } from 'vitest';
import { shouldDropSpanByName } from '../src/otelSpanFilter.ts';

describe('shouldDropSpanByName', () => {
  test('returns true for graphql parse and validate spans', () => {
    expect(shouldDropSpanByName('graphql.parse')).toBe(true);
    expect(shouldDropSpanByName('graphql.validate')).toBe(true);
    expect(shouldDropSpanByName('graphql.parseSchema')).toBe(true);
    expect(shouldDropSpanByName('graphql.validateSchema')).toBe(true);
  });

  test('returns false for non-filtered spans', () => {
    expect(shouldDropSpanByName('http.server.request')).toBe(false);
    expect(shouldDropSpanByName('graphql.execute')).toBe(false);
    expect(shouldDropSpanByName('graphql.resolve')).toBe(false);
  });
});
