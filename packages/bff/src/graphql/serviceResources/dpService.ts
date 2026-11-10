import { logger } from '@altinn/dialogporten-node-logger';
import axios from 'axios';
import { type Context, getSessionToken } from '../../auth/oidc.js';
import config from '../../config.js';
import type { LocalizedText } from './registryTypes.ts';
import {
  getLocalizedTitle,
  type ServiceResourceResponseDTO,
  sortServiceResourcesByTitle,
  type TransformedServiceResource,
} from './service.ts';

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
    throw new Error('No token found in session');
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
    throw new Error('Dialogporten serviceResources query returned errors', { cause: body.errors });
  }

  return body.data?.serviceResources?.items ?? [];
}

/**
 * Fetches service resources from Dialogporten on demand and reshapes the response
 * body into the same flat shape as RRServiceResourcesList ({ id, title, org }). Used for the
 * toolbar/saved-search filters.
 *
 * Throws on failure instead of returning an empty list, so the frontend doesn't cache an empty service
 * filter as a successful result. The thrown message reaches the client, so it stays generic; the details
 * are logged here.
 */
export async function getDpServiceResources(langs: string[], context: Context): Promise<ServiceResourceResponseDTO[]> {
  try {
    const items = await fetchDpServiceResources(context, langs);

    const resources: Omit<TransformedServiceResource, 'resourceType' | 'status'>[] = items.map((item) => ({
      id: item.serviceResource.id,
      title: localizationsToLocalizedText(item.serviceResource.name ?? []),
      org: (item.serviceOwner?.code ?? '').toLowerCase(),
    }));

    return sortServiceResourcesByTitle(
      resources.map((r) => ({
        ...r,
        title: getLocalizedTitle(r.title, langs),
      })),
      langs[0],
    );
  } catch (error) {
    logger.error({ err: error, cause: (error as Error).cause }, 'Error retrieving Dialogporten service resources:');
    throw new Error('Failed to retrieve service resources from Dialogporten');
  }
}
