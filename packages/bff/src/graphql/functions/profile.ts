import axios from 'axios';
import { logger } from '@digdir/dialogporten-node-logger';
import config from '../../config.ts';
import { GroupRepository, PartyRepository, ProfileRepository } from '../../db.ts';
import { Group, Party, ProfileTable } from '../../entities.ts';
import type { NotificationSettingsInputData } from '../types/profile.ts';
const { platformBaseURL } = config;

const platformExchangeTokenEndpointURL = platformBaseURL + '/authentication/api/v1/exchange/id-porten?test=true';
const platformProfileAPI_url = platformBaseURL + '/profile/api/v1/';

type TokenType = {
  access_token: string;
  access_token_expires_at?: number;
  id_token?: string;
  refresh_token?: string;
  refresh_token_expires_at?: number;
  scope: string;
  tokenUpdatedAt?: number;
};
interface Context {
  session: {
    get: (key: string) => TokenType | string | undefined;
  };
}

export const exchangeToken = async (context: Context): Promise<string> => {
  const token = typeof context.session.get('token') === 'object' ? (context.session.get('token') as TokenType) : null;

  if (!token) {
    logger.error('exchangeToken No token found in session');
    return '';
  }
  try {
    const { data: newToken } = await axios.get(platformExchangeTokenEndpointURL, {
      headers: {
        Authorization: `Bearer ${token?.access_token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    return newToken;
  } catch (error) {
    logger.error('exchangeToken: Error fetching new token:', error);
  }
  return '';
};

export const getOrCreateProfile = async (context: Context): Promise<ProfileTable> => {
  const { disableProfile } = config;
  const pid = typeof context.session.get('pid') === 'string' ? (context.session.get('pid') as string) : '';
  const sessionLocale =
    typeof context.session.get('locale') === 'string' ? (context.session.get('locale') as string) : '';

  if (!pid) {
    logger.error('No pid provided');
    throw new Error('PID is required to get or create a profile');
  }
  const profile = await ProfileRepository!.createQueryBuilder('profile').where('profile.pid = :pid', { pid }).getOne();
  const exchangedToken = await exchangeToken(context);
  const groups = disableProfile ? [] : await getFavoritesFromCore(exchangedToken);

  if (!profile) {
    const newProfile = new ProfileTable();
    newProfile.pid = pid;
    newProfile.language = sessionLocale || 'nb';
    newProfile.groups = [];

    const savedProfile = await ProfileRepository!.save(newProfile);
    if (!savedProfile) {
      throw new Error('Fatal: Not able to create new profile');
    }
    return savedProfile;
  }

  profile.groups = groups;
  if (!profile.language) {
    profile.language = sessionLocale || 'nb';
    await ProfileRepository!.save(profile);
  }
  return profile;
};

export const addFavoriteParty = async (context: Context, partyUuid: string) => {
  const token = context.session.get('token');
  if (!token) {
    logger.error('No token found in session');
    return [];
  }
  const newToken = await exchangeToken(context);

  try {
    const response = await axios.put(
      `${platformProfileAPI_url}users/current/party-groups/favorites/${partyUuid}`,
      null,
      {
        headers: {
          Authorization: `Bearer ${newToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      },
    );
    return [response.data as Group];
  } catch (error) {
    logger.error('Error adding favorite:', error);
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
      console.info(`Party ${partyId} already exists in group ${categoryName}, skipping addition`);
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
  const token = context.session.get('token');
  if (!token) {
    logger.error('No token found in session');
    return [];
  }
  const newToken = await exchangeToken(context);

  const response = await axios
    .delete(`${platformProfileAPI_url}users/current/party-groups/favorites/${partyUuid}`, {
      headers: {
        Authorization: `Bearer ${newToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })
    .catch((error) => {
      logger.error({ status: error?.status, message: error?.message }, 'Error deleting favorite party:');
      return;
    });
  return response;
};

export const getUserFromCore = async (context: Context) => {
  try {
    const token = await exchangeToken(context);
    const { data } = await axios.get(`${platformProfileAPI_url}users/current`, {
      headers: {
        Authorization: `Bearer ${token}`,
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

export const getFavoritesFromCore = async (token: string) => {
  try {
    const { data } = await axios.get(`${platformProfileAPI_url}users/current/party-groups/favorites`, {
      headers: {
        Authorization: `Bearer ${token}`,
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
  const newToken = await exchangeToken(context);
  if (!newToken) {
    logger.error('No new token received');
    return;
  }

  let data = [] as unknown[];
  try {
    const response = await axios.get(`${platformProfileAPI_url}users/current/notificationsettings/parties`, {
      headers: {
        Authorization: `Bearer ${newToken}`,
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

export const updateNotificationsSetting = async (
  notificationSettingsInput: NotificationSettingsInputData,
  context: Context,
) => {
  const { partyUuid } = notificationSettingsInput;
  try {
    if (!partyUuid) {
      logger.error('No uuid found in data');
      return [];
    }
    const newToken = await exchangeToken(context);

    if (!newToken) {
      logger.error('No new token received');
      return;
    }
    const response = await axios.put(
      `${platformProfileAPI_url}users/current/notificationsettings/parties/${partyUuid}`,
      notificationSettingsInput,
      {
        headers: {
          Authorization: `Bearer ${newToken}`,
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
  try {
    if (!partyUuid) {
      logger.error('No uuid found in data');
      return;
    }
    const newToken = await exchangeToken(context);

    if (!newToken) {
      logger.error('No new token received');
      return;
    }
    const response = await axios.delete(
      `${platformProfileAPI_url}users/current/notificationsettings/parties/${partyUuid}`,
      {
        headers: {
          Authorization: `Bearer ${newToken}`,
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
  const token = context.session.get('token');
  if (!token) {
    logger.error('No token found in session');
    return;
  }
  if (!orgnr) {
    logger.error('No orgnr provided');
    return;
  }
  const newToken = await exchangeToken(context);
  if (!newToken) {
    logger.error('No new token received');
    return;
  }
  const { data, status, statusText } = await axios
    .get(`${platformProfileAPI_url}organizations/${orgnr}/notificationaddresses/mandatory`, {
      headers: {
        Authorization: `Bearer ${newToken}`,
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

export const updateLanguage = async (pid: string, language: string) => {
  const currentProfile = await ProfileRepository!.findOne({
    where: { pid },
  });
  if (!currentProfile) {
    throw new Error('Profile not found');
  }
  const updatedProfile = await ProfileRepository!.update(pid, {
    ...currentProfile,
    language,
  });
  if (!updatedProfile) {
    throw new Error('Failed to update profile');
  }
  return updatedProfile;
};
