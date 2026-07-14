import { logger } from '@altinn/dialogporten-node-logger';
import config from '../../config.js';
import { getEnvironmentConfig } from './config.ts';
import { serviceResourcesRedisKey, storeServiceResourcesInRedis } from './service.ts';

let refreshTimer: NodeJS.Timeout | null = null;

// Background refresh function - attempts to refresh data but keeps old version on failure
async function refreshServiceResourcesInBackground(): Promise<void> {
  try {
    const { default: redisClient } = await import('../../redisClient.ts');
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
    6 * 60 * 60 * 1000,
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
