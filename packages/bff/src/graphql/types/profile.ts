import { objectType } from 'nexus';

export const User = objectType({
  name: 'User',
  definition(t) {
    t.int('userId', {
      description: 'Unique identifier for the user',
      resolve: (user) => user.userId,
    });
    t.string('userUuid', {
      description: 'UUID identifier for the user',
      resolve: (user) => user.userUuid,
    });
    t.string('userName', {
      description: 'Display name of the user',
      resolve: (user) => user.userName,
    });
    t.string('externalIdentity', {
      description: 'External identity provider reference',
      resolve: (user) => user.externalIdentity,
    });
    t.boolean('isReserved', {
      description: 'Indicates if the user is reserved',
      resolve: (user) => user.isReserved,
    });
    t.nullable.string('phoneNumber', {
      description: 'Contact phone number',
      resolve: (user) => user.phoneNumber,
    });
    t.nullable.string('email', {
      description: 'Contact email address',
      resolve: (user) => user.email,
    });
    t.int('partyId', {
      description: 'Associated party ID',
      resolve: (user) => user.partyId,
    });
    t.field('party', {
      type: 'Party',
      description: 'Associated party details',
      resolve: (user) => user.party,
    });
    t.int('userType', {
      description: 'Type classification of the user',
      resolve: (user) => user.userType,
    });
    t.field('profileSettingPreference', {
      type: 'ProfileSettingPreference',
      description: 'User preference settings',
      resolve: (user) => user.profileSettingPreference,
    });
  },
});

export const Group = objectType({
  name: 'Group',
  definition(t) {
    t.int('id', { resolve: (group) => group.id });
    t.string('name', { resolve: (group) => group.name });
    t.boolean('isfavorite', { resolve: (group) => group.isfavorite });
    t.string('profilePid', { resolve: (group) => group.profile?.pid });
    t.list.field('parties', { type: 'PartyObject', resolve: (group) => group.parties });
  },
});

export const PartyObject = objectType({
  name: 'PartyObject',
  definition(t) {
    t.string('id', { resolve: (party) => party.id });
    t.list.field('groups', { type: 'Group', resolve: (party) => party.groups });
  },
});

export const Party = objectType({
  name: 'Party',
  definition(t) {
    t.int('partyId', { resolve: (party) => party.partyId });
    t.string('partyUuid', { resolve: (party) => party.partyUuid });
    t.int('partyTypeName', { resolve: (party) => party.partyTypeName });
    t.string('orgNumber', { resolve: (party) => party.orgNumber });
    t.string('ssn', { resolve: (party) => party.ssn });
    t.nullable.string('unitType', {
      resolve: (party) => party.unitType,
    });
    t.string('name', { resolve: (party) => party.name });
    t.boolean('isDeleted', { resolve: (party) => party.isDeleted });
    t.boolean('onlyHierarchyElementWithNoAccess', {
      resolve: (party) => party.onlyHierarchyElementWithNoAccess,
    });
    t.field('person', {
      type: 'Person',
      resolve: (party) => party.person,
    });
    t.nullable.string('organization', {
      resolve: (party) => party.organization,
    });
    t.nullable.list.field('childParties', {
      type: 'Party',
      resolve: (party) => party.childParties,
    });
  },
});

export const Person = objectType({
  name: 'Person',
  definition(t) {
    t.string('ssn', { resolve: (person) => person.ssn });
    t.string('name', { resolve: (person) => person.name });
    t.string('firstName', { resolve: (person) => person.firstName });
    t.string('middleName', { resolve: (person) => person.middleName });
    t.string('lastName', { resolve: (person) => person.lastName });
    t.string('telephoneNumber', { resolve: (person) => person.telephoneNumber });
    t.string('mobileNumber', { resolve: (person) => person.mobileNumber });
    t.string('mailingAddress', { resolve: (person) => person.mailingAddress });
    t.string('mailingPostalCode', { resolve: (person) => person.mailingPostalCode });
    t.string('mailingPostalCity', { resolve: (person) => person.mailingPostalCity });
    t.string('addressMunicipalNumber', { resolve: (person) => person.addressMunicipalNumber });
    t.string('addressMunicipalName', { resolve: (person) => person.addressMunicipalName });
    t.string('addressStreetName', { resolve: (person) => person.addressStreetName });
    t.string('addressHouseNumber', { resolve: (person) => person.addressHouseNumber });
    t.string('addressHouseLetter', { resolve: (person) => person.addressHouseLetter });
    t.string('addressPostalCode', { resolve: (person) => person.addressPostalCode });
    t.string('addressCity', { resolve: (person) => person.addressCity });
    t.nullable.string('dateOfDeath', {
      resolve: (person) => person.dateOfDeath,
    });
  },
});

export const ProfileSettingPreference = objectType({
  name: 'ProfileSettingPreference',
  definition(t) {
    t.string('language', { resolve: (pref) => pref.language });
    t.int('preSelectedPartyId', { resolve: (pref) => pref.preSelectedPartyId });
    t.boolean('doNotPromptForParty', { resolve: (pref) => pref.doNotPromptForParty });
  },
});

export const Profile = objectType({
  name: 'Profile',
  definition(t) {
    t.string('language', {
      description: 'Preferred language for the profile',
      resolve: (profile) => {
        return profile.language;
      },
    });
    t.field('user', {
      type: 'User',
      description: 'The users profile information',
      resolve: (profile) => {
        return profile.user;
      },
    });
    t.list.field('groups', { type: 'Group', resolve: (profile) => profile.groups || [] });

    t.string('updatedAt', {
      description: 'Last updated',
      resolve: (profile) => {
        return profile.updatedAt;
      },
    });
  },
});
