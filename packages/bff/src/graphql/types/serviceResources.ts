import { logger } from '@altinn/dialogporten-node-logger';
import { booleanArg, extendType, list, objectType, stringArg } from 'nexus';
import config from '../../config.js';
import type { LocalizedText, Resource } from './resourceRegistry.ts';

interface TransformedServiceResource {
  id: string;
  title: LocalizedText;
  orgCode: string;
  resourceType: string;
  selfIdentifiedUserEnabled: boolean;
}

const serviceResourcesRedisKey = 'arbeidsflate-service-resources:v1';
let refreshTimer: NodeJS.Timeout | null = null;

async function fetchServiceResources(): Promise<Resource[]> {
  try {
    const response = await fetch(
      config.platformBaseURL + '/resourceregistry/api/v1/resource/resourcelist?includeAltinn2=true&includeApps=true',
    );
    if (!response.ok) {
      logger.error(`Network response was not ok: ${response.status} ${response.statusText}`);
      return [];
    }
    const data = await response.json();
    if (Array.isArray(data)) {
      return data as Resource[];
    }
    logger.error(`fetchServiceResources: Data is not an array`);
    return [];
  } catch (error) {
    logger.error(error, 'There was a problem with the fetch operation for service resources:');
    throw error;
  }
}

async function storeServiceResourcesInRedis(): Promise<TransformedServiceResource[]> {
  try {
    const { default: redisClient } = await import('../../redisClient.ts');
    const serviceResources = await fetchServiceResources();

    const transformedResources = serviceResources.map((resource) => ({
      id: resource.identifier,
      title: resource.title,
      orgCode: resource.hasCompetentAuthority?.orgcode || '',
      resourceType: resource.resourceType,
      selfIdentifiedUserEnabled: resource.selfIdentifiedUserEnabled || false,
    }));

    await redisClient.set(serviceResourcesRedisKey, JSON.stringify(transformedResources), 'EX', 60 * 60 * 24); // Store for 24 hours

    return transformedResources;
  } catch (error) {
    logger.error(error, 'Error storing service resources in Redis:');
    // Return empty array on error, keeping old data if it exists
    return [];
  }
}

export async function getServiceResourcesFromRedis(filters?: {
  resourceType?: string[];
  ids?: string[];
  org?: string[];
  onlySelfIdentifiedUserEnabled?: boolean;
}): Promise<TransformedServiceResource[]> {
  try {
    const { default: redisClient } = await import('../../redisClient.ts');
    const data = await redisClient.get(serviceResourcesRedisKey);
    let resources: TransformedServiceResource[];

    if (data) {
      resources = JSON.parse(data);
    } else {
      resources = await storeServiceResourcesInRedis();
    }

    // Apply filters if provided
    if (filters) {
      if (filters.resourceType && filters.resourceType.length > 0) {
        resources = resources.filter((resource) => filters.resourceType!.includes(resource.resourceType));
      }
      if (filters.ids && filters.ids.length > 0) {
        resources = resources.filter((resource) => filters.ids!.includes(resource.id));
      }
      if (filters.org && filters.org.length > 0) {
        resources = resources.filter((resource) => filters.org!.includes(resource.orgCode));
      }
      if (filters.onlySelfIdentifiedUserEnabled === true) {
        resources = resources.filter((resource) => resource.selfIdentifiedUserEnabled);
      }
    }

    return resources;
  } catch (error) {
    logger.error(error, 'Error retrieving service resources from Redis:');
    return [];
  }
}

// Background refresh function - attempts to refresh data but keeps old version on failure
async function refreshServiceResourcesInBackground(): Promise<void> {
  try {
    const { default: redisClient } = await import('../../redisClient.ts');
    const existingData = await redisClient.get(serviceResourcesRedisKey);

    try {
      await storeServiceResourcesInRedis();
      logger.info('Service resources refreshed successfully in background');
    } catch (refreshError) {
      logger.warn(refreshError, 'Failed to refresh service resources, keeping existing data');
      // If we have existing data and refresh fails, extend its TTL
      if (existingData) {
        await redisClient.expire(serviceResourcesRedisKey, 60 * 60 * 24);
      }
    }
  } catch (error) {
    logger.error(error, 'Background service resources refresh failed completely');
  }
}

export function startServiceResourcesRefresh(): void {
  if (refreshTimer) {
    return;
  }

  refreshTimer = setInterval(
    () => {
      void refreshServiceResourcesInBackground();
    },
    23 * 60 * 60 * 1000,
  );

  logger.info('Service resources background refresh started');
}

// Stop periodic refresh (useful for cleanup)
export function stopServiceResourcesRefresh(): void {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
    logger.info('Service resources background refresh stopped');
  }
}

export const ServiceResourceTitle = objectType({
  name: 'ServiceResourceTitle',
  definition(t) {
    t.string('en', {
      description: 'English title of the service resource',
      resolve: (title) => {
        return title.en;
      },
    });
    t.string('nb', {
      description: 'Norwegian bokmål title of the service resource',
      resolve: (title) => {
        return title.nb || title['nb-no'];
      },
    });
    t.string('nn', {
      description: 'Norwegian nynorsk title of the service resource',
      resolve: (title) => {
        return title.nn || title['nn-no'];
      },
    });
  },
});

export const ServiceResource = objectType({
  name: 'ServiceResource',
  definition(t) {
    t.string('id', {
      description: 'Service resource identifier',
      resolve: (resource) => {
        return resource.id;
      },
    });
    t.field('title', {
      type: 'ServiceResourceTitle',
      description: 'Localized title of the service resource',
      resolve: (resource) => {
        return resource.title;
      },
    });
    t.string('orgCode', {
      description: 'Organization (=service owner) code for the service resource',
      resolve: (resource) => {
        return resource.orgCode;
      },
    });
    t.string('resourceType', {
      description: 'Type of the service resource',
      resolve: (resource) => {
        return resource.resourceType;
      },
    });
  },
});

export const ServiceResourceQuery = extendType({
  type: 'Query',
  definition(t) {
    t.list.field('serviceResources', {
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
        onlySelfIdentifiedUserEnabled: booleanArg({
          description: 'Show only resources enabled for self-identified users',
          default: false,
        }),
      },
      resolve: async (_, args) => {
        const filters: {
          resourceType?: string[];
          ids?: string[];
          org?: string[];
          onlySelfIdentifiedUserEnabled?: boolean;
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

        if (args.onlySelfIdentifiedUserEnabled) {
          filters.onlySelfIdentifiedUserEnabled = true;
        }

        return await getServiceResourcesFromRedis(Object.keys(filters).length > 0 ? filters : undefined);
      },
    });
  },
});
