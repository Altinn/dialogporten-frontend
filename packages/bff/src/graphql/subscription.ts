import * as http from 'node:http';
import * as https from 'node:https';
import type { Readable } from 'node:stream';
import { logger } from '@altinn/dialogporten-node-logger';
import axios from 'axios';
import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import config from '../config.js';
import { decrementActiveConnections, getActiveConnections, incrementActiveConnections } from './activeConnections.ts';

const httpAgent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: Number.POSITIVE_INFINITY,
  maxFreeSockets: 256,
});

const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: Number.POSITIVE_INFINITY,
  maxFreeSockets: 256,
});

const subscriptionAxios = axios.create({
  httpAgent,
  httpsAgent,
  timeout: 0,
});

const plugin: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/debug/connections', async () => {
    return { active: await getActiveConnections() };
  });

  fastify.route({
    method: ['GET'],
    url: '/api/graphql/stream',
    preHandler: fastify.verifyToken(false),
    handler: async (request, reply) => {
      const { dialogId } = request.query as { dialogId?: string };

      if (!dialogId) {
        return reply.status(400).send({ message: 'Missing dialogId' });
      }

      const token = request.session.get('token');
      if (!token?.access_token) {
        return reply.status(401).send({ message: 'Missing access token' });
      }

      reply.hijack();

      reply.raw.setHeader('Content-Type', 'text/event-stream');
      reply.raw.setHeader('Cache-Control', 'no-cache');
      reply.raw.setHeader('Connection', 'keep-alive');
      reply.raw.flushHeaders();

      const controller = new AbortController();
      let closed = false;
      let upstream: Readable | null = null;
      let connectionName: number | null = null;

      const cleanup = async () => {
        if (closed) return;
        closed = true;

        if (connectionName !== null) {
          await decrementActiveConnections();
        }

        if (upstream && !upstream.destroyed) {
          upstream.destroy();
        }

        controller.abort();
      };

      request.raw.on('close', cleanup);
      request.raw.on('aborted', cleanup);

      try {
        const response = await subscriptionAxios({
          method: 'POST',
          responseType: 'stream',
          url: config.dialogporten.graphqlSubscriptionUrl,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            Authorization: `Bearer ${token.access_token}`,
            Accept: 'text/event-stream',
            'digdir-dialog-token': request.headers['digdir-dialog-token'],
          },
          data: JSON.stringify({
            query: `subscription sub {
              dialogEvents(dialogId: "${dialogId}") {
                id
                type
              }
            }`,
            variables: {},
            operationName: 'sub',
          }),
        });

        const stream = response.data as Readable;

        if (closed) {
          if (!stream.destroyed) {
            stream.destroy();
          }
          return;
        }

        connectionName = Math.random();
        await incrementActiveConnections();

        upstream = stream;

        const cleanupAndLogError = (err: Error) => {
          logger.warn({ err }, `Error on SSE reply stream for dialogId=${dialogId}`);
          void cleanup();
        };

        stream.pipe(reply.raw);

        reply.raw.on('close', cleanup);
        reply.raw.on('finish', cleanup);
        reply.raw.on('error', cleanupAndLogError);

        stream.on('error', (err: Error) => {
          logger.warn({ err }, `Error on upstream SSE for dialogId=${dialogId}`);
          try {
            reply.raw.write('event: error\ndata: "upstream-error"\n\n');
          } catch {}
          void cleanup();
          try {
            reply.raw.end();
          } catch {}
        });
      } catch (e: unknown) {
        if (closed) {
          logger.info({ err: e }, `Upstream SSE aborted for dialogId=${dialogId}`);
          return;
        }

        if (axios.isAxiosError(e)) {
          logger.error(
            {
              err: e,
              status: e.response?.status,
              data: e.response?.data,
              headers: e.response?.headers,
            },
            `Error establishing upstream SSE for dialogId=${dialogId}`,
          );
        } else {
          logger.error({ err: e }, `Error establishing upstream SSE for dialogId=${dialogId}`);
        }

        try {
          reply.raw.end();
        } catch {}
      }
    },
  });
};

export default fp(plugin, {
  fastify: '5.x',
  name: 'subscription-graphql',
});
