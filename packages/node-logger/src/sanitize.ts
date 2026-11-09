import type { LoggerOptions } from 'pino';

const REDACTED = '[REDACTED]';
const MAX_DEPTH = 8;
const MAX_AGGREGATE_ERRORS = 10;

const sensitiveKeys = new Set([
  'authorization',
  'proxyauthorization',
  'cookie',
  'setcookie',
  'token',
  'accesstoken',
  'refreshtoken',
  'idtoken',
  'idtokenhint',
  'clientsecret',
  'clientassertion',
  'assertion',
  'secret',
  'password',
  'apikey',
  'connectionstring',
  'pid',
  'ssn',
  'fnr',
  'personidentifier',
  'nationalidentitynumber',
]);

const normalizeKey = (key: string) => key.toLowerCase().replace(/[-_]/g, '');

const jwtPattern = /eyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]*)?/g;
const authSchemePattern = /\b(Bearer|Basic)\s+[a-z0-9._~+/=-]+/gi;
const callbackParamPattern = /([?&](?:code|state|session_state)=)[^&\s"'<>]+/gi;
const secretParamPattern =
  /\b((?:access_token|refresh_token|id_token|id_token_hint|client_secret|client_assertion|assertion|password)=)[^&\s"'<>]+/gi;
const personIdentifierPattern = /(?<![A-Za-z0-9])\d{11}(?![A-Za-z0-9])/g;

export const scrubString = (value: string): string =>
  value
    .replace(jwtPattern, REDACTED)
    .replace(authSchemePattern, `$1 ${REDACTED}`)
    .replace(callbackParamPattern, `$1${REDACTED}`)
    .replace(secretParamPattern, `$1${REDACTED}`)
    .replace(personIdentifierPattern, REDACTED);

const stripQuery = (url: string) => url.split(/[?#]/)[0];

const isScalar = (value: unknown): value is string | number => typeof value === 'string' || typeof value === 'number';

const scrubScalar = (value: string | number) => (typeof value === 'string' ? scrubString(value) : value);

type ErrorLike = Error & {
  code?: unknown;
  status?: unknown;
  statusCode?: unknown;
  errors?: unknown;
  isAxiosError?: unknown;
  config?: { method?: unknown; baseURL?: unknown; url?: unknown };
  response?: { status?: unknown };
  driverError?: { code?: unknown };
};

const errorCode = (error: ErrorLike): Record<string, unknown> => {
  const code = isScalar(error.code) ? error.code : error.driverError?.code;
  return isScalar(code) ? { code: scrubScalar(code) } : {};
};

const errorStatus = (error: ErrorLike): Record<string, unknown> => {
  const status: Record<string, unknown> = {};
  for (const key of ['status', 'statusCode'] as const) {
    if (typeof error[key] === 'number') {
      status[key] = error[key];
    }
  }
  return status;
};

const axiosUrl = (baseURL: unknown, url: string) => {
  const isAbsolute = /^[a-z][a-z0-9+.-]*:\/\//i.test(url);
  const fullUrl = typeof baseURL === 'string' && !isAbsolute ? `${baseURL}${url}` : url;
  return scrubString(stripQuery(fullUrl));
};

const axiosDetails = (error: ErrorLike): Record<string, unknown> => {
  if (error.isAxiosError !== true) {
    return {};
  }
  const { method, baseURL, url } = error.config ?? {};
  const details: Record<string, unknown> = {};
  if (typeof method === 'string') {
    details.method = method.toUpperCase();
  }
  if (typeof url === 'string') {
    details.url = axiosUrl(baseURL, url);
  }
  if (typeof error.response?.status === 'number') {
    details.status = error.response.status;
  }
  return details;
};

const serializeError = (error: ErrorLike, depth: number, seen: WeakSet<object>): Record<string, unknown> => {
  const serialized: Record<string, unknown> = {
    type: error.constructor?.name || error.name || 'Error',
    message: scrubString(String(error.message ?? '')),
    ...(typeof error.stack === 'string' ? { stack: scrubString(error.stack) } : {}),
    ...errorCode(error),
    ...axiosDetails(error),
    ...errorStatus(error),
  };

  if (error.cause !== undefined && error.cause !== null) {
    serialized.cause = sanitizeValue(error.cause, depth + 1, seen);
  }

  if (Array.isArray(error.errors)) {
    serialized.aggregateErrors = error.errors
      .slice(0, MAX_AGGREGATE_ERRORS)
      .map((inner) => sanitizeValue(inner, depth + 1, seen));
  }

  return serialized;
};

const sanitizeValue = (value: unknown, depth: number, seen: WeakSet<object>): unknown => {
  if (typeof value === 'string') {
    return scrubString(value);
  }
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (typeof value !== 'object' || value === null) {
    return value;
  }
  if (seen.has(value)) {
    return '[Circular]';
  }
  if (depth > MAX_DEPTH) {
    return '[Truncated]';
  }

  seen.add(value);
  try {
    if (value instanceof Error) {
      return serializeError(value, depth, seen);
    }
    if (Array.isArray(value)) {
      return value.map((item) => sanitizeValue(item, depth + 1, seen));
    }
    const toJSON = (value as { toJSON?: unknown }).toJSON;
    if (typeof toJSON === 'function') {
      return sanitizeValue(toJSON.call(value), depth + 1, seen);
    }
    const sanitized: Record<string, unknown> = {};
    for (const [key, inner] of Object.entries(value)) {
      sanitized[key] = sensitiveKeys.has(normalizeKey(key)) ? REDACTED : sanitizeValue(inner, depth + 1, seen);
    }
    return sanitized;
  } finally {
    seen.delete(value);
  }
};

export const sanitize = (value: unknown): unknown => sanitizeValue(value, 0, new WeakSet());

export const sanitizeRecord = <T extends Record<string | number | symbol, unknown>>(value: T) =>
  sanitize(value) as Record<string, unknown>;

const implicitErrorMessage = (first: unknown): string | undefined => {
  if (first instanceof Error) {
    return first.message;
  }
  if (typeof first === 'object' && first !== null) {
    const { err } = first as { err?: unknown };
    if (err instanceof Error) {
      return err.message;
    }
  }
  return undefined;
};

export const sanitizeOptions: Pick<LoggerOptions, 'formatters' | 'hooks' | 'serializers'> = {
  serializers: {
    err: sanitize,
    error: sanitize,
  },
  formatters: {
    log: sanitizeRecord,
  },
  hooks: {
    logMethod(args, method) {
      const [first, ...rest] = args as unknown[];
      if (rest.length === 0) {
        const message = implicitErrorMessage(first);
        if (message !== undefined) {
          rest.push(message);
        }
      }
      const scrubbed = [typeof first === 'string' ? scrubString(first) : first, ...rest.map((arg) => sanitize(arg))];
      return method.apply(this, scrubbed as Parameters<typeof method>);
    },
  },
};
