import { logger } from '@altinn/dialogporten-node-logger';
import axios from 'axios';
import type { AxiosResponse } from 'axios';
import config from '../../config.ts';
import type { Altinn2MessageData, Altinn2MessagesResponse } from '../types/altinn2messages.ts';
import type { Context, TokenType } from './profile.ts';

export const getAltinn2messages = async (context: Context): Promise<Altinn2MessageData[]> => {
  const language = typeof context.session.get('locale') === 'string' ? (context.session.get('locale') as string) : 'nb';
  let response: AxiosResponse | undefined;
  const baseUrl = config.altinn2BaseURL;
  const apiKey = config.altinn2ApiKey;

  if (!baseUrl || !apiKey) {
    logger.error('Altinn 2 base URL or API key is not set');
    throw new Error('Altinn 2 base URL or API key is not set');
  }

  const languageMap: Record<string, string> = {
    nb: '1044',
    nn: '2068',
    en: '1033',
  };
  const languageCode = languageMap[language] || '1044';

  try {
    const token = typeof context.session.get('token') === 'object' ? (context.session.get('token') as TokenType) : null;

    if (!token?.access_token) {
      logger.error('No valid token available for Altinn 2 API call');
      throw new Error('Unable to authenticate with Altinn 2 API - no valid token with required scope');
    }

    const altinn2messagesAPI_url = `${baseUrl}/api/my/messages?language=${languageCode}`;

    response = await axios.get<Altinn2MessagesResponse>(altinn2messagesAPI_url, {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        Accept: 'application/hal+json',
        ApiKey: apiKey,
      },
    });

    return response!.data._embedded?.messages;
  } catch (error) {
    logger.error(error, 'Error fetching altinn2messages:');
    const errorMessage = response?.data?.message ? `: ${response.data.message}` : '';
    throw new Error(`Failed to fetch altinn2messages${errorMessage}`);
  }
};
