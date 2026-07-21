import { logger } from '@altinn/dialogporten-node-logger';
import { booleanArg, extendType, nonNull, stringArg } from 'nexus';
import config from '../../config.js';
import { Response } from '../shared/types.ts';
import { languageCodes, updateAltinnPersistentContextValue } from './languageCookie.ts';
import {
  addFavoriteParty,
  addFavoritePartyToGroup,
  deleteFavoriteParty,
  type PreselectedPartyOperationType,
  setPreSelectedParty,
  updateLanguageInCore,
  updateShowClientUnits,
  updateShowDeletedEntities,
} from './service.ts';

export const AddFavoriteParty = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('addFavoriteParty', {
      type: Response,
      args: {
        partyId: stringArg(),
      },
      resolve: async (_, { partyId }, ctx) => {
        try {
          await addFavoriteParty(ctx, partyId);
          return { success: true, message: 'FavoriteParty added successfully' };
        } catch (error) {
          logger.error(error, 'Failed to add favorite party:');
          return error;
        }
      },
    });
  },
});

export const AddFavoritePartyToGroup = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('addFavoritePartyToGroup', {
      type: Response,
      args: {
        partyId: stringArg(),
        groupName: stringArg(),
      },
      resolve: async (_, { partyId, groupName }, ctx) => {
        try {
          await addFavoritePartyToGroup(ctx.session.get('pid'), partyId, groupName);
          return { success: true, message: 'FavoriteParty added successfully' };
        } catch (error) {
          logger.error(error, 'Failed to add favorite party:');
          return error;
        }
      },
    });
  },
});

export const DeleteFavoriteParty = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('deleteFavoriteParty', {
      type: Response,
      args: {
        partyId: stringArg(),
      },
      resolve: async (_, { partyId }, ctx) => {
        try {
          await deleteFavoriteParty(ctx, partyId);
          return { success: true, message: 'Favorite Party deleted successfully' };
        } catch (error) {
          logger.error(error, 'Failed to delete favorite party:');
          return error;
        }
      },
    });
  },
});

export const UpdateLanguage = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('updateLanguage', {
      type: Response,
      args: {
        language: stringArg(),
      },
      resolve: async (_, { language }, ctx) => {
        try {
          await updateLanguageInCore(ctx, language);
          const ul = languageCodes[language];

          if (ul) {
            const current = ctx.request.raw.cookies?.altinnPersistentContext;
            const value = updateAltinnPersistentContextValue(current, ul);
            ctx.request.context.reply.setCookie('altinnPersistentContext', value, {
              path: '/',
              expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
              httpOnly: true,
              secure: true,
              domain: config.authContextCookieDomain,
              encode: (v: string) => v,
            });
          }

          return { success: true };
        } catch (error) {
          logger.error(error, 'Failed to update language:');
          return error;
        }
      },
    });
  },
});

export const SetShouldShowSubEntities = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('setShouldShowSubEntities', {
      type: Response,
      args: {
        shouldShowDeletedEntities: booleanArg(),
      },
      resolve: async (_, { shouldShowDeletedEntities }, ctx) => {
        try {
          await updateShowDeletedEntities(ctx, shouldShowDeletedEntities);
          return { success: true };
        } catch (error) {
          logger.error(error, 'Failed to update profile setting preference:');
          return { success: false, message: 'Failed to update profile setting preference' };
        }
      },
    });
  },
});

export const SetShowClientUnits = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('setShowClientUnits', {
      type: Response,
      args: {
        shouldShowClientUnits: booleanArg(),
      },
      resolve: async (_, { shouldShowClientUnits }, ctx) => {
        try {
          await updateShowClientUnits(ctx, shouldShowClientUnits);
          return { success: true };
        } catch (error) {
          logger.error(error, 'Failed to update profile setting preference:');
          return { success: false, message: 'Failed to update profile setting preference' };
        }
      },
    });
  },
});

export const SetPreSelectedParty = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('setPreSelectedParty', {
      type: Response,
      args: { partyUuid: stringArg(), operationType: nonNull(stringArg()) },
      resolve: async (_, { partyUuid, operationType }, ctx) => {
        if (!partyUuid) {
          return { success: false, message: 'partyUuid is required' };
        }
        if (operationType !== 'set' && operationType !== 'unset') {
          return { success: false, message: 'operationType must be "set" or "unset"' };
        }
        try {
          await setPreSelectedParty(ctx, partyUuid, operationType as PreselectedPartyOperationType);
          return { success: true, message: 'PreSelectedParty set successfully' };
        } catch (error) {
          logger.error(error, 'Failed to set preselected party:');
          return { success: false, message: 'Failed to set preselected party' };
        }
      },
    });
  },
});
