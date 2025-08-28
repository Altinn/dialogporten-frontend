import { list, objectType, stringArg } from 'nexus';
import config from '../../config.ts';
import { SavedSearchRepository } from '../../db.ts';
import { getNotificationsSettings, getOrCreateProfile, getUserFromCore } from '../functions/profile.ts';
import { getOrganizationsFromRedis } from './organization.ts';

export const Query = objectType({
  name: 'Query',
  definition(t) {
    t.field('profile', {
      type: 'Profile',
      resolve: async (_source, _args, ctx) => {
        const { disableProfile } = config;
        const profile = await getOrCreateProfile(ctx);
        const user = disableProfile ? [] : await getUserFromCore(ctx);
        const { language, groups, updatedAt } = profile;
        return {
          language,
          updatedAt,
          groups,
          user,
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

    t.field('notificationsettingsByUuid', {
      type: 'NotificationSettingsResponse',
      args: {
        uuid: stringArg(),
      },
      resolve: async (_source, { uuid }, ctx) => {
        const { disableProfile } = config;
        if (!disableProfile && uuid) {
          const result = await getNotificationsSettings(uuid, ctx);
          return result || null;
        }
        return null;
      },
    });
  },
});
