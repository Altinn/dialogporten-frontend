import { stitchSchemas } from '@graphql-tools/stitch';
import type { AsyncExecutor } from '@graphql-tools/utils';
import axios from 'axios';
import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { print } from 'graphql';
import { createHandler } from 'graphql-http/lib/use/fastify';
import config from '../config.ts';
import { bffSchema, dialogportenSchema } from './schema.ts';

const plugin: FastifyPluginAsync = async (fastify) => {
  console.info('Registering GraphQL API plugin', config.dialogportenURL);
  const remoteExecutor: AsyncExecutor = async ({ document, variables, operationName, context }) => {
    const query = print(document);
    const token = context!.session.get('token');
    const response = await axios({
      method: 'POST',
      url: config.dialogportenURL,
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${token.access_token}`,
      },
      data: JSON.stringify({ query, variables, operationName }),
    });

    return response.data;
  };

  const remoteExecutorSubschema = {
    schema: dialogportenSchema,
    executor: remoteExecutor,
  };

  const stitchedSchema = stitchSchemas({
    subschemas: [remoteExecutorSubschema, bffSchema],
  });

  const handler = createHandler({
    schema: stitchedSchema,
    context(request) {
      return {
        session: request.raw.session,
      };
    },
  });

  fastify.post(
    '/api/graphql',
    {
      preHandler: (request: FastifyRequest, reply, callback) => {
        /* Allow refresh to keep access token alive if request is from GraphQL IDE */
        const shouldVerifyToken = request.headers.referer?.includes('/api/graphiql') ?? false;
        return fastify.verifyToken(shouldVerifyToken)(request, reply, callback);
      },
    },
    async (request, reply) => {
      await handler.call(fastify, request, reply);
      return reply;
    },
  );
};

export default fp(plugin, {
  fastify: '5.x',
  name: 'api-graphql',
});
