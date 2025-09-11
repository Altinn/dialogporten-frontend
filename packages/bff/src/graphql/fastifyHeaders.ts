import { logger } from '@digdir/dialogporten-node-logger';
import helmet from '@fastify/helmet';
import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

const plugin: FastifyPluginAsync = async (fastify) => {
  logger.info('Setting up fastify security headers with helmet');

  try {
    // Register helmet
    fastify.register(helmet, {
      // HTTP Strict Transport Security
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      // X-Frame-Options
      frameguard: {
        action: 'sameorigin',
      },
      // X-Content-Type-Options
      noSniff: true,
      // Content Security Policy
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          objectSrc: ["'none'"],
          imgSrc: ["'self'"],
        },
      },
      // Referrer Policy
      referrerPolicy: {
        policy: 'no-referrer',
      },
      // Cross-Origin Embedder Policy
      crossOriginEmbedderPolicy: {
        policy: 'require-corp',
      },
      // Cross-Origin Opener Policy
      crossOriginOpenerPolicy: {
        policy: 'same-origin',
      },
      // Cross-Origin Resource Policy
      crossOriginResourcePolicy: {
        policy: 'same-origin',
      },
      // X-XSS-Protection
      xssFilter: true,
    });

    // Add the custom headers that helmet doesn't cover
    fastify.addHook('onRequest', (request, reply, done) => {
      // Custom headers not covered by helmet
      const additionalSecurityHeaders = {
        'X-Permitted-Cross-Domain-Policies': 'none',
        'Permissions-Policy': 'none',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      };
      // Instrumentation headers
      const instrumentationHeaders = {
        'X-GraphQL-Operation': request.headers['x-graphql-operation'],
        'X-GraphQL-Start-Time': request.headers['x-graphql-start-time'],
      };
      reply.headers({
        ...additionalSecurityHeaders,
        ...instrumentationHeaders,
      });

      // Set secure cookie if HTTPS
      if (request.headers['x-forwarded-proto'] === 'https' && request.session) {
        request.session.cookie.secure = true;
      }

      done();
    });
  } catch (error) {
    logger.error(error, 'Failed to register security headers');
    throw error; // Re-throw to prevent server startup with compromised security
  }
};

export const fastifyHeaders = fp(plugin, {
  fastify: '5.x',
  name: 'fastify-headers',
});
