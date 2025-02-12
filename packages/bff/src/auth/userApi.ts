import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

const plugin: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/api/isAuthenticated',
    { preHandler: fastify.verifyToken(true) },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        if (request.tokenIsValid) {
          return reply.status(200).send({
            isAuthenticated: true,
          });
        }
        return reply.status(401).send({
          isAuthenticated: false,
        });
      } catch (_) {
        return reply.status(401).send({
          isAuthenticated: false,
        });
      }
    },
  );
};

export default fp(plugin, {
  fastify: '5.x',
  name: 'api-user',
});
