import { schema_verified_graphql } from '@digdir/dialogporten-schema';
import { stitchSchemas } from '@graphql-tools/stitch';
import { buildSchema } from 'graphql/index.js';
import { makeSchema } from 'nexus';
import * as types from './nexusTypes.ts';

export const dialogportenSchema = buildSchema(schema_verified_graphql);
export const bffSchema = makeSchema({ types });
export const stichedSchema = stitchSchemas({
  subschemas: [bffSchema, dialogportenSchema],
});
