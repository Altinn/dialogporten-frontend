import { extendType, list, stringArg } from 'nexus';
import { getDpServiceResources } from './dpService.ts';
import { getServiceResourcesFromRedis, getSupportedLanguage } from './service.ts';

export const ServiceResourceQuery = extendType({
  type: 'Query',
  definition(t) {
    t.list.field('RRServiceResourcesList', {
      type: 'ServiceResource',
      description: 'List of service resources from Altinn resource registry',
      args: {
        resourceType: list(
          stringArg({
            description: 'Filter by resource types',
          }),
        ),
        ids: list(
          stringArg({
            description: 'Filter by resource identifiers',
          }),
        ),
        org: list(
          stringArg({
            description: 'Filter by organization codes',
          }),
        ),
        lang: stringArg({ description: 'Preferred language for title', default: 'nb' }),
      },
      resolve: async (_, args) => {
        const preferredLangs = getSupportedLanguage('nb', args.lang);

        const filters: {
          resourceType?: string[];
          ids?: string[];
          org?: string[];
        } = {};

        if (args.resourceType) {
          filters.resourceType = args.resourceType.filter(
            (type: string | null | undefined): type is string => type !== null && type !== undefined,
          );
        }

        if (args.ids) {
          filters.ids = args.ids.filter(
            (id: string | null | undefined): id is string => id !== null && id !== undefined,
          );
        }

        if (args.org) {
          filters.org = args.org.filter(
            (orgCode: string | null | undefined): orgCode is string => orgCode !== null && orgCode !== undefined,
          );
        }

        return await getServiceResourcesFromRedis(
          preferredLangs,
          Object.keys(filters).length > 0 ? filters : undefined,
        );
      },
    });
  },
});

export const DpServiceResourceQuery = extendType({
  type: 'Query',
  definition(t) {
    t.list.field('DPServiceResourcesList', {
      type: 'ServiceResource',
      description: 'List of service resources from Dialogporten, used for filtering dialogs by service',
      args: {
        lang: stringArg({ description: 'Preferred language for title', default: 'nb' }),
      },
      resolve: async (_, args, context) => {
        const preferredLangs = getSupportedLanguage('nb', args.lang);
        return await getDpServiceResources(preferredLangs, context);
      },
    });
  },
});
