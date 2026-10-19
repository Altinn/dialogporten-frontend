import { clearInterval, setInterval } from 'node:timers';
import { logger } from '@altinn/dialogporten-node-logger';
import { load } from '@azure/app-configuration-provider';
import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

interface AlertBannerLink {
  url?: string;
  text: string;
}

interface AlertBannerContent {
  title: string;
  description: string;
  link?: AlertBannerLink;
}

interface AlertBannerResponse {
  nb?: AlertBannerContent;
  nn?: AlertBannerContent;
  en?: AlertBannerContent;
}

const defaultAlertBannerContent: AlertBannerResponse = {};

const alertBannerKeys = ['alertBanner.content.nb', 'alertBanner.content.nn', 'alertBanner.content.en'] as const;
type AlertBannerKey = (typeof alertBannerKeys)[number];

const languageMap: Record<AlertBannerKey, 'nb' | 'nn' | 'en'> = {
  'alertBanner.content.nb': 'nb',
  'alertBanner.content.nn': 'nn',
  'alertBanner.content.en': 'en',
};

function parseAlertBannerContent(value: unknown): AlertBannerContent | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = typeof value === 'string' ? (JSON.parse(value) as unknown) : value;

    if (typeof parsed !== 'object' || parsed === null) {
      return null;
    }

    const missingFields: string[] = [];
    if (!('title' in parsed) || typeof parsed.title !== 'string') {
      missingFields.push('title (string)');
    }
    if (!('description' in parsed) || typeof parsed.description !== 'string') {
      missingFields.push('description (string)');
    }

    if ('link' in parsed) {
      if (
        typeof parsed.link !== 'object' ||
        parsed.link === null ||
        !('text' in parsed.link) ||
        typeof parsed.link.text !== 'string'
      ) {
        missingFields.push('link.text (string)');
      }
      if (
        typeof parsed.link === 'object' &&
        parsed.link !== null &&
        'url' in parsed.link &&
        typeof parsed.link.url !== 'string'
      ) {
        missingFields.push('link.url (string, optional)');
      }
    }

    if (missingFields.length > 0) {
      logger.warn(
        { key: 'alertBanner', missingFields },
        `Invalid alert banner content structure. Missing or invalid fields: ${missingFields.join(', ')}`,
      );
      return null;
    }

    return parsed as AlertBannerContent;
  } catch (err) {
    logger.warn({ err }, 'Failed to parse alert banner content JSON');
    return null;
  }
}

function readAlertBannerContent(appConfig: Awaited<ReturnType<typeof load>>): AlertBannerResponse {
  const result: AlertBannerResponse = { ...defaultAlertBannerContent };
  for (const key of alertBannerKeys) {
    const content = parseAlertBannerContent(appConfig.get<unknown>(key));
    if (content) {
      result[languageMap[key]] = content;
    }
  }
  return result;
}

const plugin: FastifyPluginAsync<{ appConfigConnectionString: string }> = async (fastify, opts) => {
  let alertBannerContent: AlertBannerResponse | undefined;

  try {
    if (opts.appConfigConnectionString) {
      const appConfig = await load(opts.appConfigConnectionString, {
        selectors: [{ keyFilter: 'alertBanner.content.*' }],
        refreshOptions: {
          enabled: true,
          refreshIntervalInMs: 10_000,
        },
      });

      alertBannerContent = readAlertBannerContent(appConfig);
      appConfig.onRefresh(() => {
        alertBannerContent = readAlertBannerContent(appConfig);
      });

      const refreshTimer = setInterval(() => {
        appConfig.refresh().catch((err) => {
          logger.warn({ err }, 'Failed to refresh alert banner content from Azure App Configuration');
        });
      }, 10_000);
      fastify.addHook('onClose', async () => {
        clearInterval(refreshTimer);
      });
    }
  } catch (err) {
    logger.error(err, 'Failed to load alert banner content from Azure App Configuration');
  }

  fastify.get('/api/alert-banner', async (_request, reply) => {
    if (!alertBannerContent) {
      logger.warn('Alert banner content not loaded from App Configuration, returning empty result');
      return reply.status(200).send({ ...defaultAlertBannerContent });
    }
    return reply.status(200).send(alertBannerContent);
  });
};

export default fp(plugin, {
  fastify: '5.x',
  name: 'api-alert-banner',
});
