import { logger } from '@altinn/dialogporten-node-logger';
import { list, objectType, stringArg } from 'nexus';
import config from '../../config.js';
import { SavedSearchRepository } from '../../db.ts';
import { getAltinn2messages } from '../functions/altinn2messages.ts';
import {
  getNotificationAddressByOrgNumber,
  getNotificationsettingsForCurrentUser,
  getOrCreateProfile,
  getUserFromCore,
} from '../functions/profile.ts';
import { getLanguageFromAltinnContext, languageCodes, updateAltinnPersistentContextValue } from './cookie.js';
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
        const languageFromAltinnContext = getLanguageFromAltinnContext(
          ctx.request.raw.cookies?.altinnPersistentContext,
        );

        // ensure the cookie uses the preferred language
        if (!languageFromAltinnContext) {
          const ul = languageCodes[language];
          if (ul) {
            const current = ctx.request.raw.cookies?.altinnPersistentContext;
            const value = updateAltinnPersistentContextValue(current, ul);
            ctx.request.context.reply.setCookie('altinnPersistentContext', value, {
              path: '/',
              domain: config.authContextCookieDomain,
              expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
              httpOnly: true,
              secure: true,
            });
          }
        }

        return {
          language: languageFromAltinnContext || language,
          updatedAt,
          groups,
          user,
        };
      },
    });
    t.field('altinn2messages', {
      type: list('Altinn2Message'),
      resolve: async (_source, _args, ctx) => {
        return await getAltinn2messages(ctx);
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
