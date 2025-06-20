import { extendType, intArg, nonNull, stringArg } from 'nexus';
import {
  addFavoriteParty,
  addFavoritePartyToGroup,
  deleteFavoriteParty,
  getOrCreateProfile,
  updateLanguage,
} from '../functions/profile.ts';
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
          await addFavoriteParty(ctx.session.get('pid'), partyId);
          return { success: true, message: 'FavoriteParty added successfully' };
        } catch (error) {
          console.error('Failed to add favorite party:', error);
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
          console.error('Failed to add favorite party:', error);
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
        groupId: stringArg(),
      },
      resolve: async (_, { partyId, groupId }, ctx) => {
        try {
          await deleteFavoriteParty(ctx.session.get('pid'), partyId, groupId);
          return { success: true, message: 'Favorite Party deleted successfully' };
        } catch (error) {
          console.error('Failed to delete favorite party:', error);
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
          return { success: true };
        } catch (error) {
          console.error('Failed to update language:', error);
          return error;
        }
      },
    });
  },
});
