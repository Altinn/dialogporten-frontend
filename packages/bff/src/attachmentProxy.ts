import { logger } from '@altinn/dialogporten-node-logger';
import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

const plugin: FastifyPluginAsync = async (fastify) => {
  fastify.get<{
    Headers: { 'x-dialog-token'?: string; 'x-pdf-url'?: string };
  }>('/api/attachment', async (request, reply) => {
    try {
      const dialogToken = request.headers['x-dialog-token'];
      if (!dialogToken) {
        return reply.status(400).send({ error: 'Missing x-dialog-token' });
      }

      const upstreamUrl =
        request.headers['x-pdf-url'] ??
        'https://dialogporten-serviceprovider-ahb4fkchhgceevej.norwayeast-01.azurewebsites.net/attachment/sample.pdf';

      const upstreamRes = await fetch(upstreamUrl, {
        headers: {
          Authorization: `Bearer ${dialogToken}`,
          Accept: 'application/pdf',
        },
      });

      if (!upstreamRes.ok || !upstreamRes.body) {
        const text = await upstreamRes.text().catch(() => '');
        fastify.log.warn({ status: upstreamRes.status, text: text.slice(0, 500) }, 'Upstream attachment fetch failed');
        return reply.status(upstreamRes.status).send({ error: 'Upstream fetch failed' });
      }

      // Pass through relevant headers
      const contentType = upstreamRes.headers.get('content-type') ?? 'application/pdf';
      const contentLength = upstreamRes.headers.get('content-length');
      const contentDisposition = upstreamRes.headers.get('content-disposition') ?? 'inline; filename="attachment.pdf"';

      reply.header('Content-Type', contentType);
      reply.header('Content-Disposition', contentDisposition);
      if (contentLength) reply.header('Content-Length', contentLength);

      return reply.send(upstreamRes.body);
    } catch (error) {
      logger.error(error, 'Error proxying PDF');
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
};

export default fp(plugin, {
  fastify: '5.x',
  name: 'api-attachment-proxy',
});
