import { objectType } from 'nexus';

export const Profile = objectType({
  name: 'Profile',
  definition(t) {
    t.string('language', {
      description: 'Preferred language for the profile',
      resolve: (profile) => {
        return profile.language;
      },
    });
    t.string('updatedAt', {
      description: 'Last updated',
      resolve: (profile) => {
        return profile.updatedAt;
      },
    });
  },
});
