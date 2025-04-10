import { list, objectType } from 'nexus';
import { SavedSearchRepository } from '../../db.ts';
import { getOrCreateProfile } from '../functions/profile.ts';
import { getOrganizationsFromRedis } from './organization.ts';

export const Query = objectType({
  name: 'Query',
  definition(t) {
    t.field('profile', {
      type: 'Profile',
      resolve: async (_source, _args, ctx) => {
        const pid = ctx.session.get('pid');
        const locale = ctx.session.get('locale');
        const profile = await getOrCreateProfile(pid, locale);
        const { favoriteActors, language, updatedAt } = profile;
        return {
          language,
          updatedAt,
          favoriteActors,
        };
      },
    });

    t.field('organizations', {
      type: list('Organization'),
      resolve: async () => {
        try {
          return await getOrganizationsFromRedis();
        } catch (error) {
          console.error('Failed to fetch organizations from Redis:', error);
          throw new Error('Failed to fetch organizations');
        }
      },
    });

    t.field('savedSearches', {
      type: list('SavedSearches'),
      resolve: async (_source, _args, ctx) => {
        const pid = ctx.session.get('pid');
        if (SavedSearchRepository) {
          return await SavedSearchRepository.find({
            where: { profile: { pid } },
            order: { updatedAt: 'DESC' },
          });
        }
        return [];
      },
    });
  },
});
