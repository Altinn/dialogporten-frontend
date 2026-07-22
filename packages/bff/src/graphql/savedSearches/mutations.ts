import { logger } from '@altinn/dialogporten-node-logger';
import { extendType, intArg, nonNull, stringArg } from 'nexus';
import { decryptPersonUrn } from '../../party/personUrnCipher.ts';
import { getOrCreateProfile } from '../profile/service.ts';
import { Response } from '../shared/types.ts';
import { createSavedSearch, deleteSavedSearch, updateSavedSearch } from './service.ts';
import { SavedSearches, SavedSearchInput } from './types.ts';

export const DeleteSavedSearch = extendType({
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
          const resolvedData = {
            ...data,
            urn: Array.isArray(data.urn) ? data.urn.map((u: string) => decryptPersonUrn(u) as string) : data.urn,
          };
          return await createSavedSearch({ name, data: resolvedData, profile });
        } catch (error) {
          logger.error(error, 'Failed to create saved search:');
          return error;
        }
      },
    });
  },
});
