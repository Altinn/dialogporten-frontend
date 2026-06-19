import { logger } from '@altinn/dialogporten-node-logger';
import { list, objectType, stringArg } from 'nexus';
import config from '../../config.js';
import { SavedSearchRepository } from '../../db.ts';
import { encryptPersonUrn } from '../../party/personUrnCipher.ts';
import {
  getNotificationAddressByOrgNumber,
  getNotificationsettingsForCurrentUser,
  getOrCreateProfile,
  getUserFromCore,
  getVerifiedAddresses,
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
        const { groups, updatedAt } = profile;

        const currentCookieLang = getLanguageFromAltinnContext(ctx.request.raw.cookies?.altinnPersistentContext);

        if (!user) {
          return { language: currentCookieLang ?? 'nb', updatedAt, groups, user };
        }

        const language = user.profileSettingPreference?.language ?? currentCookieLang ?? 'nb';

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

        return { language, updatedAt, groups, user };
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
        if (!SavedSearchRepository) return [];

        const searches = await SavedSearchRepository.createQueryBuilder('s')
          .where('s.profilePid = :pid', { pid })
          .orderBy("CASE WHEN s.name IS NULL OR s.name = '' THEN 1 ELSE 0 END", 'ASC')
          .addOrderBy('s.name', 'ASC')
          .addOrderBy('s.updatedAt', 'DESC')
          .getMany();

        for (const search of searches) {
          const urn = search.data?.urn;
          if (Array.isArray(urn)) {
            search.data.urn = urn.map((u) => encryptPersonUrn(u) as string);
          }
        }
        return searches;
      },
    });

    t.field('notificationsettingsForCurrentUser', {
      type: list('NotificationSettingsResponse'),
      resolve: async (_source, _args, ctx) => {
        return (await getNotificationsettingsForCurrentUser(ctx)) ?? null;
      },
    });

    t.field('verifiedAddresses', {
      type: list('VerifiedAddressResponse'),
      resolve: async (_source, _args, ctx) => {
        return (await getVerifiedAddresses(ctx)) ?? [];
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
