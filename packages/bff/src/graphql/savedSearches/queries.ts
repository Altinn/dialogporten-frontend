import { extendType, list } from 'nexus';
import { encryptPersonUrn } from '../../party/personUrnCipher.ts';
import { listSavedSearches } from './service.ts';

export const SavedSearchesQuery = extendType({
  type: 'Query',
  definition(t) {
    t.field('savedSearches', {
      type: list('SavedSearches'),
      resolve: async (_source, _args, ctx) => {
        const pid = ctx.session.get('pid');
        const searches = await listSavedSearches(pid);

        for (const search of searches) {
          const urn = search.data?.urn;
          if (Array.isArray(urn)) {
            search.data.urn = urn.map((u) => encryptPersonUrn(u) as string);
          }
        }
        return searches;
      },
    });
  },
});
