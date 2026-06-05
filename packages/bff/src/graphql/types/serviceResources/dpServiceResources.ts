import { logger } from '@altinn/dialogporten-node-logger';
import axios from 'axios';
import { extendType, stringArg } from 'nexus';
import { type Context, getSessionToken } from '../../../auth/oidc.js';
import config from '../../../config.js';
import type { LocalizedText } from './resourceRegistry.ts';
import {
  type ServiceResourceResponseDTO,
  type TransformedServiceResource,
  getLocalizedTitle,
  getSupportedLanguage,
} from './serviceResources.js';

interface DpLocalization {
  languageCode: string;
  value: string;
}

interface DpServiceResourceItem {
  serviceResource: {
    id: string;
    name: DpLocalization[];
  };
  serviceOwner: {
    code: string;
  };
}

interface DpServiceResourcesResponse {
  data?: {
    serviceResources?: {
      items?: DpServiceResourceItem[];
    };
  };
  errors?: unknown;
}

const dpServiceResourcesQuery = `
  query DPServiceResources {
    serviceResources {
      items {
        serviceResource {
          id
          name {
            languageCode
            value
          }
        }
        serviceOwner {
          code
        }
      }
    }
  }
`;

function localizationsToLocalizedText(name: DpLocalization[]): LocalizedText {
  const title: LocalizedText = {};
  for (const { languageCode, value } of name) {
    if (languageCode && value) {
      title[languageCode as keyof LocalizedText] = value;
    }
  }
  return title;
}

function toAcceptLanguageHeader(langs: string[]): string {
  return langs.map((lang, index) => (index === 0 ? lang : `${lang};q=${(1 - index * 0.1).toFixed(1)}`)).join(', ');
}

async function fetchDpServiceResources(context: Context, langs: string[]): Promise<DpServiceResourceItem[]> {
  const token = getSessionToken(context);
  if (!token) {
    logger.error('No token found in session');
    return [];
  }
  const response = await axios({
    method: 'POST',
    url: config.dialogporten.graphqlUrl,
    timeout: 30000,
    headers: {
      'content-type': 'application/json',
      'Accept-Language': toAcceptLanguageHeader(langs),
      Authorization: `Bearer ${token.access_token}`,
    },
    data: JSON.stringify({ query: dpServiceResourcesQuery }),
  });

  const body = response.data as DpServiceResourcesResponse;
  if (body.errors) {
    logger.error(body.errors, 'Dialogporten serviceResources query returned errors');
    return [];
  }

  return body.data?.serviceResources?.items ?? [];
}

/**
 * Fetches service resources from Dialogporten on demand and reshapes the response
 * body into the same flat shape as RRServiceResourcesList ({ id, title, org }). Used for the
 * toolbar/saved-search filters.
 */
export async function getDpServiceResources(langs: string[], context: Context): Promise<ServiceResourceResponseDTO[]> {
  try {
    const items = await fetchDpServiceResources(context, langs);

    const resources: TransformedServiceResource[] = items.map((item) => ({
      id: item.serviceResource.id,
      title: localizationsToLocalizedText(item.serviceResource.name ?? []),
      org: (item.serviceOwner?.code ?? '').toLowerCase(),
      resourceType: '',
    }));

    return resources.map((r) => ({
      ...r,
      title: getLocalizedTitle(r.title, langs),
    }));
  } catch (error) {
    logger.error(error, 'Error retrieving Dialogporten service resources:');
    return [];
  }
}

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
