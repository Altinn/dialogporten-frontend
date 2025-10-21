import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { logger } from '@digdir/dialogporten-node-logger';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import formBody from '@fastify/formbody';
import session from '@fastify/session';
import type { FastifySessionOptions } from '@fastify/session';
import RedisStore from 'connect-redis';
import Fastify from 'fastify';
import fastifyGraphiql from 'fastify-graphiql';
import { oidc, userApi, verifyToken } from './auth/index.ts';
import healthChecks from './azure/HealthChecks.ts';
import healthProbes from './azure/HealthProbes.ts';
import config from './config.ts';
import { connectToDB } from './db.ts';
import featureApi from './features/featureApi.js';
import graphqlApi from './graphql/api.ts';
import { fastifyHeaders } from './graphql/fastifyHeaders.ts';
import graphqlStream from './graphql/subscription.ts';
import { otelSDK } from './instrumentation.ts';
import redisClient from './redisClient.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const errorTemplate = readFileSync(join(__dirname, 'templates', 'error.html'), 'utf-8');

const {
  version,
  port,
  host,
  oidc_url,
  hostname,
  client_id,
  client_secret,
  redisConnectionString,
  appConfigConnectionString,
} = config;

const startServer = async (): Promise<void> => {
  const { secret, enableGraphiql } = config;
  const server = Fastify({
    ignoreTrailingSlash: true,
    ignoreDuplicateSlashes: true,
    trustProxy: true,
  });

  const { dataSource } = await connectToDB();
  /* CORS configuration for local env, needs to be applied before routes are defined */
  const corsOptions = {
    origin: ['https://app.localhost', 'http://localhost:3000'],
    credentials: true,
    methods: 'GET, POST, PATCH, DELETE, PUT',
    allowedHeaders: 'Content-Type, Authorization, X-GraphQL-Operation, X-GraphQL-Start-Time',
    exposedHeaders: 'X-GraphQL-Operation, X-GraphQL-Start-Time, X-Trace-Id',
    preflightContinue: true,
  };

  server.register(cors, corsOptions);
  server.register(fastifyHeaders);
  server.register(formBody);
  server.register(cookie);

  // Session setup
  const cookieSessionConfig: FastifySessionOptions = {
    secret,
    rolling: true,
    cookieName: 'arbeidsflate',
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
    },
  };

  if (redisConnectionString) {
    const store = new RedisStore({
      client: redisClient,
    });

    logger.info('Setting up fastify-session with a Redis store');
    server.register(session, { ...cookieSessionConfig, store });
  } else {
    logger.info('Setting up fastify-session');
    server.register(session, cookieSessionConfig);
  }

  server.setErrorHandler((error, request, reply) => {
    logger.error(error, `Error handling request ${request.method} ${request.url}`);

    const html = errorTemplate.replaceAll('{{statusCode}}', String(error.statusCode || 500));
    reply
      .code(error.statusCode || 500)
      .type('text/html')
      .send(html);
  });

  server.register(verifyToken);
  server.register(healthProbes, { version });
  server.register(healthChecks, { version });
  server.register(oidc, {
    oidc_url,
    hostname,
    client_id,
    client_secret,
  });
  server.register(userApi);
  server.register(featureApi, {
    appConfigConnectionString,
  });
  server.register(graphqlApi);
  server.register(graphqlStream);

  if (enableGraphiql) {
    server.register(fastifyGraphiql, {
      url: '/api/graphiql',
      graphqlURL: '/api/graphql',
    });
  }

  server.listen({ port, host }, (error, address) => {
    if (error) {
      throw error;
    }
    logger.info(`Server ${version} is running on ${address}`);
  });

  // Graceful Shutdown
  const gracefulShutdown = async () => {
    try {
      logger.info('Initiating graceful shutdown...');

      // Stop accepting new connections
      await server.close();
      logger.info('Closed Fastify server.');

      // Disconnect Redis
      await redisClient.quit();
      logger.info('Disconnected Redis client.');

      // Disconnect Database
      if (dataSource?.isInitialized) {
        await dataSource.destroy();
        logger.info('Disconnected from PostgreSQL.');
      }

      // Shutdown OpenTelemetry SDK
      if (otelSDK) {
        await otelSDK.shutdown();
        logger.info('OpenTelemetry SDK shut down successfully.');
      }

      process.exit(0);
    } catch (err) {
      logger.error(err, 'Error during graceful shutdown');
      process.exit(1);
    }
  };

  // Handle termination signals
  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);
};

export default startServer;
