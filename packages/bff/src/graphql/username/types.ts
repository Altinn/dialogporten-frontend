import { objectType } from 'nexus';

export const UsernameResponse = objectType({
  name: 'UsernameResponse',
  definition(t) {
    t.nullable.string('username');
  },
});
