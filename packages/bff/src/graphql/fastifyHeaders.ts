import { logger } from '@digdir/dialogporten-node-logger';
import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

const plugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate('headers', () => {
    return async (request: FastifyRequest) => {
      try {
        fastify.addHook('onSend', async (request, reply) => {
          reply.headers({
            'HTTP-Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
            'X-Frame-Options': 'SAMEORIGIN',
            'X-Content-Type-Options': 'nosniff',
            'Content-Security-Policy': "default-src 'self'; script-src 'self'; object-src 'none'; img-src 'self';",
            'X-Permitted-Cross-Domain-Policies': 'none',
            'Referrer-Policy': 'no-referrer',
            'Cross-Origin-Embedder-Policy': 'require-corp',
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Resource-Policy': 'same-origin',
            'Permissions-Policy': 'none',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'X-XSS-Protection': '1; mode=block',
          });
        });
        // Middleware to set secure cookies based on X-Forwarded-Proto header
        fastify.addHook('onRequest', (request, reply, done) => {
          if (request.headers['x-forwarded-proto'] === 'https') {
            request.session.cookie.secure = true;
          }
          done();
        });
      } catch (e) {
        logger.error(e, 'Error setting headers');
        request.tokenIsValid = false;
      }
    };
  });
};

export const fastifyHeaders = fp(plugin, {
  fastify: '5.x',
  name: 'fastify-headers',
});
