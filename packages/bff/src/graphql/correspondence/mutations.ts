import { extendType, nonNull, stringArg } from 'nexus';
import { forwardCorrespondence } from './service.ts';
import { ForwardCorrespondenceResult } from './types.ts';

export const CorrespondenceMutation = extendType({
  type: 'Mutation',
  definition(t) {
    t.nonNull.field('forwardCorrespondence', {
      type: ForwardCorrespondenceResult,
      args: {
        correspondenceId: nonNull(stringArg()),
        dialogToken: nonNull(stringArg()),
        forwardTo: nonNull(stringArg()),
        forwardingText: stringArg(),
      },
      resolve: async (_source, args) => forwardCorrespondence(args),
    });
  },
});
