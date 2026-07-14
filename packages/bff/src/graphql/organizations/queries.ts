import { extendType } from 'nexus';
import { getOrganizationsFromRedis } from './service.ts';

export const OrganizationQuery = extendType({
  type: 'Query',
  definition(t) {
    t.list.field('organizations', {
      type: 'Organization',
      description: 'List of organizations',
      resolve: async () => {
        return await getOrganizationsFromRedis();
      },
    });
  },
});
