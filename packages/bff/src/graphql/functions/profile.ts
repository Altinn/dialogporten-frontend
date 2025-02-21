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
