import { logger } from '@altinn/dialogporten-node-logger';

const activeConnectionsRedisKey = 'arbeidsflate-active-connections:v1';

export async function getActiveConnections(): Promise<number> {
  try {
    const { default: redisClient } = await import('../redisClient.ts');
    const count = await redisClient.get(activeConnectionsRedisKey);
    return count ? Number(count) : 0;
  } catch (error) {
    logger.error(error, 'Error retrieving active connections from Redis:');
    return 0;
  }
}

export async function incrementActiveConnections(): Promise<number> {
  try {
    const { default: redisClient } = await import('../redisClient.ts');
    return await redisClient.incr(activeConnectionsRedisKey);
  } catch (error) {
    logger.error(error, 'Error incrementing active connections in Redis:');
    return 0;
  }
}

export async function decrementActiveConnections(): Promise<number> {
  try {
    const { default: redisClient } = await import('../redisClient.ts');
    const result = await redisClient.decr(activeConnectionsRedisKey);
    if (result < 0) {
      await redisClient.set(activeConnectionsRedisKey, 0);
      return 0;
    }
    return result;
  } catch (error) {
    logger.error(error, 'Error decrementing active connections in Redis:');
    return 0;
  }
}
