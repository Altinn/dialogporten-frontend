import { setInterval } from 'node:timers';
import { load } from '@azure/app-configuration-provider';
import { logger } from '@digdir/dialogporten-node-logger';
import { ConfigurationMapFeatureFlagProvider, FeatureManager } from '@microsoft/feature-management';
import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

const defaultFeatureFlags: Record<string, boolean | number | string> = {
  'globalMenu.enableAccessManagementLink': false,
  'party.stopReversingPersonNameOrder': false,
  'debug.test': false, // only used for debugging
};

/* Fore more details, cf. https://learn.microsoft.com/en-us/azure/azure-app-configuration/quickstart-feature-flag-javascript?tabs=entra-id */
const plugin: FastifyPluginAsync<{ appConfigConnectionString: string }> = async (fastify, opts) => {
  let featureManager: FeatureManager | undefined;

  try {
    if (opts.appConfigConnectionString) {
      const appConfig = await load(opts.appConfigConnectionString, {
        featureFlagOptions: {
          enabled: true,
          refresh: {
            enabled: true,
            refreshIntervalInMs: 10_000,
          },
          selectors: Object.keys(defaultFeatureFlags).map((key) => ({ keyFilter: key })),
        },
      });

      // Refresh to get the latest feature flag settings
      setInterval(() => {
        appConfig.refresh();
      }, 10_000);

      const featureProvider = new ConfigurationMapFeatureFlagProvider(appConfig);
      featureManager = new FeatureManager(featureProvider);
    }
  } catch (err) {
    logger.error(err, 'Failed to initialize feature flag manager');
  }

  fastify.get('/api/features', async (_request, reply) => {
    const result = { ...defaultFeatureFlags };

    try {
      if (!featureManager) {
        logger.warn('Feature manager not initialized, returning defaults');
        return reply.status(200).send(result);
      }

      for (const key of Object.keys(defaultFeatureFlags)) {
        try {
          result[key] = await featureManager.isEnabled(key);
        } catch (err) {
          logger.warn({ key, err }, 'Failed to resolve feature flag, using default');
        }
      }

      return reply.status(200).send(result);
    } catch (err) {
      logger.err(err, 'Unexpected error while resolving feature flags');
      return reply.status(500).send({ error: 'Failed to fetch feature flags' });
    }
  });
};

export default fp(plugin, {
  fastify: '5.x',
  name: 'api-features',
});
