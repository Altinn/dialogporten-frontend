#!/usr/bin/env -S node --no-warnings=ExperimentalWarning --loader ts-node/esm
import 'reflect-metadata';
import { logger } from '@altinn/dialogporten-node-logger';
import config from './config.ts';
import './instrumentation.ts';

try {
  // There is a race-condition where fastify, redis and postgres is booted before the instrumentation is ready.
  // By starting the app or migration in a function we avoid the imports being hoisted, and we ensure that the instrumentation is ready before the app is started.
  if (config.migrationRun) {
    const { runMigrationApp } = await import('./run-migration.ts');
    await runMigrationApp();
  } else {
    const { default: startServer } = await import('./server.ts');
    await startServer();
  }
} catch (error) {
  logger.error(error);
}
