import pino from 'pino';
import z from 'zod';

const envVariables = z.object({
  LOGGER_FORMAT: z.enum(['json', 'pretty']).default('pretty'),
  LOG_LEVEL: z.nativeEnum(pino.levels.labels).default('info'),
  TEST_LOGGING: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .default('false'),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional(),
});

const env = envVariables.parse(process.env);

console.info(`node-logger: Log level set to ${env.LOG_LEVEL}`);

/**
 * Extracts exception attributes from an Error object according to OpenTelemetry semantic conventions.
 * These attributes are required for Application Insights to recognize errors as exceptions.
 * Only used when OTEL_EXPORTER_OTLP_ENDPOINT is defined.
 */
const extractExceptionAttributes = (error: Error | unknown): Record<string, string> => {
  if (error instanceof Error) {
    return {
      'exception.type': error.constructor.name || 'Error',
      'exception.message': error.message || '',
      'exception.stacktrace': error.stack || '',
    };
  }
  return {};
};

/**
 * Wraps error logging to ensure OpenTelemetry exception attributes are included.
 * This ensures Application Insights recognizes errors as exceptions, not just traces with severity level.
 * Exception attributes are only added when OTEL_EXPORTER_OTLP_ENDPOINT is defined.
 */
const createErrorLogger = (baseLogger: pino.Logger) => {
  const isOpenTelemetryEnabled = !!env.OTEL_EXPORTER_OTLP_ENDPOINT;

  return (errorOrObj: Error | Record<string, unknown> | string, message?: string) => {
    // Handle different call signatures: logger.error(error), logger.error(error, msg), logger.error(obj, msg)
    if (errorOrObj instanceof Error) {
      const exceptionAttrs = isOpenTelemetryEnabled ? extractExceptionAttributes(errorOrObj) : {};
      if (message) {
        baseLogger.error({ ...exceptionAttrs, err: errorOrObj }, message);
      } else {
        baseLogger.error({ ...exceptionAttrs, err: errorOrObj });
      }
    } else if (typeof errorOrObj === 'object' && errorOrObj !== null) {
      // Check if the object contains an Error (common pattern: { err: Error })
      const errorObj = errorOrObj as Record<string, unknown>;
      const err = errorObj.err || errorObj.error || errorObj.exception;

      if (err instanceof Error) {
        const exceptionAttrs = isOpenTelemetryEnabled ? extractExceptionAttributes(err) : {};
        baseLogger.error({ ...errorObj, ...exceptionAttrs, err }, message || '');
      } else {
        // No error found, log as-is
        baseLogger.error(errorOrObj, message || '');
      }
    } else {
      // String or other primitive
      baseLogger.error(errorOrObj, message);
    }
  };
};

/**
 * Wraps fatal logging to ensure OpenTelemetry exception attributes are included.
 * Exception attributes are only added when OTEL_EXPORTER_OTLP_ENDPOINT is defined.
 */
const createFatalLogger = (baseLogger: pino.Logger) => {
  const isOpenTelemetryEnabled = !!env.OTEL_EXPORTER_OTLP_ENDPOINT;

  return (errorOrObj: Error | Record<string, unknown> | string, message?: string) => {
    if (errorOrObj instanceof Error) {
      const exceptionAttrs = isOpenTelemetryEnabled ? extractExceptionAttributes(errorOrObj) : {};
      if (message) {
        baseLogger.fatal({ ...exceptionAttrs, err: errorOrObj }, message);
      } else {
        baseLogger.fatal({ ...exceptionAttrs, err: errorOrObj });
      }
    } else if (typeof errorOrObj === 'object' && errorOrObj !== null) {
      const errorObj = errorOrObj as Record<string, unknown>;
      const err = errorObj.err || errorObj.error || errorObj.exception;

      if (err instanceof Error) {
        const exceptionAttrs = isOpenTelemetryEnabled ? extractExceptionAttributes(err) : {};
        baseLogger.fatal({ ...errorObj, ...exceptionAttrs, err }, message || '');
      } else {
        baseLogger.fatal(errorOrObj, message || '');
      }
    } else {
      baseLogger.fatal(errorOrObj, message);
    }
  };
};

const openTelemetryTransport = {
  target: 'pino-opentelemetry-transport',
};

const pinoPrettyTransport = {
  target: 'pino-pretty',
  options: {
    destination: 1,
    colorize: true,
    levelFirst: true,
  },
};

const jsonTransport = {
  target: 'pino/file',
  options: {
    destination: 1,
  },
};

const consoleTransport = env.LOGGER_FORMAT === 'json' ? jsonTransport : pinoPrettyTransport;

// biome-ignore lint/suspicious/noExplicitAny: poor typings from pino
let transports: any;

// Configure transports based on OTEL endpoint availability
if (env.OTEL_EXPORTER_OTLP_ENDPOINT) {
  console.info('node-logger: Using console and OpenTelemetry transports');
  transports = pino.transport({
    targets: [openTelemetryTransport, consoleTransport],
  });
} else {
  console.info('node-logger: Using console transport only');
  transports = pino.transport(consoleTransport);
}

const pinoLogger = pino({ level: env.LOG_LEVEL }, transports);

export const createContextLogger = (context: Record<string | number | symbol, unknown>) => {
  const child = pinoLogger.child(context);

  return {
    trace: child.trace.bind(child),
    debug: child.debug.bind(child),
    info: child.info.bind(child),
    warn: child.warn.bind(child),
    error: createErrorLogger(child),
    fatal: createFatalLogger(child),
    silent: child.silent.bind(child),
  };
};

if (env.TEST_LOGGING) {
  pinoLogger.debug('Debug test');
  pinoLogger.trace('Trace test');
  pinoLogger.info({ some: 'object' }, 'Info test');
  pinoLogger.warn('Consider this a warning');
  // Use wrapped error logger to test exception attributes
  createErrorLogger(pinoLogger)(new Error('Test error'), 'Error test');
  createFatalLogger(pinoLogger)(new Error('Test error'), 'Fatal test');
}

export const logger = {
  trace: pinoLogger.trace.bind(pinoLogger),
  debug: pinoLogger.debug.bind(pinoLogger),
  info: pinoLogger.info.bind(pinoLogger),
  warn: pinoLogger.warn.bind(pinoLogger),
  error: createErrorLogger(pinoLogger),
  fatal: createFatalLogger(pinoLogger),
  silent: pinoLogger.silent.bind(pinoLogger),
  pinoLoggerInstance: pinoLogger,
};
