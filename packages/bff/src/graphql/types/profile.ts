import { inputObjectType, objectType } from 'nexus';

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

export const GroupObject = objectType({
  name: 'GroupObject',
  definition(t) {
    t.int('id', { resolve: (group) => group.id });
    t.string('name', { resolve: (group) => group.name });
    t.boolean('isFavorite', { resolve: (group) => group.isFavorite });
    t.string('profilePid', { resolve: (group) => group.profile?.pid });
    t.list.string('parties', { resolve: (group) => group.parties });
  },
});

export const PartyObject = objectType({
  name: 'PartyObject',
  definition(t) {
    t.string('id', { resolve: (party) => party.id });
    t.list.field('groups', { type: 'GroupObject', resolve: (party) => party.groups });
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
    t.list.field('groups', { type: 'GroupObject', resolve: (profile) => profile.groups || [] });

    t.string('updatedAt', {
      description: 'Last updated',
      resolve: (profile) => {
        return profile.updatedAt;
      },
    });
  },
});

export const NotificationAddressModel = objectType({
  name: 'NotificationAddressModel',
  description: 'Represents a notification address',
  definition(t) {
    t.nullable.string('countryCode', {
      description: 'Country code for phone number',
      resolve: (obj) => obj.countryCode,
    });
    t.nullable.string('email', {
      description: 'Email address',
      resolve: (obj) => obj.email,
    });
    t.nullable.string('phone', {
      description: 'Phone number',
      resolve: (obj) => obj.phone,
    });
  },
});

export const NotificationAddressResponse = objectType({
  name: 'NotificationAddressResponse',
  description: 'Represents a notification address',
  definition(t) {
    t.nullable.string('countryCode', {
      description: 'Country code for phone number',
      resolve: (obj) => obj.countryCode,
    });
    t.nullable.string('email', {
      description: 'Email address',
      resolve: (obj) => obj.email,
    });
    t.nullable.string('phone', {
      description: 'Phone number',
      resolve: (obj) => obj.phone,
    });
    t.int('notificationAddressId', {
      description: 'Altinn.Profile.Models.NotificationAddressResponse.NotificationAddressId',
      resolve: (obj) => obj.notificationAddressId,
    });
  },
});

export const OrganizationResponse = objectType({
  name: 'OrganizationResponse',
  description: 'Represents an organization with notification addresses',
  definition(t) {
    t.nullable.string('organizationNumber', {
      description: "The organization's organization number",
      resolve: (obj) => obj.organizationNumber,
    });
    t.nullable.list.field('notificationAddresses', {
      type: 'NotificationAddressResponse',
      description: 'Represents a list of mandatory notification address',
      resolve: (obj) => obj.notificationAddresses,
    });
  },
});

export const ProblemDetails = objectType({
  name: 'ProblemDetails',
  definition(t) {
    t.nullable.string('type', { resolve: (obj) => obj.type });
    t.nullable.string('title', { resolve: (obj) => obj.title });
    t.nullable.int('status', { resolve: (obj) => obj.status });
    t.nullable.string('detail', { resolve: (obj) => obj.detail });
    t.nullable.string('instance', { resolve: (obj) => obj.instance });
  },
});

export const NotificationSettingsResponse = objectType({
  name: 'NotificationSettingsResponse',
  description:
    'Response model for the professional notification address for an organization, also called personal notification address.',
  definition(t) {
    t.nullable.string('emailAddress', {
      description: 'The email address. May be null if no email address is set.',
      resolve: (obj) => obj.emailAddress,
    });
    t.nullable.string('phoneNumber', {
      description: 'The phone number. May be null if no phone number is set.',
      resolve: (obj) => obj.phoneNumber,
    });
    t.nullable.list.string('resourceIncludeList', {
      description:
        'A list of resources that the user has registered to receive notifications for. The format is in URN. This is used to determine which resources the user can receive notifications for.',
      resolve: (obj) => obj.resourceIncludeList,
    });
    t.int('userId', {
      description: 'The user id of logged-in user for whom the specific contact information belongs to.',
      resolve: (obj) => obj.userId,
    });
    t.string('partyUuid', {
      description: 'ID of the party',
      resolve: (obj) => obj.partyUuid,
    });
  },
});

export const NotificationSettingsInput = inputObjectType({
  name: 'NotificationSettingsInput',
  definition(t) {
    t.int('userId');
    t.string('partyUuid');
    t.string('emailAddress');
    t.string('phoneNumber');
    t.list.string('resourceIncludeList');
  },
});

export interface NotificationSettingsInputData {
  userId: number;
  partyUuid: string;
  emailAddress?: string;
  phoneNumber?: string;
  resourceIncludeList?: string[];
}

export const ProfileSettingPreference = objectType({
  name: 'ProfileSettingPreference',
  definition(t) {
    t.nullable.string('languageType', { resolve: (obj) => obj.languageType }); // added based on spec, marked 'writeOnly' in spec but ignoring here
    t.nullable.string('language', { resolve: (obj) => obj.language });
    t.nullable.string('preselectedPartyUuid', {
      resolve: (obj) => obj.preselectedPartyUuid ?? obj.preSelectedPartyUuid,
    });
    t.boolean('doNotPromptForParty', { resolve: (obj) => obj.doNotPromptForParty });
    t.nullable.boolean('shouldShowDeletedEntities', { resolve: (obj) => obj.shouldShowDeletedEntities });
  },
});

export const UserProfile = objectType({
  name: 'UserProfile',
  definition(t) {
    t.int('userId', { resolve: (obj) => obj.userId });
    t.nullable.string('userUuid', { resolve: (obj) => obj.userUuid });
    t.nullable.string('userName', { resolve: (obj) => obj.userName });
    t.nullable.string('externalIdentity', { resolve: (obj) => obj.externalIdentity });
    t.boolean('isReserved', { resolve: (obj) => obj.isReserved });
    t.nullable.string('phoneNumber', { resolve: (obj) => obj.phoneNumber });
    t.nullable.string('email', { resolve: (obj) => obj.email });
    t.int('partyId', { resolve: (obj) => obj.partyId });
    t.field('party', { type: 'Party', resolve: (obj) => obj.party });
    t.int('userType', { resolve: (obj) => obj.userType });
    t.field('profileSettingPreference', {
      type: 'ProfileSettingPreference',
      resolve: (obj) => obj.profileSettingPreference,
    });
  },
});
