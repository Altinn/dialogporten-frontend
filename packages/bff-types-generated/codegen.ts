import type { CodegenConfig } from '@graphql-codegen/cli';

const scalars = {
  DateTime: 'string',
  URL: 'string',
  UUID: 'string',
};

const config: CodegenConfig = {
  schema: './schema.ts',
  documents: ['queries/**/*.graphql'],
  generates: {
    './generated/schema-types.ts': {
      plugins: [
        {
          add: {
            content: '/* eslint-disable */' + '\n' + '// @ts-nocheck',
          },
        },
        'typescript',
      ],
      config: {
        scalars,
      },
    },
    './generated/sdk.ts': {
      plugins: [
        {
          add: {
            content: '/* eslint-disable */' + '\n' + '// @ts-nocheck',
          },
        },
        'typescript-operations',
        'typescript-graphql-request',
      ],
      config: {
        scalars,
        importSchemaTypesFrom: './generated/schema-types',
      },
    },
    './generated/schema.graphql': {
      plugins: ['schema-ast'],
      config: {
        includeIntrospectionTypes: false,
      },
    },
  },
};

export default config;
