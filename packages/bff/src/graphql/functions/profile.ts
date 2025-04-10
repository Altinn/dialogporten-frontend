import { ProfileRepository } from '../../db.ts';
import { ProfileTable } from '../../entities.ts';

export const getOrCreateProfile = async (pid: string, locale: string): Promise<ProfileTable> => {
  const profile = await ProfileRepository!.findOne({
    where: { pid },
  });

  if (!profile) {
    const newProfile = new ProfileTable();
    newProfile.pid = pid;
    newProfile.language = locale || 'nb';
    newProfile.favoriteActors = [];

    const savedProfile = await ProfileRepository!.save(newProfile);
    if (!savedProfile) {
      throw new Error('Fatal: Not able to create new profile');
    }
    return savedProfile;
  }
  if (profile?.language !== locale) {
    profile.language = locale;
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
