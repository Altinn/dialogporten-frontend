import { extendType, list } from 'nexus';
import { encryptSavedSearchUrns } from './personUrns.ts';
import { listSavedSearches } from './service.ts';

export const SavedSearchesQuery = extendType({
  type: 'Query',
  definition(t) {
    t.field('savedSearches', {
      type: list('SavedSearches'),
      resolve: async (_source, _args, ctx) => {
        const pid = ctx.session.get('pid');
        const searches = await listSavedSearches(pid);
        return searches.map(encryptSavedSearchUrns);
      },
    });
  },
});
