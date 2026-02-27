const appConfigurationHostIdentifier = 'appconfiguration.azconfig.io';

export const isAzureAppConfigurationHost = (value: string | undefined): boolean => {
  return value?.toLowerCase().includes(appConfigurationHostIdentifier) ?? false;
};

export const filterAppConfigSpans = (attributes: Record<string, unknown>): boolean => {
  const httpHost = attributes['http.host'];
  if (typeof httpHost !== 'string') {
    return false;
  }

  return isAzureAppConfigurationHost(httpHost);
};
