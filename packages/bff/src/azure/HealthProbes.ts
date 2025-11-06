import { logger } from '@altinn/dialogporten-node-logger';
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

interface Props {
  version: string;
}

const plugin: FastifyPluginAsync<Props> = async (fastify, options) => {
  const { version } = options;
  const startTimeStamp = Date.now();
  const secondsAfterStart = (Date.now() - startTimeStamp) / 1000;

  logger.info(`${version} starting /api/readiness probe after ${secondsAfterStart} seconds`);
  fastify.get('/api/readiness', async (req, reply) => {
    reply.status(200).send();
  });

  logger.info(`${version} starting /api/liveness probe after ${secondsAfterStart} seconds`);
  fastify.get('/api/liveness', async (req, reply) => {
    reply.status(200).send();
  });
};

export default fp(plugin, {
  fastify: '5.x',
  name: 'azure-healthprobs',
});
