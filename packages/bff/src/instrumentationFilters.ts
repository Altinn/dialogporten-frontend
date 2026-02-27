const appConfigurationHostIdentifier = 'appconfiguration.azconfig.io';

const spanHostAttributeKeys = ['http.host', 'net.peer.name', 'server.address', 'url.full', 'http.url'] as const;

const asNonEmptyString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
};

const extractHostFromUrl = (urlString: string): string | undefined => {
  try {
    return new URL(urlString).host || undefined;
  } catch {
    return undefined;
  }
};

export const isAzureAppConfigurationHost = (value: string | undefined): boolean => {
  return value?.toLowerCase().includes(appConfigurationHostIdentifier) ?? false;
};

export const shouldDropSpanByAzureAppConfigurationAttributes = (attributes: Record<string, unknown>): boolean => {
  for (const key of spanHostAttributeKeys) {
    const value = asNonEmptyString(attributes[key]);
    if (!value) {
      continue;
    }

    if (isAzureAppConfigurationHost(value)) {
      return true;
    }

    const hostFromUrl = extractHostFromUrl(value);
    if (isAzureAppConfigurationHost(hostFromUrl)) {
      return true;
    }
  }

  return false;
};
