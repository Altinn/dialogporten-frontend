import { logger } from '@digdir/dialogporten-node-logger';
import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

const plugin: FastifyPluginAsync = async (fastify) => {
  logger.info('Setting up fastify headers');

  // Register the onSend hook directly
  fastify.addHook('onSend', async (_request, reply) => {
    // Main headers that are security headers to protect against common web vulnerabilities
    const securityHeaders: Record<string, string> = {
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
    };

    reply.headers(securityHeaders);
  });

  // Register the onRequest hook directly
  fastify.addHook('onRequest', (request, reply, done) => {
    if (request.headers['x-forwarded-proto'] === 'https') {
      request.session.cookie.secure = true;
    }
    done();
  });
};

export const fastifyHeaders = fp(plugin, {
  fastify: '5.x',
  name: 'fastify-headers',
});
