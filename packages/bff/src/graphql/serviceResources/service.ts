import { logger } from '@altinn/dialogporten-node-logger';
import config from '../../config.js';
import { getEnvironmentConfig } from './config.ts';
import type { LocalizedText, Resource } from './registryTypes.ts';

export interface TransformedServiceResource {
  id: string;
  title: LocalizedText;
  org: string;
  resourceType: string;
}

export interface ServiceResourceResponseDTO extends Omit<TransformedServiceResource, 'title'> {
  title: string;
}

export const serviceResourcesRedisKey = 'arbeidsflate-service-resources:v5';

export function getSupportedLanguage(defaultLanguage: 'nb' | 'nn' | 'en', language?: string): string[] {
  const supportedLanguages = ['nb', 'nn', 'en'];
  const preferredMapping: Record<string, string[]> = {
    nb: ['nb', 'nn', 'en'],
    nn: ['nn', 'nb', 'en'],
    en: ['en', 'nb', 'nn'],
  };
  if (!language) {
    return preferredMapping[defaultLanguage];
  }

  if (!supportedLanguages.includes(language)) {
    return preferredMapping.nb;
  }
  return preferredMapping[language];
}

export function getLocalizedTitle(title: LocalizedText, langs: string[]): string {
  for (const lang of langs) {
    const value = title[lang as keyof LocalizedText];
    if (value) {
      return value;
    }
  }
  // Fallback: return the first available value, or empty string
  const values = Object.values(title).filter(Boolean);
  return values[0] || '';
}

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
    const { default: redisClient } = await import('../../redisClient.ts');
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
    }));

    await redisClient.set(serviceResourcesRedisKey, JSON.stringify(transformedResources), 'EX', 60 * 60 * 24); // Store for 24 hours

    return transformedResources;
  } catch (error) {
    logger.error(error, 'Error storing service resources in Redis:');
    // Return empty array on error, keeping old data if it exists
    return [];
  }
}

export interface ServiceResourceQueryFilters {
  resourceType?: string[];
  ids?: string[];
  org?: string[];
}

export function applyServiceResourceQueryFilters(
  resources: TransformedServiceResource[],
  filters?: ServiceResourceQueryFilters,
): TransformedServiceResource[] {
  if (!filters) {
    return resources;
  }

  let filtered = resources;
  if (filters.resourceType && filters.resourceType.length > 0) {
    filtered = filtered.filter((resource) =>
      filters.resourceType!.some((type) => type.toLowerCase() === resource.resourceType.toLowerCase()),
    );
  }
  if (filters.ids && filters.ids.length > 0) {
    filtered = filtered.filter((resource) => filters.ids!.includes(resource.id));
  }
  if (filters.org && filters.org.length > 0) {
    filtered = filtered.filter((resource) =>
      filters.org!.some((org) => org.toLowerCase() === resource.org.toLowerCase()),
    );
  }
  return filtered;
}

export async function getServiceResourcesFromRedis(
  langs: string[],
  filters?: ServiceResourceQueryFilters,
): Promise<ServiceResourceResponseDTO[]> {
  try {
    const { default: redisClient } = await import('../../redisClient.ts');
    const data = await redisClient.get(serviceResourcesRedisKey);
    let resources: TransformedServiceResource[];

    if (data) {
      resources = JSON.parse(data);
    } else {
      resources = await storeServiceResourcesInRedis(getEnvironmentConfig(config.platformBaseURL));
    }

    return applyServiceResourceQueryFilters(resources, filters).map((r) => ({
      ...r,
      title: getLocalizedTitle(r.title, langs),
    }));
  } catch (error) {
    logger.error(error, 'Error retrieving service resources from Redis:');
    return [];
  }
}
