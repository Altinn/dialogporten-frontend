import { logger } from '@altinn/dialogporten-node-logger';
import axios, { isAxiosError } from 'axios';
import { type Context, getSessionToken } from '../../auth/oidc.js';
import config from '../../config.ts';
import type { NotificationSettingsInputData, SendVerificationCodeInputData, VerifyAddressInputData } from './types.ts';

const { platformBaseURL } = config;

const platformProfileAPI_url = platformBaseURL + '/profile/api/v1/';

export const getNotificationsettingsForCurrentUser = async (context: Context) => {
  const token = getSessionToken(context);
  if (!token) {
    logger.error('No token found in session');
    return;
  }

  let data = [] as unknown[];
  try {
    const response = await axios.get(`${platformProfileAPI_url}users/current/notificationsettings/parties`, {
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    data = response.data;
    if (!data) {
      logger.error('No core profile data found');
      return;
    }

    return data;
  } catch (error) {
    if (typeof error === 'object' && error !== null) {
      const err = error as { status?: number; message?: string };
      // If the error is a 404, return an empty array
      // This will hopefully be changed in Core API to not return 404 when no notifications settings are found
      if (err.status === 404) {
        return;
      }
    } else {
      logger.error(error, 'Error fetching core notificationsSettings for user:');
    }
  }
  return;
};

export const sendVerificationCode = async (data: SendVerificationCodeInputData, context: Context) => {
  const token = getSessionToken(context);
  if (!token) {
    logger.error('No token found in session');
    return;
  }

  try {
    const response = await axios.post(`${platformProfileAPI_url}users/current/verification/send`, data, {
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    return {
      success: true,
      message: 'Verification code sent',
      verificationCode: response.data.verificationCode,
    };
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 429) {
      const retryAfterHeader = error.response.headers['retry-after'];
      return {
        success: false,
        message: 'Too many requests, please try again later',
        retryAfter: retryAfterHeader ? Number.parseInt(retryAfterHeader) : undefined,
      };
    }

    logger.error(
      `Failed to send verification code for ${data.value} with type ${data.type}: ${
        isAxiosError(error) ? `${error.response?.status ?? ''} ${error.message}` : String(error)
      }`,
    );
    return {
      success: false,
      message: 'Failed to send verification code',
    };
  }
};

export const updateNotificationsSetting = async (input: NotificationSettingsInputData, context: Context) => {
  const { partyUuid, ...payload } = input;
  if (!partyUuid) {
    logger.error('No uuid found in data');
    return;
  }
  const token = getSessionToken(context);
  if (!token) {
    logger.error('No token found in session');
    return;
  }
  try {
    const response = await axios.patch(
      `${platformProfileAPI_url}users/current/notificationsettings/parties/${partyUuid}`,
      payload,
      {
        timeout: 30000,
        headers: {
          Authorization: `Bearer ${token.access_token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      },
    );
    return response.data;
  } catch (error) {
    if (typeof error === 'object' && error !== null) {
      const err = error as { status?: number; message?: string };
      logger.error(
        `Failed to update notificationsSettings for partyUuid ${partyUuid}: ${err.status ?? ''} ${err.message ?? ''}`,
      );
    }
    return;
  }
};

export const deleteNotificationsSetting = async (partyUuid: string, context: Context) => {
  if (!partyUuid) {
    logger.error('No uuid found in data');
    return;
  }
  const token = getSessionToken(context);
  if (!token) {
    logger.error('No token found in session');
    return;
  }
  try {
    const response = await axios.delete(
      `${platformProfileAPI_url}users/current/notificationsettings/parties/${partyUuid}`,
      {
        timeout: 30000,
        headers: {
          Authorization: `Bearer ${token.access_token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      },
    );
    return response.data;
  } catch (error) {
    if (typeof error === 'object' && error !== null) {
      const err = error as { status?: number; message?: string };
      logger.error(`Failed to delete notificationsSettings: ${err.status ?? ''} ${err.message ?? ''}`);
    }
    return;
  }
};

export const getNotificationAddressByOrgNumber = async (orgnr: string, context: Context) => {
  if (!orgnr) {
    logger.error('No orgnr provided');
    return;
  }
  const token = getSessionToken(context);
  if (!token) {
    logger.error('No token found in session');
    return;
  }
  const { data, status, statusText } = await axios
    .get(`${platformProfileAPI_url}organizations/${orgnr}/notificationaddresses/mandatory`, {
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })
    .catch((error) => {
      // This fetch call can return 403 if user does not have access to the organization
      // or 404 if no notification addresses are found
      return { data: null, status: error?.status, statusText: error?.message };
    });
  if (!data) {
    return { data: null, status, statusText };
  }
  return data;
};

export const verifyAddress = async (data: VerifyAddressInputData, context: Context) => {
  const token = getSessionToken(context);
  if (!token) {
    throw new Error('No token found in session');
  }
  try {
    await axios.post(
      `${platformProfileAPI_url}users/current/verification/verify`,
      { value: data.value, type: data.type, verificationCode: data.verificationCode },
      {
        timeout: 30000,
        headers: {
          Authorization: `Bearer ${token.access_token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      },
    );
    return { success: true };
  } catch (error) {
    if (isAxiosError(error)) {
      const status = error.response?.status;
      const upstreamBody = error.response?.data;
      logger.error(
        { status, upstreamBody, value: data.value, type: data.type },
        'Failed to verify address — upstream error',
      );
      if (status === 422 || status === 400) {
        return { success: false, message: 'invalid_code' };
      }
      return {
        success: false,
        message:
          typeof upstreamBody === 'string' ? upstreamBody : (upstreamBody?.message ?? 'Failed to verify address'),
      };
    }
    logger.error(error, 'Error verifying address:');
    throw error;
  }
};

export const getVerifiedAddresses = async (context: Context) => {
  const token = getSessionToken(context);
  if (!token) {
    throw new Error('No token found in session');
  }
  try {
    const response = await axios.get(`${platformProfileAPI_url}users/current/verification/verified-addresses`, {
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    return response.data ?? [];
  } catch (error) {
    logger.error(error, 'Error fetching verified addresses for user:');
    return [];
  }
};

export const updateSIPrivatePhoneNumber = async (value: string | null, context: Context) => {
  const token = getSessionToken(context);
  if (!token) {
    logger.error('No token found in session');
    return { success: false };
  }
  try {
    await axios.put(
      `${platformProfileAPI_url}users/current/notificationsettings/private/phonenumber`,
      { value },
      {
        timeout: 30000,
        headers: {
          Authorization: `Bearer ${token.access_token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      },
    );
    return { success: true };
  } catch (error) {
    if (isAxiosError(error)) {
      logger.error(
        { status: error.response?.status, body: error.response?.data },
        'Failed to update SI private phone number',
      );
    } else {
      logger.error(error, 'Failed to update SI private phone number');
    }
    return { success: false };
  }
};
