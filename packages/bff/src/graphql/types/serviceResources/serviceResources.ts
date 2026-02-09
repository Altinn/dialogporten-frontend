import { logger } from '@altinn/dialogporten-node-logger';
import { booleanArg, extendType, list, objectType, stringArg } from 'nexus';
import config from '../../../config.js';
import type { LocalizedText, Resource } from './resourceRegistry.ts';
import { getEnvironmentConfig } from './serviceResourcesConfig.js';

interface TransformedServiceResource {
  id: string;
  title: LocalizedText;
  org: string;
  resourceType: string;
  selfIdentifiedUserEnabled: boolean;
}

const serviceResourcesRedisKey = 'arbeidsflate-service-resources:v2';
let refreshTimer: NodeJS.Timeout | null = null;

async function fetchServiceResources(): Promise<Resource[]> {
  try {
    const response = await fetch(
      config.platformBaseURL +
        '/resourceregistry/api/v1/resource/resourcelist?includeAltinn2=false&includeApps=true&includeMigratedApps=true',
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

export interface ResourceFilters {
  /** Filter by resource types - only include these types */
  includeResourceTypes?: string[];
  /** Filter by resource types - exclude these types */
  excludeResourceTypes?: string[];
  /** Filter by organization codes - only include these organizations */
  includeOrgCodes?: string[];
  /** Filter by organization codes - exclude these organizations */
  excludeOrgCodes?: string[];
  /** Filter by resource IDs - exclude these specific resource IDs */
  excludeIds?: string[];
  /** Only include resources that are enabled for self-identified users */
  onlySelfIdentifiedUserEnabled?: boolean;
  /** Only include resources that are visible */
  onlyVisible?: boolean;
  /** Only include resources that are delegable */
  onlyDelegable?: boolean;
  /** Filter by resource status - only include these statuses */
  includeResourceStatuses?: string[];
  /** Filter by resource status - exclude these statuses */
  excludeResourceStatuses?: string[];
  /** Custom filter function for advanced filtering */
  customFilter?: (resource: Resource) => boolean;
}

export async function storeServiceResourcesInRedis(filters?: ResourceFilters): Promise<TransformedServiceResource[]> {
  try {
    const { default: redisClient } = await import('../../../redisClient.ts');
    const serviceResources = await fetchServiceResources();

    // Apply filters to service resources before transformation
    let filteredResources = serviceResources;

    if (filters) {
      filteredResources = serviceResources.filter((resource) => {
        if (filters.includeResourceTypes && filters.includeResourceTypes.length > 0) {
          if (
            !filters.includeResourceTypes.some((type) => type.toLowerCase() === resource.resourceType.toLowerCase())
          ) {
            return false;
          }
        }

        // Filter by excluded resource types
        if (filters.excludeResourceTypes && filters.excludeResourceTypes.length > 0) {
          if (filters.excludeResourceTypes.some((type) => type.toLowerCase() === resource.resourceType.toLowerCase())) {
            return false;
          }
        }

        // Filter by included organization codes
        if (filters.includeOrgCodes && filters.includeOrgCodes.length > 0) {
          const orgCode = resource.hasCompetentAuthority?.orgcode || resource.hasCompetentAuthority?.organization || '';
          if (!filters.includeOrgCodes.some((code) => code.toLowerCase() === orgCode.toLowerCase())) {
            return false;
          }
        }

        // Filter by excluded organization codes
        if (filters.excludeOrgCodes && filters.excludeOrgCodes.length > 0) {
          const orgCode = resource.hasCompetentAuthority?.orgcode || resource.hasCompetentAuthority?.organization || '';
          if (filters.excludeOrgCodes.some((code) => code.toLowerCase() === orgCode.toLowerCase())) {
            return false;
          }
        }

        // Filter by self-identified user enabled
        if (filters.onlySelfIdentifiedUserEnabled === true) {
          if (!resource.selfIdentifiedUserEnabled) {
            return false;
          }
        }

        // Filter by visible resources only
        if (filters.onlyVisible === true) {
          if (!resource.visible) {
            return false;
          }
        }

        // Filter by delegable resources only
        if (filters.onlyDelegable === true) {
          if (!resource.delegable) {
            return false;
          }
        }

        // Filter by included resource statuses
        if (filters.includeResourceStatuses && filters.includeResourceStatuses.length > 0) {
          const status = resource.status || '';
          if (!filters.includeResourceStatuses.some((s) => s.toLowerCase() === status.toLowerCase())) {
            return false;
          }
        }

        // Filter by excluded resource statuses
        if (filters.excludeResourceStatuses && filters.excludeResourceStatuses.length > 0) {
          const status = resource.status || '';
          if (filters.excludeResourceStatuses.some((s) => s.toLowerCase() === status.toLowerCase())) {
            return false;
          }
        }

        // Filter by excluded resource IDs
        if (filters.excludeIds && filters.excludeIds.length > 0) {
          if (filters.excludeIds.includes(resource.identifier)) {
            return false;
          }
        }

        // Apply custom filter function
        if (filters.customFilter && !filters.customFilter(resource)) {
          return false;
        }

        return true;
      });
    }

    const transformedResources = filteredResources.map((resource) => ({
      id: resource.identifier,
      title: resource.title,
      org: (
        resource.hasCompetentAuthority?.orgcode ||
        resource.hasCompetentAuthority?.organization ||
        ''
      ).toLowerCase(),
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
    const { default: redisClient } = await import('../../../redisClient.ts');
    const data = await redisClient.get(serviceResourcesRedisKey);
    let resources: TransformedServiceResource[];

    if (data) {
      resources = JSON.parse(data);
    } else {
      resources = await storeServiceResourcesInRedis(getEnvironmentConfig(config.platformBaseURL));
    }

    // Apply filters if provided
    if (filters) {
      if (filters.resourceType && filters.resourceType.length > 0) {
        resources = resources.filter((resource) =>
          filters.resourceType!.some((type) => type.toLowerCase() === resource.resourceType.toLowerCase()),
        );
      }
      if (filters.ids && filters.ids.length > 0) {
        resources = resources.filter((resource) => filters.ids!.includes(resource.id));
      }
      if (filters.org && filters.org.length > 0) {
        resources = resources.filter((resource) =>
          filters.org!.some((org) => org.toLowerCase() === resource.org.toLowerCase()),
        );
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
    const { default: redisClient } = await import('../../../redisClient.ts');
    const existingData = await redisClient.get(serviceResourcesRedisKey);

    try {
      await storeServiceResourcesInRedis(getEnvironmentConfig(config.platformBaseURL));
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
    t.string('org', {
      description: 'Organization (=service owner) code for the service resource',
      resolve: (resource) => {
        return resource.org;
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
