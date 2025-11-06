import { logger } from '@altinn/dialogporten-node-logger';
import { list, objectType, stringArg } from 'nexus';
import { SavedSearchRepository } from '../../db.ts';
import {
  getNotificationAddressByOrgNumber,
  getNotificationsettingsForCurrentUser,
  getOrCreateProfile,
  getUserFromCore,
} from '../functions/profile.ts';
import { getOrganizationsFromRedis } from './organization.ts';
import { OrganizationResponse } from './profile.ts';

export const Query = objectType({
  name: 'Query',
  definition(t) {
    t.field('profile', {
      type: 'Profile',
      resolve: async (_source, _args, ctx) => {
        const profile = await getOrCreateProfile(ctx);
        const user = await getUserFromCore(ctx);
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
          logger.error(error, 'Failed to fetch organizations from Redis:');
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

    t.field('notificationsettingsForCurrentUser', {
      type: list('NotificationSettingsResponse'),
      resolve: async (_source, _args, ctx) => {
        return (await getNotificationsettingsForCurrentUser(ctx)) ?? null;
      },
    });

    t.field('getNotificationAddressByOrgNumber', {
      type: OrganizationResponse,
      args: {
        orgnr: stringArg(),
      },
      resolve: async (_source, { orgnr }, ctx) => {
        if (orgnr) {
          return (await getNotificationAddressByOrgNumber(orgnr, ctx)) ?? null;
        }
        return null;
      },
    });
  },
});
