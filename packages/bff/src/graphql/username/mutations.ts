import { logger } from '@altinn/dialogporten-node-logger';
import { extendType, stringArg } from 'nexus';
import { Response } from '../shared/types.ts';
import { setUsername } from './service.ts';

const USERNAME_PATTERN = /^[a-z][a-z0-9._@-]{5,63}$/i;
const NATIONAL_IDENTITY_NUMBER_PATTERN = /^\d{11}$/;

export const SetUsername = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('setUsername', {
      type: Response,
      // username: null clears the current username
      args: { username: stringArg() },
      resolve: async (_, { username }, ctx) => {
        const pid = ctx.session.get('pid');
        if (typeof pid !== 'string' || !pid) {
          return { success: false, message: 'No pid in session' };
        }

        // This functionality is however not supported in frontend
        if (!NATIONAL_IDENTITY_NUMBER_PATTERN.test(pid)) {
          return { success: false, message: 'Setting username is not supported for this user' };
        }

        if (username !== null && username !== undefined && !USERNAME_PATTERN.test(username)) {
          return {
            success: false,
            message:
              'Username must be 6-64 characters long, start with a letter, and can only contain letters, digits, dots, underscores, hyphens or @ signs.',
          };
        }

        const party = `urn:altinn:person:identifier-no:${pid}`;

        try {
          return await setUsername(party, username ?? null);
        } catch (error) {
          logger.error(error, 'Failed to set username:');
          return { success: false, message: 'Failed to set username' };
        }
      },
    });
  },
});
