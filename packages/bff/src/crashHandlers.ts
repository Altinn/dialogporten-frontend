import { logger, sanitize } from '@altinn/dialogporten-node-logger';

export const crashLine = (message: string, error: unknown): string =>
  `${JSON.stringify({ level: 'fatal', time: new Date().toISOString(), msg: message, err: sanitize(error) })}\n`;

export const exitAfterCrash = (message: string, error: unknown): never => {
  try {
    process.stderr.write(crashLine(message, error));
    logger.fatal(error instanceof Error ? error : new Error(message, { cause: error }), message);
  } finally {
    process.exit(1);
  }
};

export const registerCrashHandlers = (): void => {
  process.on('uncaughtException', (error) => exitAfterCrash('Uncaught exception', error));
  process.on('unhandledRejection', (reason) => exitAfterCrash('Unhandled promise rejection', reason));
};
