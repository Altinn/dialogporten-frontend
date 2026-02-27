import { describe, expect, it } from 'vitest';
import {
  isAzureAppConfigurationOutgoingRequest,
  shouldDropSpanByAzureAppConfigurationAttributes,
} from '../src/instrumentationFilters.ts';

describe('isAzureAppConfigurationOutgoingRequest', () => {
  it('returns true when request is a URL string', () => {
    expect(
      isAzureAppConfigurationOutgoingRequest(
        'https://dp-fe-staging-appconfiguration.azconfig.io/kv?api-version=2023-11-01',
      ),
    ).toBe(true);
  });

  it('returns true when request is a URL instance', () => {
    expect(
      isAzureAppConfigurationOutgoingRequest(
        new URL('https://dp-fe-staging-appconfiguration.azconfig.io/kv?api-version=2023-11-01'),
      ),
    ).toBe(true);
  });

  it('returns true when request host is provided in options object', () => {
    expect(
      isAzureAppConfigurationOutgoingRequest({
        host: 'dp-fe-staging-appconfiguration.azconfig.io:443',
      }),
    ).toBe(true);
  });

  it('returns false for non-app-configuration domains', () => {
    expect(isAzureAppConfigurationOutgoingRequest('https://example.com/status')).toBe(false);
  });
});

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
