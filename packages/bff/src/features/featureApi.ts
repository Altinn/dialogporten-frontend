import { setInterval } from 'node:timers';
import { logger } from '@altinn/dialogporten-node-logger';
import { load } from '@azure/app-configuration-provider';
import { ConfigurationMapFeatureFlagProvider, FeatureManager } from '@microsoft/feature-management';
import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { type FeatureFlagDefinition, type FeatureFlagValue, featureFlagDefinitions } from './featureFlagDefinitions.ts';

const definitions: readonly FeatureFlagDefinition[] = featureFlagDefinitions;
const featureFlagKeys = definitions.filter((def) => def.type === 'boolean').map((def) => def.key);
const appConfigDefinitions = definitions.filter((def) => def.type !== 'boolean');
const appConfigKeys = appConfigDefinitions.map((def) => def.key);
const defaultValues: Record<string, FeatureFlagValue> = Object.fromEntries(
  definitions.map((def) => [def.key, def.default]),
);

/* Fore more details, cf. https://learn.microsoft.com/en-us/azure/azure-app-configuration/quickstart-feature-flag-javascript?tabs=entra-id */
const plugin: FastifyPluginAsync<{ appConfigConnectionString: string }> = async (fastify, opts) => {
  let featureProvider: ConfigurationMapFeatureFlagProvider | undefined;
  let featureManager: FeatureManager | undefined;
  let appConfig: Awaited<ReturnType<typeof load>> | undefined;

  try {
    if (opts.appConfigConnectionString) {
      appConfig = await load(opts.appConfigConnectionString, {
        featureFlagOptions: {
          enabled: true,
          refresh: {
            enabled: true,
            refreshIntervalInMs: 10_000,
          },
          selectors: featureFlagKeys.map((key) => ({ keyFilter: key })),
        },
        selectors: appConfigKeys.map((key) => ({ keyFilter: key })),
        refreshOptions: {
          enabled: true,
          refreshIntervalInMs: 10_000,
          watchedSettings: appConfigKeys.map((key) => ({ key })),
        },
      });

      // Refresh to get the latest settings
      setInterval(() => {
        appConfig?.refresh();
      }, 10_000);

      featureProvider = new ConfigurationMapFeatureFlagProvider(appConfig);
      featureManager = new FeatureManager(featureProvider);
    }
  } catch (err) {
    logger.error(err, 'Failed to initialize feature flag manager');
  }

  fastify.get('/api/features', async (_request, reply) => {
    const result: Record<string, FeatureFlagValue> = { ...defaultValues };

    try {
      if (!featureManager && !appConfig) {
        logger.warn('Feature manager not initialized, returning defaults');
        return reply.status(200).send(result);
      }

      for (const key of featureFlagKeys) {
        try {
          if (featureManager && (await featureProvider?.getFeatureFlag(key))) {
            result[key] = await featureManager.isEnabled(key);
          }
        } catch (err) {
          logger.warn({ key, err }, 'Failed to resolve feature flag, using default');
        }
      }

      for (const def of appConfigDefinitions) {
        try {
          const raw = appConfig?.get(def.key);
          if (typeof raw === 'string' && raw.trim() !== '') {
            result[def.key] = def.type === 'string' ? raw : JSON.parse(raw);
          }
        } catch (err) {
          logger.warn({ key: def.key, err }, 'Failed to resolve app config value, using default');
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
