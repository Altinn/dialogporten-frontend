import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: './schema.ts',
  documents: ['queries/**/*.graphql'],
  generates: {
    './generated/sdk.ts': {
      plugins: [
        {
          add: {
            content: '/* eslint-disable */' + '\n' + '// @ts-nocheck',
          },
        },
        'typescript',
        'typescript-operations',
        'typescript-graphql-request',
      ],
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
