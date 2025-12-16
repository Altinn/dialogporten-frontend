import { logger } from '@altinn/dialogporten-node-logger';
import axios from 'axios';
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

const plugin: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/api/attachment',
    { preHandler: fastify.verifyToken(true) },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const startTime = Date.now();
      logger.info({ method: request.method, url: request.url }, 'Attachment proxy request received');

      try {
        const query = request.query as { url?: string; dialogToken?: string };
        const url = query.url;
        const dialogToken = query.dialogToken;

        logger.debug(
          {
            url: url ? decodeURIComponent(url) : undefined,
            hasDialogToken: !!dialogToken,
            dialogTokenLength: dialogToken?.length,
          },
          'Decoded query parameters',
        );

        if (!url) {
          logger.warn('Missing url parameter in attachment proxy request');
          return reply.status(400).send({ error: 'Missing url parameter' });
        }

        const decodedUrl = decodeURIComponent(url);
        logger.info({ targetUrl: decodedUrl, hasDialogToken: !!dialogToken }, 'Fetching attachment from external URL');

        // Try multiple authentication strategies
        // Strategy 1: Use dialogToken with Bearer auth
        // Strategy 2: Use only cookies (like browser does)
        // Strategy 3: Use session token with Bearer auth

        const cookieHeader = request.headers.cookie;
        logger.debug({ hasCookies: !!cookieHeader, cookieLength: cookieHeader?.length }, 'Cookie check');

        // Build headers - prioritize cookies since browser downloads work with just cookies
        const headers: Record<string, string> = {};

        // Always forward cookies (browser downloads work with just cookies)
        if (cookieHeader) {
          headers.Cookie = cookieHeader;
          logger.debug({ cookieCount: cookieHeader.split(';').length }, 'Forwarding cookies from request');
        }

        // Try without Bearer token first (since browser downloads work with just cookies)
        // Only add Bearer token if cookies are not available
        if (!cookieHeader) {
          if (dialogToken) {
            headers.Authorization = `Bearer ${dialogToken}`;
            headers.credentials = 'include';
            logger.debug('No cookies available, using dialogToken for Bearer authentication');
          } else {
            const token = request.session.get('token');
            if (token?.access_token) {
              headers.Authorization = `Bearer ${token.access_token}`;
              logger.debug('No cookies available, using session token for Bearer authentication');
            }
          }
        } else {
          logger.debug('Using cookies for authentication (no Bearer token)');
        }

        // Fetch PDF from the external URL
        const axiosConfig = {
          method: 'GET' as const,
          url: decodedUrl,
          headers,
          responseType: 'stream' as const,
          timeout: 30000,
          maxRedirects: 5,
          validateStatus: (status: number) => status < 400, // Don't throw on 3xx redirects
        };

        logger.debug(
          {
            hasAuthHeader: !!headers.Authorization,
            hasCookieHeader: !!headers.Cookie,
            authHeaderLength: headers.Authorization?.length,
          },
          'Request headers prepared',
        );

        const response = await axios(axiosConfig);

        const contentType = response.headers['content-type'] || 'application/pdf';
        logger.info(
          {
            status: response.status,
            statusText: response.statusText,
            contentType,
            contentLength: response.headers['content-length'],
            contentDisposition: response.headers['content-disposition'],
          },
          'External request successful',
        );

        // Validate that we received a PDF, not HTML (which indicates auth failure)
        if (!contentType.includes('pdf') && contentType.includes('html')) {
          // Read first chunk to see what we actually got
          let firstChunk = '';
          const chunks: Buffer[] = [];
          response.data.on('data', (chunk: Buffer) => {
            if (chunks.length === 0) {
              chunks.push(chunk);
              firstChunk = chunk.toString('utf-8', 0, Math.min(500, chunk.length));
            }
          });

          // Wait a bit to get first chunk
          await new Promise((resolve) => setTimeout(resolve, 100));

          logger.error(
            {
              contentType,
              targetUrl: decodedUrl,
              status: response.status,
              firstChunk: firstChunk.substring(0, 200),
              usingDialogToken: !!dialogToken,
            },
            'Received HTML instead of PDF - authentication likely failed',
          );

          // Destroy the stream since we're not using it
          response.data.destroy();

          return reply.status(401).send({
            error: 'Authentication failed - received HTML instead of PDF',
            details:
              'The server returned an HTML page instead of the PDF file. This usually indicates an authentication failure.',
          });
        }

        // Set appropriate headers
        reply.header('Content-Type', contentType);
        reply.header('Content-Disposition', response.headers['content-disposition'] || 'inline');
        reply.header('Access-Control-Allow-Origin', request.headers.origin || '*');
        reply.header('Access-Control-Allow-Credentials', 'true');

        const duration = Date.now() - startTime;
        logger.info({ duration, contentType }, 'Sending attachment response');

        return reply.send(response.data);
      } catch (error) {
        const duration = Date.now() - startTime;
        if (axios.isAxiosError(error)) {
          const status = error.response?.status || 500;
          logger.error(
            {
              error: error.message,
              status,
              statusText: error.response?.statusText,
              responseData: error.response?.data,
              duration,
            },
            'Axios error in attachment proxy',
          );
          return reply.status(status).send({
            error: error.response?.statusText || 'Failed to fetch attachment',
          });
        }
        logger.error({ error, duration }, 'Unexpected error in attachment proxy');
        return reply.status(500).send({ error: 'Internal server error' });
      }
    },
  );
};

export default fp(plugin, {
  fastify: '5.x',
  name: 'api-attachment-proxy',
});
