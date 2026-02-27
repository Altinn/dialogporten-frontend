import { describe, expect, it } from 'vitest';
import { shouldDropSpanByAzureAppConfigurationAttributes } from '../src/instrumentationFilters.ts';

describe('shouldDropSpanByAzureAppConfigurationAttributes', () => {
  it('returns true for spans with app configuration host attributes', () => {
    expect(
      shouldDropSpanByAzureAppConfigurationAttributes({
        'http.host': 'dp-fe-staging-appconfiguration.azconfig.io:443',
      }),
    ).toBe(true);
  });

  it('returns true when only http.url contains app configuration host', () => {
    expect(
      shouldDropSpanByAzureAppConfigurationAttributes({
        'http.url':
          'https://dp-fe-staging-appconfiguration.azconfig.io/kv?api-version=2023-11-01&key=.appconfig.featureflag%2Finbox.enableAltinn2Messages',
      }),
    ).toBe(true);
  });

  it('returns false for spans without app configuration host attributes', () => {
    expect(
      shouldDropSpanByAzureAppConfigurationAttributes({
        'http.host': 'example.com',
        'http.url': 'https://example.com/status',
      }),
    ).toBe(false);
  });
});
