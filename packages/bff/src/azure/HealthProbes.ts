import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import config from '../config';

const plugin: FastifyPluginAsync = async (fastify, options) => {
  const startTimeStamp = new Date();
  const secondsAfterStart = (new Date().getTime() - startTimeStamp.getTime()) / 1000;

  console.log(`${config.version} starting /api/readiness probe after ${secondsAfterStart} seconds`);
  fastify.get('/api/readiness', (req: FastifyRequest, reply: FastifyReply) => {
    reply.status(200);
  });

  console.log(`${config.version} starting /api/liveness probe after ${secondsAfterStart} seconds`);
  fastify.get('/api/liveness', (req: FastifyRequest, reply: FastifyReply) => {
    reply.status(200);
  });
};

export default fp(plugin, {
  fastify: '4.x',
  name: 'azure-healthprobs',
});
