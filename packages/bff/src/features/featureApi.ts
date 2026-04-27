import { setInterval } from 'node:timers';
import { logger } from '@altinn/dialogporten-node-logger';
import { load } from '@azure/app-configuration-provider';
import { ConfigurationMapFeatureFlagProvider, FeatureManager } from '@microsoft/feature-management';
import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

const defaultFeatureFlags: Record<string, boolean> = {
  'globalMenu.enabled': false,
  'dialogporten.disableFlipNamesPatch': false,
  'inbox.enableAltinn2Messages': false,
  'debug.test': false, // only used for debugging,
  'inbox.enableAlertBanner': false,
  'dialogporten.disableSubscriptions': false,
  'inbox.enableDeletedUnitsFilter': false,
  'profile.enableResendVerificationCode': false,
  'profile.enableSingleServiceNotifications': false,
  'auth.enableDelegationLink': false,
  'inbox.enableBulkMode': false,
};

const defaultAppConfigValues: Record<string, string[]> = {
  'auth.orgsNotReadyToDealWithDelegations': [],
};

/* Fore more details, cf. https://learn.microsoft.com/en-us/azure/azure-app-configuration/quickstart-feature-flag-javascript?tabs=entra-id */
const plugin: FastifyPluginAsync<{ appConfigConnectionString: string }> = async (fastify, opts) => {
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
          selectors: Object.keys(defaultFeatureFlags).map((key) => ({ keyFilter: key })),
        },
        selectors: Object.keys(defaultAppConfigValues).map((key) => ({ keyFilter: key })),
        refreshOptions: {
          enabled: true,
          refreshIntervalInMs: 10_000,
          watchedSettings: Object.keys(defaultAppConfigValues).map((key) => ({ key })),
        },
      });

      // Refresh to get the latest settings
      setInterval(() => {
        appConfig?.refresh();
      }, 10_000);

      const featureProvider = new ConfigurationMapFeatureFlagProvider(appConfig);
      featureManager = new FeatureManager(featureProvider);
    }
  } catch (err) {
    logger.error(err, 'Failed to initialize feature flag manager');
  }

  fastify.get('/api/features', async (_request, reply) => {
    const result: Record<string, boolean | string[]> = { ...defaultFeatureFlags, ...defaultAppConfigValues };

    try {
      if (!featureManager && !appConfig) {
        logger.warn('Feature manager not initialized, returning defaults');
        return reply.status(200).send(result);
      }

      for (const key of Object.keys(defaultFeatureFlags)) {
        try {
          if (featureManager) {
            result[key] = await featureManager.isEnabled(key);
          }
        } catch (err) {
          logger.warn({ key, err }, 'Failed to resolve feature flag, using default');
        }
      }

      for (const key of Object.keys(defaultAppConfigValues)) {
        try {
          const raw = appConfig?.get(key);
          if (typeof raw === 'string') {
            result[key] = JSON.parse(raw);
          }
        } catch (err) {
          logger.warn({ key, err }, 'Failed to resolve app config value, using default');
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
