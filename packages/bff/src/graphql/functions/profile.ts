import axios from 'axios';
import config from '../../config.ts';
import { ProfileRepository } from '../../db.ts';
import { ProfileTable } from '../../entities.ts';

export const getOrCreateProfile = async (pid: string, sessionLocale: string): Promise<ProfileTable> => {
  const profile = await ProfileRepository!.findOne({
    where: { pid },
  });

  if (!profile) {
    const newProfile = new ProfileTable();
    newProfile.pid = pid;
    newProfile.language = sessionLocale || 'nb';
    newProfile.favoriteActors = [];

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

export const addFavoriteActor = async (pid: string, actorId: string) => {
  const currentProfile = await ProfileRepository!.findOne({
    where: { pid },
  });

  if (!currentProfile) {
    throw new Error('Profile not found');
  }
  const currentFavorites = currentProfile.favoriteActors || [];
  if (currentFavorites.includes(actorId)) {
    console.info(`Actor ${actorId} already exists in favorites, skipping addition`);
    return currentProfile;
  }

  const updatedFavorites = [...currentFavorites, actorId];

  const updatedProfile = await ProfileRepository!.update(pid, {
    favoriteActors: updatedFavorites,
  });

  if (!updatedProfile) {
    throw new Error('Failed to update profile');
  }
  return updatedProfile;
};

export const deleteFavoriteActor = async (pid: string, actorId: string) => {
  const currentProfile = await ProfileRepository!.findOne({
    where: { pid },
  });
  if (!currentProfile) {
    throw new Error('Profile not found');
  }
  const updatedProfile = await ProfileRepository!.update(pid, {
    ...currentProfile,
    favoriteActors: currentProfile.favoriteActors.filter((actor: string) => actor !== actorId),
  });
  if (!updatedProfile) {
    throw new Error('Failed to delete profile');
  }
  return updatedProfile;
};

interface Context {
  session: {
    get: (key: string) => { access_token: string } | undefined;
  };
}

export const getUserFromCore = async (pid: string, context: Context) => {
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
