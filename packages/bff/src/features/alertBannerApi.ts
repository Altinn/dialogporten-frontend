import { logger } from '@altinn/dialogporten-node-logger';
import { AppConfigurationClient } from '@azure/app-configuration';
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

function parseAlertBannerContent(jsonString: string | undefined): AlertBannerContent | null {
  if (!jsonString) {
    return null;
  }

  try {
    const parsed = JSON.parse(jsonString) as unknown;

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

const plugin: FastifyPluginAsync<{ appConfigConnectionString: string }> = async (fastify, opts) => {
  let appConfigClient: AppConfigurationClient | undefined;

  try {
    if (opts.appConfigConnectionString) {
      appConfigClient = new AppConfigurationClient(opts.appConfigConnectionString);
    }
  } catch (err) {
    logger.error(err, 'Failed to initialize Azure App Configuration client for alert banner');
  }

  fastify.get('/api/alert-banner', async (_request, reply) => {
    const result: AlertBannerResponse = { ...defaultAlertBannerContent };

    try {
      if (!appConfigClient) {
        logger.warn('App Configuration client not initialized, returning empty result');
        return reply.status(200).send(result);
      }

      for (const key of alertBannerKeys) {
        try {
          const setting = await appConfigClient.getConfigurationSetting({ key });
          const language = languageMap[key];
          const content = parseAlertBannerContent(setting.value);

          if (content) {
            result[language] = content;
          }
        } catch (err) {
          // Check if it's a 404 (key doesn't exist) vs other error
          const error = err as { statusCode?: number; message?: string };
          if (error.statusCode !== 404) {
            logger.warn(
              { key, err, statusCode: error.statusCode, message: error.message },
              'Failed to get alert banner content from Azure App Configuration',
            );
          }
        }
      }
      return reply.status(200).send(result);
    } catch (err) {
      logger.error({ err }, 'Unexpected error while fetching alert banner content');
      return reply.status(500).send({ error: 'Failed to fetch alert banner content' });
    }
  });
};

export default fp(plugin, {
  fastify: '5.x',
  name: 'api-alert-banner',
});
