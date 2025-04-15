import { describe, expect, it } from 'vitest';
import { createFiltersURLQuery } from './url.ts';

describe('createFiltersURLQuery', () => {
  it('should create a URL with the correct query parameters', () => {
    const activeFilters = {
      org: ['SKD'],
      status: ['IN_PROGRESS'],
    };
    const allFilterKeys = ['org', 'status', 'receiver'];
    const baseURL = 'http://example.com';

    const result = createFiltersURLQuery(activeFilters, allFilterKeys, baseURL);
    expect(result.toString()).toEqual('http://example.com/?org=SKD&status=IN_PROGRESS');
  });

  it('should remove existing query parameters that are not in active filters', () => {
    const activeFilters = {
      org: ['SKD'],
    };
    const allFilterKeys = ['org', 'status'];
    const baseURL = 'http://example.com?status=unread';

    const result = createFiltersURLQuery(activeFilters, allFilterKeys, baseURL);
    expect(result.toString()).toEqual('http://example.com/?org=SKD');
  });

  it('should handle empty active filters', () => {
    const activeFilters = {};
    const allFilterKeys = ['org', 'status'];
    const baseURL = 'http://example.com';

    const result = createFiltersURLQuery(activeFilters, allFilterKeys, baseURL);
    expect(result.toString()).toEqual('http://example.com/');
  });
});
