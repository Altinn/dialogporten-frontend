import { stitchSchemas } from '@graphql-tools/stitch';
import type { AsyncExecutor } from '@graphql-tools/utils';
import axios from 'axios';
import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { print } from 'graphql';
import depthLimit from 'graphql-depth-limit';
import { createHandler } from 'graphql-http/lib/use/fastify';
import config from '../config.ts';
import { bffSchema, dialogportenSchema } from './schema.ts';

const plugin: FastifyPluginAsync = async (fastify) => {
  const remoteExecutor: AsyncExecutor = async ({ document, variables, operationName, context }) => {
    const query = print(document);
    const token = context!.session.get('token');
    const response = await axios({
      method: 'POST',
      url: config.dialogporten.graphqlUrl,
      timeout: 30000,
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
    context(request, reply) {
      return {
        session: request.raw.session,
        request,
        reply,
      };
    },
    validationRules: [
      depthLimit(10), // Maximum query depth of 10 levels
    ],
  });

  fastify.post(
    '/api/graphql',
    {
      preHandler: (request, reply, callback) => {
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
