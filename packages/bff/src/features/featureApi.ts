import { load } from '@azure/app-configuration-provider';
import { ConfigurationMapFeatureFlagProvider, FeatureManager } from '@microsoft/feature-management';
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

const defaultFeatureFlags: Record<string, boolean | number | string> = {
  'profile.enableRoutes': false,
  'globalMenu.enableProfileLink': false,
  'globalMenu.enableAccessManagementLink': false,
};

const plugin: FastifyPluginAsync<{ appConfigConnectionString: string }> = async (fastify, opts) => {
  let featureManager: FeatureManager | undefined;

  if (opts.appConfigConnectionString) {
    const appConfig = await load(opts.appConfigConnectionString, {
      featureFlagOptions: {
        enabled: true,
        selectors: [{ keyFilter: '*' }],
        refresh: {
          enabled: true,
          refreshIntervalInMs: 10_000,
        },
      },
    });
    const featureProvider = new ConfigurationMapFeatureFlagProvider(appConfig);
    featureManager = new FeatureManager(featureProvider);
  }

  fastify.get('/api/features', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const result: Record<string, boolean | number | string> = { ...defaultFeatureFlags };

      if (featureManager) {
        for (const key of Object.keys(defaultFeatureFlags)) {
          try {
            result[key] = await featureManager.isEnabled(key);
          } catch (err) {
            fastify.log.warn({ key, err }, 'Failed to resolve feature flag, falling back to default');
          }
        }
      }

      return reply.status(200).send(result);
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Failed to fetch feature flags' });
    }
  });
};

export default fp(plugin, {
  fastify: '5.x',
  name: 'api-features',
});
