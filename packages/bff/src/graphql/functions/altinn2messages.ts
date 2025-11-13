import { logger } from '@altinn/dialogporten-node-logger';
import axios from 'axios';
import type { AxiosResponse } from 'axios';
import type { Context, TokenType } from './profile.ts';

export const getAltinn2messages = async (context: Context): Promise<string> => {
  const language = typeof context.session.get('locale') === 'string' ? (context.session.get('locale') as string) : 'nb';
  let response: AxiosResponse | undefined;
  try {
    const token = typeof context.session.get('token') === 'object' ? (context.session.get('token') as TokenType) : null;

    if (!token?.access_token) {
      logger.error('No valid token available for Altinn 2 API call');
      throw new Error('Unable to authenticate with Altinn 2 API - no valid token with required scope');
    }

    const who = 'my';
    const baseUrl = 'https://at23.altinn.cloud';
    const altinn2messagesAPI_url = `${baseUrl}/api/${who}/messages?language=${language}`;
    const apiKey = '4B16B3E4-EDC5-4076-9E91-03DFBB157A9F';

    logger.info(`Fetching altinn2messages from ${altinn2messagesAPI_url}`);

    response = await axios.get(altinn2messagesAPI_url, {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
        Accept: 'application/hal+json',
        ApiKey: apiKey,
      },
    });
    logger.info(`Altinn2messages fetched successfully: ${JSON.stringify(response!.data)}`);
    return JSON.stringify(response!.data);
  } catch (error) {
    logger.error(error, 'Error fetching altinn2messages:');
    const errorMessage = response?.data?.message ? `: ${response.data.message}` : '';
    throw new Error(`Failed to fetch altinn2messages${errorMessage}`);
  }
};
