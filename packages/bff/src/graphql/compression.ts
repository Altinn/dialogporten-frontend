import type { FastifyCompressRouteOptions } from '@fastify/compress';

export const graphqlCompression: FastifyCompressRouteOptions['compress'] = {
  encodings: ['gzip'],
  threshold: 10240,
};
