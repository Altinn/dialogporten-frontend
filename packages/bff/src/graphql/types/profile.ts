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
    t.list.string('favoriteActors', {
      description: 'The users favorite actors',
      resolve: (profile) => {
        return profile.favoriteActors;
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
