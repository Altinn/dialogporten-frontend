import { logger } from '@altinn/dialogporten-node-logger';
import axios from 'axios';
import config from '../config.js';

const platformExchangeTokenEndpointURL = `${config.platformBaseURL}/authentication/api/v1/exchange/id-porten`;

/**
 * Exchanges a user's ID-porten bearer token (from the session) for an Altinn token,
 * which is what the Altinn platform APIs expect.
 */
export const exchangeToken = async (bearerToken: string): Promise<string> => {
  if (!bearerToken) {
    return '';
  }

  try {
    const { data } = await axios.get(platformExchangeTokenEndpointURL, {
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        Accept: 'application/json',
      },
    });
    return typeof data === 'string' ? data : '';
  } catch (error) {
    if (axios.isAxiosError(error)) {
      logger.error(
        { status: error.response?.status, data: error.response?.data },
        'Failed to exchange id-porten token for Altinn token',
      );
    } else {
      logger.error(error, 'Failed to exchange id-porten token for Altinn token');
    }
    return '';
  }
};
