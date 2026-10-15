import { extendType, nonNull, stringArg } from 'nexus';
import { checkCorrespondenceForwarding } from './service.ts';
import { CorrespondenceForwardingCheck } from './types.ts';

export const CorrespondenceQuery = extendType({
  type: 'Query',
  definition(t) {
    t.nonNull.field('correspondenceForwardingCheck', {
      type: CorrespondenceForwardingCheck,
      args: {
        correspondenceId: nonNull(stringArg()),
      },
      resolve: async (_source, { correspondenceId }, ctx) => checkCorrespondenceForwarding(correspondenceId, ctx),
    });
  },
});
