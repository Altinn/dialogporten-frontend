import axios from 'axios';
import config from '../../config.ts';
import { GroupRepository, PartyRepository, ProfileRepository } from '../../db.ts';
import { Group, Party, ProfileTable } from '../../entities.ts';
const { platformProfileAPI_url, platformExchangeTokenEndpointURL } = config;

export const exchangeToken = async (context: Context): Promise<string> => {
  const token = context.session.get('token');
  if (!token) {
    console.error('No token found in session');
    return '';
  }
  const { data: newToken } = await axios.get(platformExchangeTokenEndpointURL, {
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });
  return newToken;
};

export const getOrCreateProfile = async (pid: string, sessionLocale: string, token: string): Promise<ProfileTable> => {
  const profile = await ProfileRepository!.createQueryBuilder('profile').where('profile.pid = :pid', { pid }).getOne();

  const groups = await getFavoritesFromCore(token);

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
    console.error('No token found in session');
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
    console.error('Error adding favorite:', error);
    throw new Error('Failed to add favorite');
  }
};

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
    console.error('No token found in session');
    return [];
  }
  const newToken = await exchangeToken(context);

  try {
    const response = await axios.delete(`${platformProfileAPI_url}users/current/party-groups/favorites/${partyUuid}`, {
      headers: {
        Authorization: `Bearer ${newToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    return [response.data as Group];
  } catch (error) {
    console.error('Error deleting favorite:', error);
    throw new Error('Failed to delete favorite');
  }
};

interface Context {
  session: {
    get: (key: string) => { access_token: string } | undefined;
  };
}

export const getUserFromCore = async (token: string) => {
  const { platformProfileAPI_url } = config;
  const { data: coreProfileData } = await axios
    .get(`${platformProfileAPI_url}users/current`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })
    .catch((error) => {
      console.error('Error fetching core profile data:', error);
      throw new Error('Failed to fetch core profile data');
    });
  if (!coreProfileData) {
    console.error('No core profile data found');
    return [];
  }
  return coreProfileData;
};

export const getFavoritesFromCore = async (token: string) => {
  const { data: coreFavoritesData } = await axios
    .get(`${platformProfileAPI_url}users/current/party-groups/favorites`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })
    .catch((error) => {
      console.error('Error fetching core profile data:', error);
      throw new Error('Failed to fetch core profile data');
    });
  if (!coreFavoritesData) {
    console.error('No core profile data found');
    return [];
  }

  return [coreFavoritesData as Group];
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
