import { logger } from '@altinn/dialogporten-node-logger';
import axios from 'axios';
import config from '../../config.ts';
import type { Altinn2MessageData, Altinn2MessagesResponse } from '../types/altinn2messages.ts';
import { languageCodes } from '../types/cookie.ts';
import type { Context, TokenType } from './profile.ts';

export const getAltinn2messages = async (context: Context): Promise<Altinn2MessageData[]> => {
  const language = typeof context.session.get('locale') === 'string' ? (context.session.get('locale') as string) : 'nb';
  const { altinn2ApiKey, altinn2BaseURL } = config;

  if (!altinn2BaseURL || !altinn2ApiKey) {
    logger.error('Altinn 2 base URL or API key is not set');
    return [];
  }
  const languageCode = languageCodes[language] || '1044';

  try {
    const token = typeof context.session.get('token') === 'object' ? (context.session.get('token') as TokenType) : null;

    if (!token?.access_token) {
      logger.error('No valid token available for Altinn 2 API call');
      throw new Error('Unable to authenticate with Altinn 2 API - no valid token with required scope');
    }

    const altinn2messagesAPI_url = `${altinn2BaseURL}/api/my/messages?language=${languageCode}`;

    const response = await axios.get<Altinn2MessagesResponse>(altinn2messagesAPI_url, {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        Accept: 'application/hal+json',
        ApiKey: altinn2ApiKey,
      },
    });
    const allMessages = response.data._embedded?.messages;

    const altinn2ActiveSchemas = allMessages?.filter((message) => {
      const isActiveElement = !message?.ArchiveReference;
      const isSchema = message?.Type === 'FormTask';

      return isSchema && isActiveElement;
    });
    return altinn2ActiveSchemas ?? [];
  } catch (error) {
    logger.error(error, 'Error fetching altinn2messages:');
    return [];
  }
};
