import { logger } from '@digdir/dialogporten-node-logger';
import axios from 'axios';
import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import config from '../config.js';

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

      const token = request.session.get('token');
      const { dialogId } = request.query as { dialogId: string };

      try {
        const response = await axios({
          method: 'POST',
          responseType: 'stream',
          url: config.dialogportenURL,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            Authorization: `Bearer ${token!.access_token}`,
            accept: 'text/event-stream',
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

        response.data.pipe(reply.raw);
      } catch (e) {
        console.error(e);
      }
    },
  });
};

export default fp(plugin, {
  fastify: '4.x',
  name: 'subscription-graphql',
});
