import { logger } from '@altinn/dialogporten-node-logger';
import helmet from '@fastify/helmet';
import { trace } from '@opentelemetry/api';
import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

const plugin: FastifyPluginAsync = async (fastify) => {
  logger.info('Setting up fastify security headers with helmet');

  try {
    // Register helmet with enhanced security configuration
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
      // Content Security Policy (enhanced)
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for UI components
          objectSrc: ["'none'"],
          imgSrc: ["'self'", 'data:', 'https:'], // Allow data URIs and HTTPS images
          fontSrc: ["'self'", 'https:', 'data:'], // Allow web fonts
          connectSrc: ["'self'"], // Allow same-origin connections
          frameSrc: ["'none'"], // Block all frames
          baseUri: ["'self'"], // Restrict base tag URLs
          formAction: ["'self'"], // Restrict form submissions
          upgradeInsecureRequests: [], // Force HTTPS
        },
      },
      // Referrer Policy
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
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
      // X-DNS-Prefetch-Control (privacy improvement)
      dnsPrefetchControl: {
        allow: false,
      },
      // X-Download-Options (IE security)
      ieNoOpen: true,
      // X-XSS-Protection (disabled per helmet recommendation)
      xssFilter: false,
      // Origin-Agent-Cluster (process isolation)
      originAgentCluster: true,
      // Remove X-Powered-By header
      hidePoweredBy: true,
    });

    // Add the custom headers that helmet doesn't cover
    fastify.addHook('onRequest', (request, reply, done) => {
      // Custom headers not covered by helmet
      const additionalSecurityHeaders = {
        'X-Permitted-Cross-Domain-Policies': 'none',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      };
      // Instrumentation headers
      const instrumentationHeaders = {
        'X-GraphQL-Operation': request.headers['x-graphql-operation'],
        'X-GraphQL-Start-Time': request.headers['x-graphql-start-time'],
      };

      const currentSpan = trace.getActiveSpan();
      if (currentSpan?.spanContext().traceId) {
        const traceId = currentSpan.spanContext().traceId;
        reply.header('X-Trace-Id', traceId);
      }

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
