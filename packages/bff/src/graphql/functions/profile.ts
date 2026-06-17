import { logger } from '@altinn/dialogporten-node-logger';
import axios, { isAxiosError } from 'axios';
import { type Context, getSessionToken } from '../../auth/oidc.js';
import config from '../../config.ts';
import { GroupRepository, PartyRepository, ProfileRepository } from '../../db.ts';
import { Group, Party, ProfileTable } from '../../entities.ts';
import type { PreselectedPartyOperationType } from '../types/mutation.ts';
import type {
  NotificationSettingsInputData,
  SendVerificationCodeInputData,
  VerifyAddressInputData,
} from '../types/profile.ts';

const { platformBaseURL } = config;

const platformProfileAPI_url = platformBaseURL + '/profile/api/v1/';

export const getOrCreateProfile = async (context: Context): Promise<ProfileTable> => {
  const pid = typeof context.session.get('pid') === 'string' ? (context.session.get('pid') as string) : '';

  if (!pid) {
    logger.error('No pid provided');
    throw new Error('PID is required to get or create a profile');
  }

  const profile = await ProfileRepository!.createQueryBuilder('profile').where('profile.pid = :pid', { pid }).getOne();
  const token = getSessionToken(context);
  const groups = token ? await getFavoritesFromCore(token.access_token) : [];

  if (!profile) {
    const newProfile = new ProfileTable();
    newProfile.pid = pid;
    newProfile.groups = [];

    const savedProfile = await ProfileRepository!.save(newProfile);
    if (!savedProfile) {
      throw new Error('Fatal: Not able to create new profile');
    }
    return savedProfile;
  }

  profile.groups = groups;
  return profile;
};

export const addFavoriteParty = async (context: Context, partyUuid: string) => {
  const token = getSessionToken(context);
  if (!token) {
    logger.error('No token found in session');
    return [];
  }

  try {
    const response = await axios.put(
      `${platformProfileAPI_url}users/current/party-groups/favorites/${partyUuid}`,
      null,
      {
        timeout: 30000,
        headers: {
          Authorization: `Bearer ${token.access_token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      },
    );
    return [response.data as Group];
  } catch (error) {
    logger.error(error, 'Error adding favorite:');
    throw new Error('Failed to add favorite');
  }
};

// Below code to be rewritten when Altinn Core API is updated
// to support adding parties to groups
export const addFavoritePartyToGroup = async (pid: string, partyId: string, categoryName: string) => {
  const currentProfile = await ProfileRepository!.findOne({
    where: { pid },
  });
  if (!currentProfile) throw new Error('Profile not found');

  let group = await GroupRepository!.findOne({
    where: { name: categoryName, profile: { pid } },
  });
  if (!group) {
    const newGroup = new Group();
    newGroup.profile = currentProfile;
    newGroup.name = categoryName;
    group = await GroupRepository!.save(newGroup);
    if (!group) throw new Error('Fatal: Not able to create new group');
  }

  let party = await PartyRepository!.findOne({
    where: { id: partyId },
    relations: ['groups'],
  });

  if (!party) {
    party = new Party();
    party.id = partyId;
    party.groups = [group];
  } else {
    const alreadyInGroup = party.groups.some((g) => g.id === group.id);
    if (!alreadyInGroup) {
      party.groups = [...party.groups, group];
    } else {
      logger.info(`Party ${partyId} already exists in group ${categoryName}, skipping addition`);
      return currentProfile;
    }
  }

  await PartyRepository!.save(party);

  const updatedProfile = await ProfileRepository!.findOne({
    where: { pid: currentProfile.pid },
    relations: ['groups'],
  });
  if (!updatedProfile) throw new Error('Failed to update profile');
  return updatedProfile;
};

export const deleteFavoriteParty = async (context: Context, partyUuid: string) => {
  const token = getSessionToken(context);
  if (!token) {
    logger.error('No token found in session');
    return [];
  }

  return await axios
    .delete(`${platformProfileAPI_url}users/current/party-groups/favorites/${partyUuid}`, {
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })
    .catch((error) => {
      logger.error({ status: error?.status, message: error?.message }, 'Error deleting favorite party:');
      return;
    });
};

export const getUserFromCore = async (context: Context) => {
  const token = getSessionToken(context);
  if (!token) {
    logger.error('No token found in session');
    return;
  }
  try {
    const { data } = await axios.get(`${platformProfileAPI_url}users/current`, {
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    if (!data) {
      logger.error('No core profile data found');
      return;
    }
    return data;
  } catch (error) {
    logger.error(error, 'Error fetching user from core:');
  }
  return;
};

export const setPreSelectedParty = async (
  context: Context,
  partyUuid: string,
  operationType: PreselectedPartyOperationType,
) => {
  if (operationType === 'set' && !partyUuid) {
    throw new Error('partyUuid is required');
  }

  return patchProfileSettings(context, {
    preSelectedPartyUuid: operationType === 'set' ? partyUuid : null,
  });
};

export const updateShowClientUnits = async (context: Context, value: boolean) => {
  return patchProfileSettings(context, { showClientUnits: value });
};

export const getFavoritesFromCore = async (accessToken: string) => {
  try {
    const { data } = await axios.get(`${platformProfileAPI_url}users/current/party-groups/favorites`, {
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    return [data as Group];
  } catch {
    logger.error('getFavoritesFromCore: Error fetching core profile favorite data, returning empty array');
    return [];
  }
};

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

const patchProfileSettings = async (context: Context, payload: Record<string, unknown>) => {
  const token = getSessionToken(context);
  if (!token) {
    throw new Error('No token found in session');
  }
  try {
    const response = await axios.patch(`${platformProfileAPI_url}users/current/profilesettings`, payload, {
      timeout: 30000,
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status?: number; data?: unknown } };
      logger.error(
        { status: axiosError.response?.status, responseData: axiosError.response?.data },
        'Platform API error patching profilesettings:',
      );
    }
    throw error;
  }
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

export const updateShowDeletedEntities = async (context: Context, shouldShowDeletedEntities: boolean) => {
  return patchProfileSettings(context, { shouldShowDeletedEntities });
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

export const updateLanguageInCore = async (context: Context, language: string): Promise<void> => {
  await patchProfileSettings(context, { language });
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
