import { logger } from '@altinn/dialogporten-node-logger';
import axios, { isAxiosError } from 'axios';
import { getAltinnToken } from '../../auth/maskinporten.js';
import config from '../../config.ts';

const setUsernameUrl = `${config.platformBaseURL}/register/api/v1/dialogporten/parties/set-username?`;
const partyQueryUrl = `${config.platformBaseURL}/register/api/v1/dialogporten/parties/query?fields=user.name`;

export interface SetUsernameResult {
  success: boolean;
  message?: string;
}

interface ValidationProblemDetails {
  detail?: string;
  validationErrors?: { detail?: string; paths?: string[] }[];
}

const extractValidationMessage = (data: unknown): string | undefined => {
  if (!data || typeof data !== 'object') {
    return undefined;
  }
  const problem = data as ValidationProblemDetails;
  return problem.validationErrors?.[0]?.detail ?? problem.detail;
};

const buildRegisterHeaders = (token: string): Record<string, string> => {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  const subscriptionKey = config.registerSubscriptionKey || config.ocpApimSubscriptionKey;
  if (subscriptionKey) {
    headers['Ocp-Apim-Subscription-Key'] = subscriptionKey;
  }
  return headers;
};

export const setUsername = async (party: string, username: string | null): Promise<SetUsernameResult> => {
  let token: string;
  try {
    token = await getAltinnToken();
  } catch (error) {
    logger.error(error, 'Failed to obtain Altinn token for set-username');
    return { success: false, message: 'Failed to authenticate against register' };
  }

  try {
    await axios.post(
      setUsernameUrl,
      { party, username },
      {
        timeout: 30000,
        headers: buildRegisterHeaders(token),
      },
    );
    return { success: true };
  } catch (error) {
    if (isAxiosError(error)) {
      const status = error.response?.status;
      const data = error.response?.data;
      logger.error({ status, data }, 'Failed to set username via register');

      switch (status) {
        case 400:
          return { success: false, message: extractValidationMessage(data) ?? 'Invalid username or party' };
        case 409:
          return { success: false, message: 'Username is already in use by another party' };
        case 418:
          return { success: false, message: 'Setting of usernames is currently managed by Altinn 2' };
        default:
          return { success: false, message: 'Failed to set username' };
      }
    }
    logger.error(error, 'Failed to set username via register');
    return { success: false, message: 'Failed to set username' };
  }
};

interface PartyQueryResponse {
  data?: { user?: { username?: string | null } }[];
}

export const getUsername = async (partyUuid: string): Promise<string | null> => {
  let token: string;
  try {
    token = await getAltinnToken();
  } catch (error) {
    logger.error(error, 'Failed to obtain Altinn token for party query');
    return null;
  }

  try {
    const { data } = await axios.post<PartyQueryResponse>(
      partyQueryUrl,
      { data: [`urn:altinn:party:uuid:${partyUuid}`] },
      {
        timeout: 30000,
        headers: buildRegisterHeaders(token),
      },
    );
    return data?.data?.[0]?.user?.username ?? null;
  } catch (error) {
    if (isAxiosError(error)) {
      logger.error({ status: error.response?.status, data: error.response?.data }, 'Failed to query party username');
    } else {
      logger.error(error, 'Failed to query party username');
    }
    return null;
  }
};
