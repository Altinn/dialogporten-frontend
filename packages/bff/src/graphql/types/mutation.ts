import { logger } from '@altinn/dialogporten-node-logger';
import { booleanArg, extendType, intArg, nonNull, stringArg } from 'nexus';
import config from '../../config.js';
import {
  addFavoriteParty,
  addFavoritePartyToGroup,
  deleteFavoriteParty,
  deleteNotificationsSetting,
  getOrCreateProfile,
  updateLanguage,
  updateNotificationsSetting,
  updateProfileSettingPreference,
} from '../functions/profile.ts';
import { createSavedSearch, deleteSavedSearch, updateSavedSearch } from '../functions/savedsearch.ts';
import { languageCodes, updateAltinnPersistentContextValue } from './cookie.js';
import { NotificationSettingsInput, Response, SavedSearchInput, SavedSearches } from './index.ts';

export const Mutation = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('deleteSavedSearch', {
      type: Response,
      args: {
        id: nonNull(intArg()),
      },
      resolve: async (_, args) => {
        const { id } = args;
        try {
          const result = await deleteSavedSearch(id);
          return { success: result?.affected && result?.affected > 0, message: 'Saved search deleted successfully' };
        } catch (error) {
          logger.error(error, 'Failed to delete saved search:');
          return { success: false, message: 'Failed to delete saved search' };
        }
      },
    });
  },
});

export const UpdateSavedSearch = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('updateSavedSearch', {
      type: Response,
      args: {
        id: nonNull(intArg()),
        name: stringArg(),
      },
      resolve: async (_, args) => {
        const { id, name } = args;
        try {
          await updateSavedSearch(id, name);
          return { success: true, message: 'Saved search updated successfully' };
        } catch (error) {
          logger.error(error, 'Failed to updated saved search:');
          return { success: false, message: 'Failed to updated saved search' };
        }
      },
    });
  },
});

export const CreateSavedSearch = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('createSavedSearch', {
      type: SavedSearches,
      args: {
        name: stringArg(),
        data: SavedSearchInput,
      },
      resolve: async (_, { name, data }, ctx) => {
        try {
          const profile = await getOrCreateProfile(ctx);
          if (!profile) {
            throw new Error('Profile not found or could not be created');
          }
          if (!data) {
            throw new Error('Data are required to create a saved search');
          }
          return await createSavedSearch({ name, data, profile });
        } catch (error) {
          logger.error(error, 'Failed to create saved search:');
          return error;
        }
      },
    });
  },
});

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

export const UpdateNotificationSetting = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('updateNotificationSetting', {
      type: Response,
      args: {
        data: NotificationSettingsInput,
      },
      resolve: async (_, { data }, ctx) => {
        try {
          const response = await updateNotificationsSetting(data, ctx);
          if (typeof response !== 'undefined') {
            return { success: true, message: 'NotificationSetting updated successfully' };
          }
          return { success: false, message: 'NotificationSetting updated failed' };
        } catch (error) {
          logger.error(error, 'Failed to update NotificationSetting:');
          return error;
        }
      },
    });
  },
});

export const DeleteNotificationSetting = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('deleteNotificationSetting', {
      type: Response,
      args: {
        partyUuid: stringArg(),
      },
      resolve: async (_, { partyUuid }, ctx) => {
        try {
          await deleteNotificationsSetting(partyUuid, ctx);
          return { success: true, message: 'NotificationSetting deleted successfully' };
        } catch (error) {
          logger.error(error, 'Failed to delete NotificationSetting:');
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
          const pid = ctx.session.get('pid');
          await updateLanguage(pid, language);
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

export const UpdateProfileSettingPreference = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('updateProfileSettingPreference', {
      type: Response,
      args: {
        shouldShowDeletedEntities: booleanArg(),
      },
      resolve: async (_, { shouldShowDeletedEntities }, ctx) => {
        try {
          await updateProfileSettingPreference(ctx, shouldShowDeletedEntities);
          return { success: true };
        } catch (error) {
          logger.error(error, 'Failed to update profile setting preference:');
          return { success: false, message: 'Failed to update profile setting preference' };
        }
      },
    });
  },
});
