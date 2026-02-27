const appConfigurationHostIdentifier = 'appconfiguration.azconfig.io';

const spanHostAttributeKeys = ['http.host', 'net.peer.name', 'server.address', 'url.full', 'http.url'] as const;

type OutgoingHttpRequest = {
  headers?: Record<string, unknown>;
  host?: string;
  hostname?: string;
  href?: string;
  path?: string;
};

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

export const getHostFromOutgoingHttpRequest = (request: unknown): string | undefined => {
  if (typeof request === 'string') {
    return extractHostFromUrl(request) ?? request;
  }

  if (request instanceof URL) {
    return request.host || request.hostname || undefined;
  }

  if (!request || typeof request !== 'object') {
    return undefined;
  }

  const outgoingRequest = request as OutgoingHttpRequest;

  const hostFromObject = asNonEmptyString(outgoingRequest.hostname) ?? asNonEmptyString(outgoingRequest.host);
  if (hostFromObject) {
    return hostFromObject;
  }

  const hostHeaderValue = outgoingRequest.headers ? asNonEmptyString(outgoingRequest.headers.host) : undefined;
  if (hostHeaderValue) {
    return hostHeaderValue;
  }

  const href = asNonEmptyString(outgoingRequest.href);
  if (href) {
    return extractHostFromUrl(href);
  }

  const path = asNonEmptyString(outgoingRequest.path);
  if (path?.startsWith('http://') || path?.startsWith('https://')) {
    return extractHostFromUrl(path);
  }

  return undefined;
};

export const isAzureAppConfigurationOutgoingRequest = (request: unknown): boolean => {
  return isAzureAppConfigurationHost(getHostFromOutgoingHttpRequest(request));
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
