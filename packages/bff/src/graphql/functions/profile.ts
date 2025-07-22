import axios from 'axios';
import config from '../../config.ts';
import { GroupRepository, PartyRepository, ProfileRepository } from '../../db.ts';
import { Group, Party, ProfileTable } from '../../entities.ts';

export const getOrCreateProfile = async (pid: string, sessionLocale: string): Promise<ProfileTable> => {
  const profile = await ProfileRepository!
    .createQueryBuilder('profile')
    .leftJoinAndSelect('profile.groups', 'groups') // Profile's groups
    .leftJoinAndSelect('groups.parties', 'parties') // Parties in those groups
    .leftJoinAndSelect('parties.groups', 'partyGroups') // All groups linked to each party
    .where('profile.pid = :pid', { pid })
    .getOne();

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

  if (!profile.language) {
    profile.language = sessionLocale || 'nb';
    await ProfileRepository!.save(profile);
  }
  return profile;
};

export const addFavoriteParty = async (pid: string, partyId: string) => {
  const categoryName = 'favorites';
  const currentProfile = await ProfileRepository!.findOne({
    where: { pid },
  });

  if (!currentProfile) {
    throw new Error('Profile not found');
  }

  let group = await GroupRepository!.findOne({
    where: { isfavorite: true, profile: { pid } },
  });

  if (!group) {
    const newGroup = new Group();
    newGroup.profile = currentProfile;
    newGroup.name = 'Favorites';
    newGroup.isfavorite = true;
    group = await GroupRepository!.save(newGroup);

    if (!newGroup) {
      throw new Error('Fatal: Not able to create favorite group');
    }
  }
  const currentParty = await PartyRepository!.findOne({
    where: { id: partyId, groups: { id: group.id } },
    relations: ['groups'],
  });
  if (currentParty) {
    console.info(`Party ${partyId} already exists in group ${categoryName}, skipping addition`);
    return currentProfile;
  }

  let party = await PartyRepository!.findOne({ where: { id: partyId }, relations: ['groups'] });
  if (!party) {
    party = new Party();
    party.id = partyId;
    await PartyRepository!.save(party);
  }

  await PartyRepository!.createQueryBuilder().relation(Party, 'groups').of(party.id).add(group.id);

  if (!party) {
    throw new Error('Fatal: Not able to create new party');
  }

  const currentFavorites = currentProfile.groups || [];

  const existingGroupNames = new Set(currentFavorites.map((g) => g.name));
  if (existingGroupNames.has(categoryName)) {
    console.info(`Party ${partyId} already exists in favorites for category ${categoryName}, skipping addition`);
    return currentProfile;
  }

  await ProfileRepository!.createQueryBuilder().relation(ProfileTable, 'groups').of(currentProfile.pid).add(group.id);

  const updatedProfile = await ProfileRepository!.findOne({
    where: { pid: currentProfile.pid },
    relations: ['groups'],
  });

  if (!updatedProfile) {
    throw new Error('Failed to update profile');
  }
  return updatedProfile;
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

export const deleteFavoriteParty = async (pid: string, partyId: string, groupId: string) => {
  try {
    const group = await GroupRepository!.findOne({
      where: { id: Number.parseInt(groupId), profile: { pid } },
      relations: ['profile'],
    });

    if (!group) {
      console.info(`Group with ID ${groupId} not found for profile ${pid}`);
      throw new Error('Group not found or does not belong to this profile');
    }
    await GroupRepository!.createQueryBuilder().relation(Group, 'parties').of(groupId).remove(partyId);

    return { success: true };
  } catch (error) {
    console.error('Error deleting party from group:', error);
    throw error;
  }
};

interface Context {
  session: {
    get: (key: string) => { access_token: string } | undefined;
  };
}

export const getUserFromCore = async (pid: string, context: Context) => {
  const { platformExchangeTokenEndpointURL, platformProfileAPI_url } = config;
  // const favs = await getFavoritesFromCore(pid, context);
  // console.info('Fetching favorites from core profile API', favs);
  // const notifications = await getNotificationsFromCore(pid, context);
  // console.info('Fetching notifications from core profile API', notifications);
  const organisations = await getOrganisationsFromCore(pid, context);
  console.info('Fetching Organisations from core profile API', organisations);

  const token = context.session.get('token');
  if (!token) {
    console.error('No token found in session');
    return [];
  }
  const { data: newToken } = await axios.get(platformExchangeTokenEndpointURL, {
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });
  const { data: coreProfileData } = await axios
    .get(`${platformProfileAPI_url}users/current`, {
      headers: {
        Authorization: `Bearer ${newToken}`,
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

export const getFavoritesFromCore = async (pid: string, context: Context) => {
  const { platformExchangeTokenEndpointURL, platformProfileAPI_url } = config;
  const token = context.session.get('token');
  if (!token) {
    console.error('No token found in session');
    return [];
  }
  const { data: newToken } = await axios.get(platformExchangeTokenEndpointURL, {
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });
  const { data: coreProfileData } = await axios
    .get(`${platformProfileAPI_url}users/current/party-groups/favorites`, {
      headers: {
        Authorization: `Bearer ${newToken}`,
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

export const getNotificationsFromCore = async (pid: string, context: Context) => {
  const { platformExchangeTokenEndpointURL, platformProfileAPI_url } = config;
  const token = context.session.get('token');
  if (!token) {
    console.error('No token found in session');
    return [];
  }
  const { data: newToken } = await axios.get(platformExchangeTokenEndpointURL, {
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });
  const partyUuid = '053c8c93-b3ba-44f4-b6fb-fdecc333c749'; // Replace with actual party UUID if needed
  console.info('!!!!!!!!!!!!! platformProfileAPI_url', platformProfileAPI_url);
  const { data: coreProfileData } = await axios
    .get(`${platformProfileAPI_url}users/current/notificationsettings/parties/${partyUuid}`, {
      headers: {
        Authorization: `Bearer ${newToken}`,
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

export const getOrganisationsFromCore = async (pid: string, context: Context) => {
  const { platformExchangeTokenEndpointURL, platformProfileAPI_url } = config;
  const token = context.session.get('token');
  if (!token) {
    console.error('No token found in session');
    return [];
  }
  const { data: newToken } = await axios.get(platformExchangeTokenEndpointURL, {
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });
  const organizationNumber = '310412406'; // Replace with actual party UUID if needed
  const { data: coreProfileData } = await axios
    .get(`${platformProfileAPI_url}organizations/${organizationNumber}/notificationaddresses/mandatory`, {
      headers: {
        Authorization: `Bearer ${newToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })
    .catch((error) => {
      console.error('Error fetching core Organisations data:', error);
      throw new Error('Failed to fetch core Organisations data');
    });
  if (!coreProfileData) {
    console.error('No core Organisationsv data found');
    return [];
  }
  return coreProfileData;
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
