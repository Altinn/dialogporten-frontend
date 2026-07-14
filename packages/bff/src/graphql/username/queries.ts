import { extendType, stringArg } from 'nexus';
import { getUsername } from './service.ts';
import { UsernameResponse } from './types.ts';

export const UsernameQuery = extendType({
  type: 'Query',
  definition(t) {
    t.field('partyUsername', {
      type: UsernameResponse,
      args: {
        partyUuid: stringArg(),
      },
      resolve: async (_source, { partyUuid }) => {
        if (!partyUuid) {
          return null;
        }
        return { username: await getUsername(partyUuid) };
      },
    });
  },
});
