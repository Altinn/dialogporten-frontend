import { setTimeout } from 'node:timers/promises';
import { logger } from '@altinn/dialogporten-node-logger';
import axios from 'axios';
import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import config from '../config.ts';
import { dataSource } from '../db.ts';
import redisClient from '../redisClient.ts';

/**
 * Health Check System
 *
 * - Provides a '/api/health' endpoint that:
 *   1. Runs all health checks concurrently with timeouts
 *   2. Calculates overall status ('ok', 'error', 'degraded')
 *   3. Measures total latency
 *   4. Returns JSON with overall status, individual check results, and latency
 * - Handles errors and returns 503 status if checks fail
 */

interface Props {
  version: string;
}

interface HealthCheckResult {
  status: 'ok' | 'error' | 'timeout';
  detail?: string;
  latency: number;
}

interface HealthChecksResponse {
  status: 'ok' | 'error' | 'degraded';
  healthChecks: Record<string, HealthCheckResult>;
  latency: number;
}

interface HealthCheck {
  name: string;
  checkFn: () => Promise<{ status: 'ok' | 'error'; detail?: string }>;
}

const HEALTH_CHECK_TIMEOUT = 60000;

const healthCheckList: HealthCheck[] = [
  {
    name: 'postgresql',
    checkFn: async () => {
      try {
        if (!dataSource!.isInitialized) {
          return { status: 'error', detail: 'PostgreSQL not connected' };
        }
        await dataSource!.query('SELECT 1');
        return { status: 'ok' };
      } catch (error) {
        logger.error(error, 'PostgreSQL health check failed');
        return { status: 'error', detail: 'PostgreSQL connection failed' };
      }
    },
  },
  {
    name: 'redis',
    checkFn: async () => {
      try {
        await redisClient.ping();
        return { status: 'ok' };
      } catch (error) {
        logger.error(error, 'Redis health check failed');
        return { status: 'error', detail: 'Redis connection failed' };
      }
    },
  },
  {
    name: 'oidc',
    checkFn: async () => {
      try {
        // todo: change to a URL we can use to check secret id and secret key
        await axios.get(`https://${config.oidc_url}/.well-known/openid-configuration`);
        return { status: 'ok' };
      } catch (error) {
        logger.error(error, 'OIDC health check failed');
        return { status: 'error', detail: 'OIDC URL unreachable' };
      }
    },
  },
  {
    name: 'dialogporten',
    checkFn: async () => {
      try {
        await axios.get(config.dialogporten.healthUrl);
        return { status: 'ok' };
      } catch (error) {
        logger.error(error, 'Dialogporten health check failed');
        return { status: 'error', detail: 'Dialogporten URL unreachable' };
      }
    },
  },
  // ... add more health checks here ...
];

const performCheck = async (
  name: string,
  checkFn: () => Promise<{ status: 'ok' | 'error'; detail?: string }>,
): Promise<HealthCheckResult> => {
  const start = Date.now();
  return Promise.race([
    checkFn().then(
      (result): HealthCheckResult => ({
        ...result,
        latency: Date.now() - start,
      }),
    ),
    setTimeout(HEALTH_CHECK_TIMEOUT).then(
      (): HealthCheckResult => ({
        status: 'timeout',
        detail: `${name} timed out`,
        latency: HEALTH_CHECK_TIMEOUT,
      }),
    ),
  ]);
};

const plugin: FastifyPluginAsync<Props> = async (fastify) => {
  fastify.get('/api/health', async (req, reply) => {
    const overallStart = Date.now();

    try {
      const healthChecks: Record<string, HealthCheckResult> = await Promise.all(
        healthCheckList.map(async ({ name, checkFn }) => {
          const result = await performCheck(name, checkFn);
          return [name, result] as const;
        }),
      ).then((results) => Object.fromEntries(results));

      const overallStatus: HealthChecksResponse['status'] = Object.values(healthChecks).every(
        (check) => check.status === 'ok',
      )
        ? 'ok'
        : Object.values(healthChecks).some((check) => check.status === 'error' || check.status === 'timeout')
          ? 'error'
          : 'degraded';

      const latency = Date.now() - overallStart;

      reply.status(200).send({ status: overallStatus, healthChecks, latency });
    } catch (error) {
      const errorMsg = 'Health check endpoint failed';
      logger.error(error, errorMsg);
      reply.status(503).send({ error: errorMsg });
    }
  });
};

export default fp(plugin, {
  fastify: '5.x',
  name: 'azure-healthprobs',
});
