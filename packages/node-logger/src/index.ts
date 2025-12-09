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
    error: child.error.bind(child),
    fatal: child.fatal.bind(child),
    silent: child.silent.bind(child),
  };
};

if (env.TEST_LOGGING) {
  pinoLogger.debug('Debug test');
  pinoLogger.trace('Trace test');
  pinoLogger.info({ some: 'object' }, 'Info test');
  pinoLogger.warn('Consider this a warning');
  pinoLogger.error(new Error('Test error'), 'Error test');
  pinoLogger.fatal(new Error('Test error'), 'Fatal test');
}

export const logger = {
  trace: pinoLogger.trace.bind(pinoLogger),
  debug: pinoLogger.debug.bind(pinoLogger),
  info: pinoLogger.info.bind(pinoLogger),
  warn: pinoLogger.warn.bind(pinoLogger),
  error: pinoLogger.error.bind(pinoLogger),
  fatal: pinoLogger.fatal.bind(pinoLogger),
  silent: pinoLogger.silent.bind(pinoLogger),
  pinoLoggerInstance: pinoLogger,
};
