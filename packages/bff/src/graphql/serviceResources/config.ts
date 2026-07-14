/**
 * Configuration file for service resource filtering
 * Contains environment-specific ID exclusions and other filtering configurations
 */
import type { ResourceFilters } from './service.ts';
import { at23TestIds, prodTestIDs, tt02TestIds } from './testIds.ts';

/**
 * Shared configuration across environments
 */
export const sharedConfig: ResourceFilters = {
  excludeOrgCodes: ['acn', 'bft', 'ttd'],
  includeResourceTypes: ['GenericAccessResource', 'AltinnApp', 'MigratedApp', 'CorrespondenceService'],
  onlyVisible: true,
  onlyDelegable: true,
};

/**
 * Get environment-specific configuration based on platform URL
 */
export function getEnvironmentConfig(platformUrl: string): ResourceFilters {
  const envSpecific: ResourceFilters = {};

  // Production environment
  if (platformUrl.includes('af.altinn.no')) {
    envSpecific.excludeIds = prodTestIDs;
  }
  // Test/Staging environment (TT02)
  else if (platformUrl.includes('tt02')) {
    envSpecific.excludeIds = tt02TestIds;
  }
  // AT23 test environment (default case)
  else {
    envSpecific.excludeIds = at23TestIds;
  }

  return {
    ...sharedConfig,
    ...envSpecific,
    excludeOrgCodes: [...(sharedConfig.excludeOrgCodes || []), ...(envSpecific.excludeOrgCodes || [])],
    includeResourceTypes: envSpecific.includeResourceTypes || sharedConfig.includeResourceTypes,
    excludeResourceTypes: [...(sharedConfig.excludeResourceTypes || []), ...(envSpecific.excludeResourceTypes || [])],
    includeOrgCodes: [...(sharedConfig.includeOrgCodes || []), ...(envSpecific.includeOrgCodes || [])],
    includeResourceStatuses: [
      ...(sharedConfig.includeResourceStatuses || []),
      ...(envSpecific.includeResourceStatuses || []),
    ],
    excludeResourceStatuses: [
      ...(sharedConfig.excludeResourceStatuses || []),
      ...(envSpecific.excludeResourceStatuses || []),
    ],
  };
}
