import http from 'node:http';
import https from 'node:https';
import type { Readable } from 'node:stream';
import { logger } from '@altinn/dialogporten-node-logger';
import axios from 'axios';
import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import config from '../config.js';

// Create dedicated HTTP agents for subscriptions with higher connection limits
// This isolates subscription connections from regular request connections
const httpAgent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: Number.POSITIVE_INFINITY, // Allow unlimited connections for subscriptions
  maxFreeSockets: 256,
});

const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: Number.POSITIVE_INFINITY, // Allow unlimited connections for subscriptions
  maxFreeSockets: 256,
});

// Create a dedicated axios instance for subscriptions with custom agents
const subscriptionAxios = axios.create({
  httpAgent,
  httpsAgent,
  timeout: 10000,
});

const plugin: FastifyPluginAsync = async (fastify) => {
  fastify.route({
    method: ['GET'],
    url: '/api/graphql/stream',
    preHandler: fastify.verifyToken(false),
    handler: async (request, reply) => {
      reply.raw.setHeader('Content-Type', 'text/event-stream');
      reply.raw.setHeader('Cache-Control', 'no-cache');
      reply.raw.setHeader('Connection', 'keep-alive');
      reply.raw.flushHeaders();

      reply.raw.write(': connected\n\n');

      const token = request.session.get('token');
      const { dialogId } = request.query as { dialogId: string };

      let upstreamStream: Readable | null = null;

      const cleanup = () => {
        if (upstreamStream) {
          try {
            upstreamStream.destroy();
            upstreamStream = null;
            logger.debug('Cleaned up upstream subscription stream', { dialogId });
          } catch (error) {
            logger.error(error, 'Error cleaning up upstream stream', { dialogId });
          }
        }
      };

      try {
        const response = await subscriptionAxios({
          method: 'POST',
          responseType: 'stream',
          url: config.dialogporten.graphqlSubscriptionUrl,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            Authorization: `Bearer ${token!.access_token}`,
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

        upstreamStream = response.data as Readable;

        // Handle upstream stream errors
        if (upstreamStream) {
          upstreamStream.on('error', (error) => {
            logger.error(error, 'Upstream subscription stream error', { dialogId });
            if (!reply.raw.destroyed) {
              reply.raw.write(`event: error\ndata: ${JSON.stringify({ message: 'Upstream stream error' })}\n\n`);
              reply.raw.end();
            }
            cleanup();
          });

          // Handle upstream stream end
          upstreamStream.on('end', () => {
            logger.debug('Upstream subscription stream ended', { dialogId });
            if (!reply.raw.destroyed) {
              reply.raw.end();
            }
            cleanup();
          });

          // Pipe upstream stream to client
          upstreamStream.pipe(reply.raw);
        }

        // Handle client disconnect
        request.raw.on('close', () => {
          logger.debug('Client disconnected from subscription', { dialogId });
          cleanup();
        });

        logger.debug('Subscription stream established', { dialogId });
      } catch (error) {
        logger.error(error, 'Failed to establish subscription stream', { dialogId });
        if (!reply.raw.destroyed) {
          reply.raw.write(`event: error\ndata: ${JSON.stringify({ message: 'Upstream error' })}\n\n`);
          reply.raw.end();
        }
        cleanup();
      }
    },
  });
};

export default fp(plugin, {
  fastify: '5.x',
  name: 'subscription-graphql',
});
