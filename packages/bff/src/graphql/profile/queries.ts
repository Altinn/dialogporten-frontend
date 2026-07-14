import { extendType } from 'nexus';
import config from '../../config.js';
import { getLanguageFromAltinnContext, languageCodes, updateAltinnPersistentContextValue } from './languageCookie.ts';
import { getOrCreateProfile, getUserFromCore } from './service.ts';

export const ProfileQuery = extendType({
  type: 'Query',
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
  },
});
