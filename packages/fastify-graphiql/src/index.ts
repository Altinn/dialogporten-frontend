import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';

type Options = {
  url: string; // e.g. "/api/graphiql"
  graphqlURL: string; // e.g. "/api/graphql"
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const graphiqlPlugin: FastifyPluginAsync<Options> = async (fastify, opts) => {
  const { url, graphqlURL } = opts;

  fastify.register(import('@fastify/static'), {
    root: join(__dirname, '../dist'),
    prefix: '/api/public/',
    decorateReply: false,
  });

  // Serve index.html with injected GraphQL URL
  fastify.get(url, (_, reply) => {
    const html = readFileSync(join(__dirname, '../dist/index.html'), 'utf8');
    reply.type('text/html').send(html.replace('__GRAPHQL_URL__', graphqlURL));
  });
};

export default fp(graphiqlPlugin, {
  name: 'fastify-graphiql',
  fastify: '5.x',
});
