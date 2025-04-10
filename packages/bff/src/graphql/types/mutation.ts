import { extendType, intArg, nonNull, stringArg } from 'nexus';
import { addFavoriteActor, deleteFavoriteActor, getOrCreateProfile } from '../functions/profile.ts';
import { createSavedSearch, deleteSavedSearch, updateSavedSearch } from '../functions/savedsearch.ts';
import { Response, SavedSearchInput, SavedSearches } from './index.ts';

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
          console.error('Failed to delete saved search:', error);
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
          console.error('Failed to updated saved search:', error);
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
          const profile = await getOrCreateProfile(ctx.session.get('pid'), ctx.session.get('locale'));
          return await createSavedSearch({ name, data, profile });
        } catch (error) {
          console.error('Failed to create saved search:', error);
          return error;
        }
      },
    });
  },
});

export const AddFavoriteActor = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('addFavoriteActor', {
      type: Response,
      args: {
        actorId: stringArg(),
      },
      resolve: async (_, { actorId }, ctx) => {
        try {
          await addFavoriteActor(ctx.session.get('pid'), actorId);
          return { success: true, message: 'FavoriteActor added successfully' };
        } catch (error) {
          console.error('Failed to create saved search:', error);
          return error;
        }
      },
    });
  },
});

export const DeleteFavoriteActor = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('deleteFavoriteActor', {
      type: Response,
      args: {
        actorId: stringArg(),
      },
      resolve: async (_, { actorId }, ctx) => {
        try {
          await deleteFavoriteActor(ctx.session.get('pid'), actorId);
          return { success: true, message: 'FavoriteActor deleted successfully' };
        } catch (error) {
          console.error('Failed to create saved search:', error);
          return error;
        }
      },
    });
  },
});
